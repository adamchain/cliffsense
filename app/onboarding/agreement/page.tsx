import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { betaAgreementAccepted } from "@/lib/onboarding/beta-agreement";
import { onboardingPathForStep } from "@/lib/onboarding/steps";
import { AgreementForm } from "./agreement-form";

export default async function OnboardingAgreementPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  if (await betaAgreementAccepted(session.user.id)) {
    const next = onboardingPathForStep(session.user.onboardingStep ?? "setup");
    redirect(next === "/onboarding/agreement" ? "/onboarding/setup" : next);
  }

  return (
    <OnboardingShell
      accountType={session.user.accountType}
      currentStepId="agreement"
      eyebrow="Beta"
      title="Beta agreement"
      subtitle="One page. Check the box to continue. A bank can be connected later."
    >
      <AgreementForm />
    </OnboardingShell>
  );
}
