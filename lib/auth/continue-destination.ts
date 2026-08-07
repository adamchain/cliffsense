import { onboardingPathForStep } from "@/lib/onboarding/steps";

/** Where a signed-in user should go when leaving the marketing landing page. */
export function continueDestination(user: {
  name?: string | null;
  onboardingStep?: string | null;
  applicationStatus?: string | null;
}): { href: string; ctaLabel: string } {
  const status = user.applicationStatus ?? "approved";
  const step = user.onboardingStep ?? "none";
  const first = user.name?.trim().split(/\s+/)[0];

  if (status === "pending_review" || status === "rejected") {
    return {
      href: "/application",
      ctaLabel: first ? `Continue to ${first}'s application` : "Continue to your application",
    };
  }

  if (step !== "complete") {
    return {
      href: onboardingPathForStep(step),
      ctaLabel: first ? `Continue ${first}'s setup` : "Continue setup",
    };
  }

  return {
    href: "/dashboard",
    ctaLabel: first ? `Go to ${first}'s dashboard` : "Go to your dashboard",
  };
}
