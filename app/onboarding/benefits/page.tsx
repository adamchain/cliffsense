import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { BenefitsForm } from "./benefits-form";
import { PROGRAMS } from "@/lib/programs";

export default async function OnboardingBenefitsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <OnboardingShell
      accountType={session.user.accountType}
      currentStepId="benefits"
      eyebrow="Programs"
      title="Which benefits are enrolled?"
      subtitle="Choose every program that applies. You can update this anytime in Settings."
    >
      <BenefitsForm programs={[...PROGRAMS]} />
    </OnboardingShell>
  );
}
