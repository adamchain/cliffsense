import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      accountType: string;
      isAdmin: boolean;
      onboardingStep: string;
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
  }
}
