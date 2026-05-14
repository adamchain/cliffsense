import Link from "next/link";
import type { OnboardingStep, OnboardingStepId } from "@/lib/onboarding/steps";
import { onboardingStepIndex } from "@/lib/onboarding/steps";

export function OnboardingProgress({
  steps,
  currentStepId,
}: {
  steps: OnboardingStep[];
  currentStepId: OnboardingStepId;
}) {
  const currentIdx = onboardingStepIndex(steps, currentStepId);
  const total = steps.length;

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-cs-border)] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-2.5 px-4 py-3 md:px-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
            Onboarding · Step {currentIdx + 1} of {total}
          </p>
          <Link
            href="/"
            className="shrink-0 text-[11px] text-[var(--color-cs-brand)] hover:underline md:text-xs"
          >
            Exit to home
          </Link>
        </div>
        <div className="flex items-stretch gap-1.5 sm:gap-2" role="list" aria-label="Onboarding progress">
          {steps.map((step, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            const segmentClass = done
              ? "bg-[var(--color-cs-brand)]"
              : active
                ? "bg-[var(--color-cs-brand)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]"
                : "bg-[#edebe9]";
            return (
              <div key={step.id} className="flex min-w-0 flex-1 flex-col gap-1" role="listitem">
                <div
                  className={`h-1.5 rounded-full transition-colors motion-reduce:transition-none ${segmentClass}`}
                  aria-hidden
                />
                <span
                  className={`truncate text-center text-[10px] leading-tight sm:text-[11px] ${
                    active
                      ? "font-semibold text-[var(--color-cs-brand)]"
                      : done
                        ? "font-medium text-[var(--color-cs-text-secondary)]"
                        : "text-[var(--color-cs-text-muted)]"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
}
