import { encode } from "next-auth/jwt";
import { cookies } from "next/headers";

const MAX_AGE = 30 * 24 * 60 * 60;

export function mainSessionCookieName(): string {
  const secure = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
  return secure ? "__Secure-authjs.session-token" : "authjs.session-token";
}

export type MainAppSessionUser = {
  id: string;
  email: string;
  name: string;
  accountType: string;
  isAdmin: boolean;
  onboardingStep: string;
  applicationStatus: string;
  impersonatorId?: string;
  impersonatorEmail?: string;
  impersonatorName?: string;
};

/** Write the main-app session cookie. Used when an admin opens the app as someone else. */
export async function writeMainAppSession(user: MainAppSessionUser): Promise<void> {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("Missing auth secret");
  const name = mainSessionCookieName();
  const token = await encode({
    token: {
      sub: user.id,
      email: user.email,
      name: user.name,
      accountType: user.accountType,
      isAdmin: user.isAdmin,
      onboardingStep: user.onboardingStep,
      applicationStatus: user.applicationStatus,
      impersonatorId: user.impersonatorId,
      impersonatorEmail: user.impersonatorEmail,
      impersonatorName: user.impersonatorName,
    },
    secret,
    salt: name,
    maxAge: MAX_AGE,
  });
  const store = await cookies();
  store.set(name, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: name.startsWith("__Secure-"),
    maxAge: MAX_AGE,
  });
}
