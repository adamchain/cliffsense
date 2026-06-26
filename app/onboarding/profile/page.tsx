import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { OnboardingProfileForm } from "./profile-form";

export default async function OnboardingProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <OnboardingShell
      accountType={session.user.accountType}
      currentStepId="profile"
      eyebrow="Profile"
      title="Who is this profile for?"
      subtitle="For most people, that's you. If you're helping someone else with their benefits, you'll add them in the next step."
    >
      <OnboardingProfileForm accountType={session.user.accountType} />
    </OnboardingShell>
  );
}
