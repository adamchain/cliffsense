import { requireAdmin } from "@/lib/admin/require-admin";
import { AdminNav } from "./admin-nav";

export const metadata = { title: "Admin · MyBenefitsPA" };

/**
 * Gates the entire admin surface once (real, non-impersonating admin only) and
 * frames every child page with the shared tab nav. Middleware guards the same
 * paths as a first line; this layout is the RSC-level enforcement.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div>
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
        Back-office
      </div>
      <AdminNav />
      {children}
    </div>
  );
}
