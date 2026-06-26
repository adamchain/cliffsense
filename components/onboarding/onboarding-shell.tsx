import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { OnboardingStepId } from "@/lib/onboarding/steps";
import { getOnboardingSteps } from "@/lib/onboarding/steps";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";

type OnboardingShellProps = {
  accountType: string | undefined;
  currentStepId: OnboardingStepId;
  /** Small uppercase eyebrow (e.g. "Profile"). */
  eyebrow?: ReactNode;
  /** Page heading. */
  title: ReactNode;
  /** Supporting copy under the heading. */
  subtitle?: ReactNode;
  children: ReactNode;
};

/**
 * Minimalist onboarding chrome, modeled on the sign-in page: a calm surface
 * background, a thin progress header, and a single centered column with the
 * brand mark, an eyebrow/title/subtitle header, and the step's form card. No
 * full-bleed sidebar — the focus stays on the one task.
 */
export function OnboardingShell({
  accountType,
  currentStepId,
  eyebrow,
  title,
  subtitle,
  children,
}: OnboardingShellProps) {
  const steps = getOnboardingSteps(accountType);
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-cs-surface)] font-sans text-[13px] text-[var(--color-cs-text)]">
      <OnboardingProgress steps={steps} currentStepId={currentStepId} />
      <main className="mx-auto w-full max-w-lg px-5 py-10 sm:py-14">
        <Link href="/" className="inline-flex" aria-label="MyBenefitsPA home">
          <Image
            src="/mybenefitspa-logo.png"
            alt="MyBenefitsPA"
            width={180}
            height={142}
            priority
            className="h-8 w-auto"
          />
        </Link>
        <div className="mt-7">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-1.5 text-[24px] font-bold leading-tight tracking-tight text-[var(--color-cs-text)]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-cs-text-secondary)]">
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
