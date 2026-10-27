import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { connectDB } from "@/lib/db/mongodb";
import ActivityLog from "@/lib/db/models/ActivityLog";
import User from "@/lib/db/models/User";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 60;

const CATEGORIES = [
  "auth",
  "account",
  "beneficiary",
  "bank",
  "transaction",
  "threshold",
  "alert",
  "vault",
  "advisor",
  "export",
  "admin",
  "recurring",
] as const;

const SEVERITY_BADGE: Record<string, string> = {
  info: "bg-[var(--color-cs-surface)] text-[var(--color-cs-text-secondary)]",
  warning: "bg-[var(--color-cs-warning-bg)] text-[var(--color-cs-warning)]",
  security: "bg-[var(--color-cs-danger-bg)] text-[var(--color-cs-danger)]",
};

type Search = { category?: string; severity?: string; page?: string };

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const category = (CATEGORIES as readonly string[]).includes(sp.category ?? "") ? sp.category! : "";
  const severity = ["info", "warning", "security"].includes(sp.severity ?? "") ? sp.severity! : "";
  const page = Math.max(1, Number(sp.page) || 1);

  await connectDB();
  const filter: Record<string, unknown> = {};
  if (category) filter.category = category;
  if (severity) filter.severity = severity;

  const [rows, totalCount] = await Promise.all([
    ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    ActivityLog.countDocuments(filter),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const userIds = Array.from(new Set(rows.map((r) => r.userId?.toString()).filter(Boolean)));
  const users = await User.find({ _id: { $in: userIds } }).select("email").lean();
  const emailById = new Map(users.map((u) => [u._id.toString(), u.email]));

  const qs = (p: { category?: string; severity?: string; page?: number }) => {
    const params = new URLSearchParams();
    if (p.category) params.set("category", p.category);
    if (p.severity) params.set("severity", p.severity);
    if (p.page && p.page > 1) params.set("page", String(p.page));
    const s = params.toString();
    return s ? `?${s}` : "";
  };
  const chip = (active: boolean) =>
    `rounded-full border px-2.5 py-1 text-[12px] font-medium ${
      active
        ? "border-[var(--color-cs-brand)] bg-[var(--color-cs-info-bg)] text-[var(--color-cs-brand)]"
        : "border-[var(--color-cs-border)] text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-surface)]"
    }`;

  return (
    <>
      <h1 className="mb-1 text-xl font-medium">Activity feed</h1>
      <p className="mb-3 max-w-2xl text-[13px] text-[var(--color-cs-text-secondary)]">
        Platform-wide user activity across all accounts. Filter to{" "}
        <span className="font-medium text-[var(--color-cs-danger)]">security</span> severity for a
        quick incident sweep. {totalCount.toLocaleString()} match.
      </p>

      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] uppercase text-[var(--color-cs-text-muted)]">Severity</span>
        <Link href={`/admin/activity${qs({ category })}`} className={chip(!severity)}>
          All
        </Link>
        {["security", "warning", "info"].map((s) => (
          <Link key={s} href={`/admin/activity${qs({ category, severity: s })}`} className={chip(severity === s)}>
            {s}
          </Link>
        ))}
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] uppercase text-[var(--color-cs-text-muted)]">Category</span>
        <Link href={`/admin/activity${qs({ severity })}`} className={chip(!category)}>
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link key={c} href={`/admin/activity${qs({ severity, category: c })}`} className={chip(category === c)}>
            {c}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-[13px] text-[var(--color-cs-text-secondary)]">No activity matches.</p>
      ) : (
        <section className="overflow-hidden rounded border border-[var(--color-cs-border)] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] text-left text-[11px] text-[var(--color-cs-text-secondary)]">
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Severity</th>
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
                    <td className="px-3 py-2 text-[12px]">
                      {r.userId ? (
                        <Link
                          href={`/admin/users/${r.userId.toString()}`}
                          className="text-[var(--color-cs-brand)] hover:underline"
                        >
                          {emailById.get(r.userId.toString()) || r.userId.toString().slice(-6)}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2 text-[12px] text-[var(--color-cs-text-secondary)]">
                      {r.category}
                    </td>
                    <td className="px-3 py-2 text-[12px] font-medium text-[var(--color-cs-text)]">
                      {r.action}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                          SEVERITY_BADGE[r.severity] ?? SEVERITY_BADGE.info
                        }`}
                      >
                        {r.severity}
                      </span>
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
              href={`/admin/activity${qs({ category, severity, page: page - 1 })}`}
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
              href={`/admin/activity${qs({ category, severity, page: page + 1 })}`}
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
