import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { OnboardingProfileForm } from "./profile-form";

export default async function OnboardingProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const self = session.user.accountType === "beneficiary";

  return (
    <OnboardingShell
      accountType={session.user.accountType}
      currentStepId="profile"
      eyebrow="Identity"
      title={self ? "Confirm the beneficiary" : "Your details"}
      subtitle={
        self
          ? "Identity, household, and how to reach them. This is the baseline MyBenefitsPA monitors from — not a guess about eligibility."
          : "We’ll use this for your Monitor account. Next you’ll add the person whose benefits you track, then document authority."
      }
    >
      <OnboardingProfileForm accountType={session.user.accountType} />
    </OnboardingShell>
  );
}
