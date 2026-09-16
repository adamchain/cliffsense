import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { BenefitsForm } from "./benefits-form";

export default async function OnboardingBenefitsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <OnboardingShell
      accountType={session.user.accountType}
      currentStepId="benefits"
      eyebrow="Benefit inventory"
      title="Screen each program separately"
      subtitle="Do not stop at “Social Security” or “Medicaid.” Mark Current, Possible, No, or Unknown — and identify the exact category when a program is current."
    >
      <BenefitsForm accountType={session.user.accountType} />
    </OnboardingShell>
  );
}
