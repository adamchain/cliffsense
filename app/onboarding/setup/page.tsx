import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { betaAgreementAccepted } from "@/lib/onboarding/beta-agreement";
import { SetupForm } from "./setup-form";

export default async function OnboardingSetupPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  if (!(await betaAgreementAccepted(session.user.id))) {
    redirect("/onboarding/agreement");
  }
  const self = session.user.accountType === "beneficiary";

  return (
    <OnboardingShell
      accountType={session.user.accountType}
      currentStepId="setup"
      eyebrow="Setup"
      title={self ? "Who we're helping" : "Who you're helping"}
      subtitle="Name, programs, and any renewal dates you already have. This takes a few minutes. Connect a bank later if you want income estimates."
    >
      <SetupForm accountType={session.user.accountType} defaultName={session.user.name ?? ""} />
    </OnboardingShell>
  );
}
