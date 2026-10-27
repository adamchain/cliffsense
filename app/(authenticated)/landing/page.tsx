import type { Metadata } from "next";
import { auth } from "@/auth";
import { StayConnectedPage } from "@/components/landing/stay-connected";
import { continueDestination } from "@/lib/auth/continue-destination";

export const metadata: Metadata = {
  title: "Bene-Watch — Keeping PA Connected",
  description:
    "Bene-Watch helps you track benefit requirements so you don't get lost in the shuffle.",
};

export default async function LandingPage() {
  const session = await auth();
  const continueTo = session?.user
    ? continueDestination({
        name: session.user.name,
        onboardingStep: session.user.onboardingStep,
        applicationStatus: session.user.applicationStatus,
      })
    : null;

  return (
    <StayConnectedPage
      signInHref={continueTo ? null : "/auth/signin"}
      startHref={continueTo?.href ?? "/auth/signup"}
      startLabel={continueTo ? "Continue" : "Get Started"}
    />
  );
}
