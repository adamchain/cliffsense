import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { BenefitsForm } from "./benefits-form";
import { PROGRAMS } from "@/lib/programs";

export default async function OnboardingBenefitsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  const aside = (
    <aside className="hidden w-[260px] shrink-0 flex-col bg-[var(--color-cs-brand)] p-6 text-white md:flex">
      <Link href="/" className="mb-6 flex items-center gap-2 text-sm font-medium">
        <BrandMark size="sm" />
        CliffSense
      </Link>
      <p className="text-sm text-white/85">
        We attach reference thresholds for the programs you select. Always confirm rules with your counselor or agency.
      </p>
    </aside>
  );

  return (
    <OnboardingShell accountType={session.user.accountType} currentStepId="benefits" aside={aside}>
      <p className="text-xs text-[var(--color-cs-text-secondary)]">
        Onboarding · <strong className="text-[var(--color-cs-brand)]">Programs</strong>
      </p>
      <h1 className="mt-2 text-2xl font-medium text-[var(--color-cs-text)]">Which benefits are enrolled?</h1>
      <p className="mt-2 max-w-xl text-[13px] text-[var(--color-cs-text-secondary)]">
        Choose every program that applies. You can update this anytime in Settings.
      </p>
      <BenefitsForm programs={[...PROGRAMS]} />
    </OnboardingShell>
  );
}
