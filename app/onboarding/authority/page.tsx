import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { AuthorityOnboardingForm } from "./authority-form";

export default async function OnboardingAuthorityPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <OnboardingShell
      accountType={session.user.accountType}
      currentStepId="authority"
      eyebrow="Authority"
      title="Upload the authorization"
      subtitle="The document upload is at the top of this step. Then check every role that document actually covers."
    >
      <AuthorityOnboardingForm accountType={session.user.accountType} />
    </OnboardingShell>
  );
}
