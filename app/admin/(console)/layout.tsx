import { requireAdmin } from "@/lib/admin/require-admin";
import { AdminNav } from "../admin-nav";
import { AdminSignOut } from "../sign-out-button";

export const dynamic = "force-dynamic";

/** Gates the console. A main-app session is not accepted. */
export default async function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
            Bene-Watch Admin
          </div>
          <div className="text-[13px] text-[var(--color-cs-text-secondary)]">{session.user.email}</div>
        </div>
        <AdminSignOut />
      </div>
      <AdminNav />
      {children}
    </div>
  );
}
