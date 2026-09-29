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
      subtitle="We'll email you when an alert is created. The note stays factual: what changed, and what to do next."
    >
      <NotificationsForm defaultEmail={session.user.email ?? ""} />
    </OnboardingShell>
  );
}
