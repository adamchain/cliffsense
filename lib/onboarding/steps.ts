export const ONBOARDING_STEP_VALUES = [
  "none",
  "role",
  "profile",
  "beneficiary",
  "authority",
  "benefits",
  "plaid",
  "notifications",
  "agreement",
  "setup",
  "complete",
] as const;

export type PersistedOnboardingStep = (typeof ONBOARDING_STEP_VALUES)[number];

/** The three screens a new account actually sees. */
export type OnboardingStepId = "agreement" | "setup" | "notifications";

export type OnboardingStep = {
  id: OnboardingStepId;
  /** Short label under the progress segment */
  label: string;
  path: string;
};

/** Agreement, the person and their programs, then alerts. Bank linking is later. */
export function getOnboardingSteps(_accountType?: string): OnboardingStep[] {
  return [
    { id: "agreement", label: "Agreement", path: "/onboarding/agreement" },
    { id: "setup", label: "Person", path: "/onboarding/setup" },
    { id: "notifications", label: "Alerts", path: "/onboarding/notifications" },
  ];
}

export function onboardingStepIndex(steps: OnboardingStep[], currentId: OnboardingStepId): number {
  const i = steps.findIndex((s) => s.id === currentId);
  return i >= 0 ? i : 0;
}

export function pathForOnboardingStepId(id: OnboardingStepId): string {
  return getOnboardingSteps().find((s) => s.id === id)?.path ?? "/onboarding/agreement";
}

/**
 * A saved step may continue only after the beta agreement is stored.
 * The agreement screen itself, and untouched legacy "role" / "none" rows, do not.
 */
export function stepRequiresBetaAgreement(step: string): boolean {
  return step !== "none" && step !== "role" && step !== "agreement";
}

/**
 * Maps a persisted `User.onboardingStep` to the short flow.
 * Older steps land on the nearest new screen. Bank setup is not one of them.
 */
export function onboardingPathForStep(step: string): string {
  switch (step) {
    case "notifications":
    case "plaid":
      return "/onboarding/notifications";
    case "setup":
    case "benefits":
      return "/onboarding/setup";
    case "complete":
      return "/dashboard";
    default:
      return "/onboarding/agreement";
  }
}
