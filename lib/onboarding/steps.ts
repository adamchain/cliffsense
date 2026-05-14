export type OnboardingStepId = "profile" | "beneficiary" | "plaid" | "benefits" | "notifications";

export type OnboardingStep = {
  id: OnboardingStepId;
  /** Short label under the progress segment */
  label: string;
  path: string;
};

/** Ordered steps for the signed-in user (beneficiary skips “add person”). */
export function getOnboardingSteps(accountType: string | undefined): OnboardingStep[] {
  const steps: OnboardingStep[] = [{ id: "profile", label: "Profile", path: "/onboarding/profile" }];
  if (accountType && accountType !== "beneficiary") {
    steps.push({ id: "beneficiary", label: "Person", path: "/onboarding/beneficiary" });
  }
  steps.push(
    { id: "plaid", label: "Plaid", path: "/onboarding/plaid" },
    { id: "benefits", label: "Programs", path: "/onboarding/benefits" },
    { id: "notifications", label: "Email", path: "/onboarding/notifications" },
  );
  return steps;
}

export function onboardingStepIndex(steps: OnboardingStep[], currentId: OnboardingStepId): number {
  const i = steps.findIndex((s) => s.id === currentId);
  return i >= 0 ? i : 0;
}

/** Maps persisted `User.onboardingStep` / JWT to the route to resume onboarding. */
export function onboardingPathForStep(step: string): string {
  switch (step) {
    case "none":
    case "profile":
      return "/onboarding/profile";
    case "beneficiary":
      return "/onboarding/beneficiary";
    case "plaid":
      return "/onboarding/plaid";
    case "benefits":
      return "/onboarding/benefits";
    case "notifications":
      return "/onboarding/notifications";
    default:
      return "/onboarding/profile";
  }
}
