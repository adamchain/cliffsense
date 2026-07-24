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
        if (user.status === "disabled") {
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
          applicationStatus: user.applicationStatus ?? "approved",
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
        if (user.status === "disabled") {
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
          applicationStatus: user.applicationStatus ?? "approved",
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
        token.applicationStatus = (user as { applicationStatus?: string }).applicationStatus ?? "approved";
      }
      if (trigger === "update" && session) {
        const s = session as Record<string, unknown>;
        if (s.action === "impersonate" && typeof s.targetUserId === "string") {
          // Only a real, non-impersonating admin may start impersonation. The
          // token's isAdmin still reflects the real admin here (not yet swapped).
          if (token.isAdmin === true && !token.impersonatorId) {
            await connectDB();
            const target = await User.findById(s.targetUserId)
              .select("email name accountType isAdmin onboardingStep applicationStatus")
              .lean();
            if (target && target._id.toString() !== token.sub) {
              token.impersonatorId = token.sub;
              token.impersonatorEmail = (token.email as string) ?? "";
              token.impersonatorName = (token.name as string) ?? "";
              token.sub = target._id.toString();
              token.email = target.email;
              token.name = target.name ?? "";
              token.accountType = target.accountType;
              token.isAdmin = Boolean(target.isAdmin);
              token.onboardingStep = target.onboardingStep ?? "none";
              token.applicationStatus = target.applicationStatus ?? "approved";
            }
          }
        } else if (s.action === "stopImpersonate") {
          if (token.impersonatorId) {
            await connectDB();
            const admin = await User.findById(token.impersonatorId)
              .select("email name accountType isAdmin onboardingStep applicationStatus")
              .lean();
            if (admin) {
              token.sub = admin._id.toString();
              token.email = admin.email;
              token.name = admin.name ?? "";
              token.accountType = admin.accountType;
              token.isAdmin = Boolean(admin.isAdmin);
              token.onboardingStep = admin.onboardingStep ?? "none";
              token.applicationStatus = admin.applicationStatus ?? "approved";
            }
            token.impersonatorId = undefined;
            token.impersonatorEmail = undefined;
            token.impersonatorName = undefined;
          }
        } else if (s.action === "refreshApplication") {
          // After an admin decision, an applicant's token still says
          // "pending_review". Re-read from the DB so the middleware gate lifts
          // without forcing a full sign-out/in. Safe: only reads the caller's
          // own record (token.sub).
          await connectDB();
          const fresh = await User.findById(token.sub)
            .select("onboardingStep applicationStatus")
            .lean();
          if (fresh) {
            token.onboardingStep = fresh.onboardingStep ?? "none";
            token.applicationStatus = fresh.applicationStatus ?? "approved";
          }
        } else {
          if (typeof s.name === "string") token.name = s.name as string;
          if (typeof s.onboardingStep === "string") {
            token.onboardingStep = s.onboardingStep as string;
          }
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
        session.user.applicationStatus = (token.applicationStatus as string) ?? "approved";
        session.user.impersonatorId = token.impersonatorId;
        session.user.impersonatorEmail = token.impersonatorEmail;
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
/** Server-side session/JWT update — used by admin impersonation routes. */
export const updateSession = nextAuth.unstable_update;
/** Dedupes session work when both a layout and a page call `auth()` in the same RSC request. */
export const auth = cache(nextAuth.auth);
