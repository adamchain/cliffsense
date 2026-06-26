import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import Beneficiary from "@/lib/db/models/Beneficiary";
import { SettingsForm } from "./settings-form";
import { ProgramsForm } from "./programs-form";
import { SignOutButton } from "./sign-out-button";
import { DeleteAccountButton } from "./delete-account-button";
import { PushToggle } from "@/components/push/push-toggle";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }
  await connectDB();
  const [user, ownerBen] = await Promise.all([
    User.findById(session.user.id).select("name email accountType notificationPrefs onboardingStep").lean(),
    Beneficiary.findOne({ ownerUserId: session.user.id, isOwner: true })
      .select("firstName lastName state county householdSize benefitsEnrolled")
      .lean(),
  ]);

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <>
      <div className="mb-1 text-xs text-[var(--color-cs-text-secondary)]">Home › Settings</div>
      <h1 className="mb-2 text-xl font-medium text-[var(--color-cs-text)]">Settings</h1>
      <p className="mb-4 max-w-2xl text-[13px] text-[var(--color-cs-text-secondary)]">
        Signed in as <strong className="text-[var(--color-cs-text)]">{user.email}</strong> (
        {user.accountType}).
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded border border-[var(--color-cs-border)] bg-white p-4">
          <h2 className="mb-2 text-sm font-medium text-[var(--color-cs-text)]">Profile</h2>
          <SettingsForm
            initialName={user.name ?? ""}
            initialFrequency={user.notificationPrefs?.frequency ?? "daily"}
            initialNotifyEmail={user.notificationPrefs?.email ?? ""}
            initialAlertTypes={{
              predictive: user.notificationPrefs?.alertTypes?.predictive ?? true,
              breach: user.notificationPrefs?.alertTypes?.breach ?? true,
              trend: user.notificationPrefs?.alertTypes?.trend ?? true,
            }}
            initialAdditionalEmails={user.notificationPrefs?.additionalEmails ?? []}
            initialState={ownerBen?.state ?? ""}
            initialHouseholdSize={ownerBen?.householdSize ?? 1}
          />
        </section>

        {ownerBen && (
          <section className="rounded border border-[var(--color-cs-border)] bg-white p-4">
            <h2 className="mb-2 text-sm font-medium text-[var(--color-cs-text)]">Enrolled programs</h2>
            <ProgramsForm
              beneficiaryId={ownerBen._id.toString()}
              initialPrograms={(ownerBen.benefitsEnrolled ?? []).map((b) => b.program)}
            />
          </section>
        )}

        <section className="rounded border border-[var(--color-cs-border)] bg-white p-4">
          <h2 className="mb-1 text-sm font-medium text-[var(--color-cs-text)]">Push notifications</h2>
          <p className="mb-3 text-[12px] text-[var(--color-cs-text-secondary)]">
            Get alerts on this device the moment a threshold changes — in addition to email.
          </p>
          <PushToggle />
        </section>

        <section className="rounded border border-[var(--color-cs-border)] bg-white p-4">
          <h2 className="mb-2 text-sm font-medium text-[var(--color-cs-text)]">Account quick links</h2>
          <ul className="space-y-1.5 text-[13px]">
            <li>
              <Link href="/accounts" className="text-[var(--color-cs-brand)] hover:underline">
                Connected banks
              </Link>{" "}
              <span className="text-[var(--color-cs-text-secondary)]">— add or disconnect Plaid items</span>
            </li>
            <li>
              <Link href="/beneficiaries" className="text-[var(--color-cs-brand)] hover:underline">
                Beneficiaries
              </Link>{" "}
              <span className="text-[var(--color-cs-text-secondary)]">— manage people on this account</span>
            </li>
            <li>
              <Link href="/thresholds" className="text-[var(--color-cs-brand)] hover:underline">
                Limits
              </Link>{" "}
              <span className="text-[var(--color-cs-text-secondary)]">— configure threshold rules</span>
            </li>
            <li>
              <Link href="/activity" className="text-[var(--color-cs-brand)] hover:underline">
                Activity log
              </Link>{" "}
              <span className="text-[var(--color-cs-text-secondary)]">— audit trail</span>
            </li>
            <li>
              <Link href="/reports" className="text-[var(--color-cs-brand)] hover:underline">
                Exports
              </Link>{" "}
              <span className="text-[var(--color-cs-text-secondary)]">— CSV / PDF / JSON</span>
            </li>
          </ul>
        </section>

        <section className="md:col-span-2 rounded border border-[var(--color-cs-danger-bg)] bg-white p-4">
          <h2 className="mb-2 text-sm font-medium text-[var(--color-cs-danger)]">Danger zone</h2>
          <p className="mb-3 text-[12px] text-[var(--color-cs-text-secondary)]">
            Sign out of this session, or permanently delete your account and all owned data.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <SignOutButton />
            <DeleteAccountButton />
          </div>
        </section>
      </div>
    </>
  );
}
