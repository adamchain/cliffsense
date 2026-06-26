import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { NotificationsForm } from "./notifications-form";

export default async function OnboardingNotificationsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <OnboardingShell
      accountType={session.user.accountType}
      currentStepId="notifications"
      eyebrow="Notifications"
      title="Email preferences"
      subtitle="Alerts use a calm tone — we focus on facts and next steps, not alarmist language."
    >
      <NotificationsForm defaultEmail={session.user.email ?? ""} />
    </OnboardingShell>
  );
}
