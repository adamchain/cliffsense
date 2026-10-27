import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { WalkthroughProvider } from "@/components/walkthrough/walkthrough-provider";
import { countUnreadAlertsForUser } from "@/lib/alerts/unread-count";
import { displayNameForBeneficiary } from "@/lib/beneficiaries/access";
import { loadActiveBeneficiaryContext } from "@/lib/beneficiaries/active";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";

function initials(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export default async function AuthenticatedGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  const display = session.user.name?.trim() || session.user.email || "User";
  const [alertCount, walkthroughRow] = await Promise.all([
    countUnreadAlertsForUser(session.user.id).catch(() => 0),
    (async () => {
      await connectDB();
      return User.findById(session.user.id)
        .select("walkthroughCompletedAt onboardingStep")
        .lean();
    })().catch(() => null),
  ]);

  const onboardingDone =
    (walkthroughRow?.onboardingStep ?? session.user.onboardingStep) === "complete";
  const shouldAutoStart =
    onboardingDone && !walkthroughRow?.walkthroughCompletedAt && !session.user.impersonatorId;

  const people = await loadActiveBeneficiaryContext(session.user.id).catch(() => null);
  const accounts = (people?.accounts ?? []).map((a) => ({
    id: a._id.toString(),
    name: displayNameForBeneficiary(a) || "Beneficiary",
    roleLabel: a.roleLabel,
  }));
  const active = people?.active ?? null;
  const beneficiaryName = active ? displayNameForBeneficiary(active) || display : display;

  return (
    <>
      {session.user.impersonatorId && (
        <ImpersonationBanner email={session.user.email ?? undefined} />
      )}
      <WalkthroughProvider shouldAutoStart={shouldAutoStart}>
        <AuthenticatedShell
          userName={display}
          userInitials={initials(beneficiaryName, session.user.email ?? "")}
          beneficiaryId={active?._id.toString() ?? null}
          beneficiaryName={beneficiaryName}
          accounts={accounts}
          alertCount={alertCount}
        >
          {children}
        </AuthenticatedShell>
      </WalkthroughProvider>
    </>
  );
}
