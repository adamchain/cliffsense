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
      title="Document who may act"
      subtitle="Capture the Monitor’s real authority and who already manages benefits, money, plans, trusts, and ABLE funds."
    >
      <AuthorityOnboardingForm accountType={session.user.accountType} />
    </OnboardingShell>
  );
}
