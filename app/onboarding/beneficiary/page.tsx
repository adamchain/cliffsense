import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { BeneficiaryOnboardingForm } from "./beneficiary-form";

export default async function OnboardingBeneficiaryPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  if (session.user.accountType === "beneficiary") {
    redirect("/onboarding/plaid");
  }
  const aside = (
    <aside className="hidden w-[260px] shrink-0 flex-col justify-between bg-[var(--color-cs-brand)] p-6 text-white md:flex">
      <div>
        <Link href="/" className="mb-6 flex items-center gap-2 text-sm font-medium">
          <BrandMark size="sm" />
          CliffSense
        </Link>
        <p className="text-sm text-white/85">
          Add the first person you support so activity and alerts stay scoped correctly.
        </p>
      </div>
    </aside>
  );

  return (
    <OnboardingShell accountType={session.user.accountType} currentStepId="beneficiary" aside={aside}>
      <p className="text-xs text-[var(--color-cs-text-secondary)]">
        Onboarding · <strong className="text-[var(--color-cs-brand)]">Client / loved one</strong>
      </p>
      <h1 className="mt-2 text-2xl font-medium text-[var(--color-cs-text)]">Add your first person</h1>
      <p className="mt-2 max-w-xl text-[13px] text-[var(--color-cs-text-secondary)]">
        You can add more later from Settings. This creates their beneficiary profile under your account.
      </p>
      <BeneficiaryOnboardingForm />
    </OnboardingShell>
  );
}
