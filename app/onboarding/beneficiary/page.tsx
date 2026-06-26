import { auth } from "@/auth";
import { redirect } from "next/navigation";
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

  return (
    <OnboardingShell
      accountType={session.user.accountType}
      currentStepId="beneficiary"
      eyebrow="Client / loved one"
      title="Add your first person"
      subtitle="You can add more later from Settings. This creates their beneficiary profile under your account."
    >
      <BeneficiaryOnboardingForm />
    </OnboardingShell>
  );
}
