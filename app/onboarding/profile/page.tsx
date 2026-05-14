import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { OnboardingProfileForm } from "./profile-form";

export default async function OnboardingProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  const aside = (
    <aside className="hidden w-[260px] shrink-0 flex-col justify-between bg-[var(--color-cs-brand)] p-6 text-white md:flex">
      <div>
        <Link href="/" className="mb-6 flex items-center gap-2 text-sm font-medium">
          <BrandMark size="sm" />
          CliffSense
        </Link>
        <p className="text-sm leading-relaxed text-white/85">
          A few quick steps connect your profile, bank, and enrolled programs so thresholds are
          relevant to you.
        </p>
      </div>
      <p className="text-[11px] text-white/70">
        <Link className="underline" href="#">
          Privacy
        </Link>
      </p>
    </aside>
  );

  return (
    <OnboardingShell accountType={session.user.accountType} currentStepId="profile" aside={aside}>
      <p className="text-xs text-[var(--color-cs-text-secondary)]">
        Onboarding · <strong className="text-[var(--color-cs-brand)]">Profile</strong>
      </p>
      <h1 className="mt-2 text-2xl font-medium text-[var(--color-cs-text)]">Who is this profile for?</h1>
      <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">
        For most people, that&apos;s you. If you&apos;re helping someone else with their benefits,
        you&apos;ll add them in the next step.
      </p>
      <OnboardingProfileForm accountType={session.user.accountType} />
    </OnboardingShell>
  );
}
