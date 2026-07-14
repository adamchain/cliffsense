import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { connectDB } from "@/lib/db/mongodb";
import AdminAuditLog, {
  ADMIN_AUDIT_ACTIONS,
  type AdminAuditAction,
} from "@/lib/db/models/AdminAuditLog";
import { ADMIN_AUDIT_LABEL, auditActionTone } from "@/lib/admin/audit-labels";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type Search = { action?: string; page?: string };

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const action = (ADMIN_AUDIT_ACTIONS as readonly string[]).includes(sp.action ?? "")
    ? (sp.action as AdminAuditAction)
    : "";
  const page = Math.max(1, Number(sp.page) || 1);

  await connectDB();
  const filter: Record<string, unknown> = action ? { action } : {};
  const [rows, totalCount] = await Promise.all([
    AdminAuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    AdminAuditLog.countDocuments(filter),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const qs = (p: { action?: string; page?: number }) => {
    const params = new URLSearchParams();
    if (p.action) params.set("action", p.action);
    if (p.page && p.page > 1) params.set("page", String(p.page));
    const s = params.toString();
    return s ? `?${s}` : "";
  };

  return (
    <>
      <h1 className="mb-1 text-xl font-medium">Admin audit log</h1>
      <p className="mb-3 max-w-2xl text-[13px] text-[var(--color-cs-text-secondary)]">
        Append-only record of privileged back-office actions — who did what to whom, from where.
        {totalCount.toLocaleString()} total.
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <Link
          href="/admin/audit"
          className={`rounded-full border px-3 py-1 text-[12px] font-medium ${
            !action
              ? "border-[var(--color-cs-brand)] bg-[var(--color-cs-info-bg)] text-[var(--color-cs-brand)]"
              : "border-[var(--color-cs-border)] text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-surface)]"
          }`}
        >
          All actions
        </Link>
        {ADMIN_AUDIT_ACTIONS.map((a) => (
          <Link
            key={a}
            href={`/admin/audit${qs({ action: a })}`}
            className={`rounded-full border px-3 py-1 text-[12px] font-medium ${
              action === a
                ? "border-[var(--color-cs-brand)] bg-[var(--color-cs-info-bg)] text-[var(--color-cs-brand)]"
                : "border-[var(--color-cs-border)] text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-surface)]"
            }`}
          >
            {ADMIN_AUDIT_LABEL[a]}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-[13px] text-[var(--color-cs-text-secondary)]">No audit records.</p>
      ) : (
        <section className="overflow-hidden rounded border border-[var(--color-cs-border)] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] text-left text-[11px] text-[var(--color-cs-text-secondary)]">
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Actor</th>
                  <th className="px-3 py-2">Target</th>
                  <th className="px-3 py-2">IP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r._id.toString()}
                    className="border-b border-[var(--color-cs-border)] last:border-b-0 align-top hover:bg-[var(--color-cs-surface)]"
                  >
                    <td className="whitespace-nowrap px-3 py-2 text-[11px] text-[var(--color-cs-text-secondary)]">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${auditActionTone(
                          r.action as AdminAuditAction,
                        )}`}
                      >
                        {ADMIN_AUDIT_LABEL[r.action as AdminAuditAction] ?? r.action}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[12px] text-[var(--color-cs-text)]">
                      {r.actorEmail || r.actorUserId?.toString() || "—"}
                    </td>
                    <td className="px-3 py-2 text-[12px] text-[var(--color-cs-text-secondary)]">
                      {r.targetEmail || (r.targetUserId ? r.targetUserId.toString() : "—")}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-[var(--color-cs-text-muted)]">
                      {r.ipAddress || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between text-[12px]">
          {page > 1 ? (
            <Link
              href={`/admin/audit${qs({ action, page: page - 1 })}`}
              className="rounded-sm border border-[var(--color-cs-border)] px-3 py-1.5 text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-surface)]"
            >
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-[var(--color-cs-text-muted)]">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/admin/audit${qs({ action, page: page + 1 })}`}
              className="rounded-sm border border-[var(--color-cs-border)] px-3 py-1.5 text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-surface)]"
            >
              Older →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </>
  );
}
