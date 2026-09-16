import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { RoleOnboardingForm } from "./role-form";

export default async function OnboardingRolePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <OnboardingShell
      accountType={session.user.accountType}
      currentStepId="role"
      eyebrow="Benefit Monitor"
      title="How this role works"
      subtitle="Before we collect identity or programs, confirm the Monitor’s job — and what it is not."
    >
      <RoleOnboardingForm />
    </OnboardingShell>
  );
}
