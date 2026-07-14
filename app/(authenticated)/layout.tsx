import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthenticatedShell } from "@/components/layout/authenticated-shell";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { countUnreadAlertsForUser } from "@/lib/alerts/unread-count";

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
  const alertCount = await countUnreadAlertsForUser(session.user.id).catch(() => 0);
  return (
    <>
      {session.user.impersonatorId && (
        <ImpersonationBanner email={session.user.email ?? undefined} />
      )}
      <AuthenticatedShell
        userName={display}
        userInitials={initials(display, session.user.email ?? "")}
        alertCount={alertCount}
        isAdmin={Boolean(session.user.isAdmin) && !session.user.impersonatorId}
      >
        {children}
      </AuthenticatedShell>
    </>
  );
}
