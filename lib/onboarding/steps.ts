export const ONBOARDING_STEP_VALUES = [
  "none",
  "role",
  "profile",
  "beneficiary",
  "authority",
  "benefits",
  "plaid",
  "notifications",
  "complete",
] as const;

export type PersistedOnboardingStep = (typeof ONBOARDING_STEP_VALUES)[number];

export type OnboardingStepId = "role" | "profile" | "beneficiary" | "authority" | "benefits" | "plaid" | "notifications";

export type OnboardingStep = {
  id: OnboardingStepId;
  /** Short label under the progress segment */
  label: string;
  path: string;
};

/** Ordered steps for the signed-in user (beneficiary skips “add person”). */
export function getOnboardingSteps(accountType: string | undefined): OnboardingStep[] {
  const steps: OnboardingStep[] = [
    { id: "role", label: "Role", path: "/onboarding/role" },
    { id: "profile", label: "Identity", path: "/onboarding/profile" },
  ];
  if (accountType && accountType !== "beneficiary") {
    steps.push({ id: "beneficiary", label: "Person", path: "/onboarding/beneficiary" });
  }
  steps.push(
    { id: "authority", label: "Authority", path: "/onboarding/authority" },
    { id: "benefits", label: "Programs", path: "/onboarding/benefits" },
    { id: "plaid", label: "Bank", path: "/onboarding/plaid" },
    { id: "notifications", label: "Alerts", path: "/onboarding/notifications" },
  );
  return steps;
}

export function onboardingStepIndex(steps: OnboardingStep[], currentId: OnboardingStepId): number {
  const i = steps.findIndex((s) => s.id === currentId);
  return i >= 0 ? i : 0;
}

export function nextStepAfterProfile(accountType: string): OnboardingStepId {
  return accountType === "beneficiary" ? "authority" : "beneficiary";
}

export function pathForOnboardingStepId(id: OnboardingStepId): string {
  switch (id) {
    case "role":
      return "/onboarding/role";
    case "profile":
      return "/onboarding/profile";
    case "beneficiary":
      return "/onboarding/beneficiary";
    case "authority":
      return "/onboarding/authority";
    case "benefits":
      return "/onboarding/benefits";
    case "plaid":
      return "/onboarding/plaid";
    case "notifications":
      return "/onboarding/notifications";
  }
}

/** Maps persisted `User.onboardingStep` / JWT to the route to resume onboarding. */
export function onboardingPathForStep(step: string): string {
  switch (step) {
    case "none":
    case "role":
      return "/onboarding/role";
    case "profile":
      return "/onboarding/profile";
    case "beneficiary":
      return "/onboarding/beneficiary";
    case "authority":
      return "/onboarding/authority";
    case "plaid":
      return "/onboarding/plaid";
    case "benefits":
      return "/onboarding/benefits";
    case "notifications":
      return "/onboarding/notifications";
    default:
      return "/onboarding/role";
  }
}
