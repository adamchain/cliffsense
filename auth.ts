import NextAuth from "next-auth";
import { cache } from "react";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import { logActivity } from "@/lib/activity/log-activity";
import { consumeLoginCode } from "@/lib/auth/tokens";

const nextAuth = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const email = String(credentials.email).toLowerCase().trim();
        await connectDB();
        const user = await User.findOne({ email }).lean();
        if (!user?.hashedPassword) {
          return null;
        }
        const ok = await bcrypt.compare(String(credentials.password), user.hashedPassword);
        if (!ok) {
          return null;
        }
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name ?? "",
          accountType: user.accountType,
          isAdmin: user.isAdmin,
          onboardingStep: user.onboardingStep ?? "none",
        };
      },
    }),
    Credentials({
      id: "email-code",
      name: "email-code",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.code) {
          return null;
        }
        const email = String(credentials.email).toLowerCase().trim();
        const code = String(credentials.code).replace(/\D/g, "");
        if (code.length !== 6) {
          return null;
        }
        await connectDB();
        const user = await User.findOne({ email }).lean();
        if (!user) {
          return null;
        }
        const ok = await consumeLoginCode(user._id, code);
        if (!ok) {
          return null;
        }
        // A valid email code also proves ownership of the address.
        if (!user.emailVerified) {
          await User.updateOne(
            { _id: user._id, emailVerified: null },
            { $set: { emailVerified: new Date() } },
          );
        }
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name ?? "",
          accountType: user.accountType,
          isAdmin: user.isAdmin,
          onboardingStep: user.onboardingStep ?? "none",
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.accountType = (user as { accountType?: string }).accountType;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin;
        token.onboardingStep = (user as { onboardingStep?: string }).onboardingStep;
      }
      if (trigger === "update" && session) {
        if (typeof session.name === "string") token.name = session.name;
        if (typeof session.onboardingStep === "string") {
          token.onboardingStep = session.onboardingStep;
        }
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.name = (token.name as string) ?? session.user.email ?? "";
        session.user.accountType = (token.accountType as string) ?? "beneficiary";
        session.user.isAdmin = Boolean(token.isAdmin);
        session.user.onboardingStep = (token.onboardingStep as string) ?? "none";
      }
      return session;
    },
  },
  events: {
    signIn: async ({ user, account }) => {
      const provider = account?.provider;
      if ((provider !== "credentials" && provider !== "email-code") || !user?.id) return;
      await connectDB();
      await User.updateOne({ _id: user.id }, { $set: { lastLoginAt: new Date() } });
      await logActivity({
        userId: user.id,
        category: "auth",
        action: "login",
        details: { provider },
      });
    },
  },
});

export const handlers = nextAuth.handlers;
export const signIn = nextAuth.signIn;
export const signOut = nextAuth.signOut;
/** Dedupes session work when both a layout and a page call `auth()` in the same RSC request. */
export const auth = cache(nextAuth.auth);
