import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { betaAgreementAccepted } from "@/lib/onboarding/beta-agreement";
import { NotificationsForm } from "./notifications-form";

export default async function OnboardingNotificationsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  if (!(await betaAgreementAccepted(session.user.id))) {
    redirect("/onboarding/agreement");
  }

  return (
    <OnboardingShell
      accountType={session.user.accountType}
      currentStepId="notifications"
      eyebrow="Alerts"
      title="Where should alerts go?"
      subtitle="We'll email this address when a deadline or a warning shows up. You can change it later."
    >
      <NotificationsForm defaultEmail={session.user.email ?? ""} />
    </OnboardingShell>
  );
}
