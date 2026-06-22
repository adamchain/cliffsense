import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { NotificationsForm } from "./notifications-form";

export default async function OnboardingNotificationsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  const aside = (
    <aside className="hidden w-[260px] shrink-0 flex-col bg-[var(--color-cs-brand)] p-6 text-white md:flex">
      <Link href="/" className="mb-6 flex items-center gap-2 text-sm font-medium">
        <BrandMark size="sm" onDark />
        MyBenefitsPA
      </Link>
      <p className="text-sm text-white/85">
        Choose how often we email summaries. You can change this anytime in Settings.
      </p>
    </aside>
  );

  return (
    <OnboardingShell accountType={session.user.accountType} currentStepId="notifications" aside={aside}>
      <p className="text-xs text-[var(--color-cs-text-secondary)]">
        Onboarding · <strong className="text-[var(--color-cs-brand)]">Notifications</strong>
      </p>
      <h1 className="mt-2 text-2xl font-medium text-[var(--color-cs-text)]">Email preferences</h1>
      <p className="mt-2 max-w-xl text-[13px] text-[var(--color-cs-text-secondary)]">
        Alerts use a calm tone — we focus on facts and next steps, not alarmist language.
      </p>
      <NotificationsForm defaultEmail={session.user.email ?? ""} />
    </OnboardingShell>
  );
}
