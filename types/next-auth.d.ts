import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      accountType: string;
      isAdmin: boolean;
      onboardingStep: string;
      /** Set while an admin is impersonating this user (the real admin's id). */
      impersonatorId?: string;
      /** The real admin's email, for the "viewing as" banner. */
      impersonatorEmail?: string;
    } & DefaultSession["user"];
  }

  interface User {
    accountType?: string;
    isAdmin?: boolean;
    onboardingStep?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accountType?: string;
    isAdmin?: boolean;
    onboardingStep?: string;
    /** Impersonation: the real admin's identity, preserved so we can restore it. */
    impersonatorId?: string;
    impersonatorEmail?: string;
    impersonatorName?: string;
  }
}
