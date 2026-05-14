import type { ReactNode } from "react";
import type { OnboardingStepId } from "@/lib/onboarding/steps";
import { getOnboardingSteps } from "@/lib/onboarding/steps";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";

type OnboardingShellProps = {
  accountType: string | undefined;
  currentStepId: OnboardingStepId;
  aside: ReactNode;
  children: ReactNode;
};

export function OnboardingShell({ accountType, currentStepId, aside, children }: OnboardingShellProps) {
  const steps = getOnboardingSteps(accountType);
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-cs-surface)] font-sans text-[13px] text-[var(--color-cs-text)]">
      <OnboardingProgress steps={steps} currentStepId={currentStepId} />
      <div className="flex min-h-0 flex-1">
        {aside}
        <main className="min-w-0 flex-1 px-6 py-8 md:px-10 md:py-10">{children}</main>
      </div>
    </div>
  );
}
