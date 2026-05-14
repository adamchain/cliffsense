import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongodb";
import ActivityLog from "@/lib/db/models/ActivityLog";

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

type Category = (typeof CATEGORIES)[number];

const SEVERITY_BADGE: Record<string, string> = {
  info: "bg-[var(--color-cs-info-bg)] text-[var(--color-cs-info)]",
  warning: "bg-[var(--color-cs-warning-bg)] text-[var(--color-cs-warning)]",
  security: "bg-[var(--color-cs-danger-bg)] text-[var(--color-cs-danger)]",
};

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; severity?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }
  const sp = await searchParams;
  const categoryFilter = (CATEGORIES as readonly string[]).includes(sp.category ?? "")
    ? (sp.category as Category)
    : null;
  const severityFilter = ["info", "warning", "security"].includes(sp.severity ?? "")
    ? (sp.severity as "info" | "warning" | "security")
    : null;

  await connectDB();
  const query: Record<string, unknown> = { userId: session.user.id };
  if (categoryFilter) query.category = categoryFilter;
  if (severityFilter) query.severity = severityFilter;

  const rows = await ActivityLog.find(query).sort({ createdAt: -1 }).limit(200).lean();

  return (
    <>
      <div className="mb-1 text-xs text-[var(--color-cs-text-secondary)]">Home › Activity</div>
      <h1 className="mb-2 text-xl font-medium text-[var(--color-cs-text)]">Activity log</h1>
      <p className="mb-4 max-w-2xl text-[13px] text-[var(--color-cs-text-secondary)]">
        Audit trail of authentication, bank, vault, and export events for your account. Most recent
        200 shown.
      </p>

      <form className="mb-3 flex flex-wrap items-end gap-2 rounded border border-[var(--color-cs-border)] bg-white p-3 text-[13px]">
        <label className="flex flex-col text-[11px] text-[var(--color-cs-text-secondary)]">
          Category
          <select
            name="category"
            defaultValue={categoryFilter ?? ""}
            className="mt-0.5 h-8 rounded-sm border border-[var(--color-cs-border)] bg-white px-2 text-[12px]"
          >
            <option value="">All</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-[11px] text-[var(--color-cs-text-secondary)]">
          Severity
          <select
            name="severity"
            defaultValue={severityFilter ?? ""}
            className="mt-0.5 h-8 rounded-sm border border-[var(--color-cs-border)] bg-white px-2 text-[12px]"
          >
            <option value="">All</option>
            <option value="info">info</option>
            <option value="warning">warning</option>
            <option value="security">security</option>
          </select>
        </label>
        <button
          type="submit"
          className="h-8 rounded-sm bg-[var(--color-cs-brand)] px-3 text-[12px] font-medium text-white hover:bg-[var(--color-cs-brand-hover)]"
        >
          Apply
        </button>
        <a
          href="/activity"
          className="h-8 rounded-sm border border-[var(--color-cs-border)] px-3 pt-1.5 text-[12px] text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-nav-hover)]"
        >
          Clear
        </a>
      </form>

      {rows.length === 0 ? (
        <p className="text-[13px] text-[var(--color-cs-text-secondary)]">No events match these filters.</p>
      ) : (
        <section className="overflow-hidden rounded border border-[var(--color-cs-border)] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] text-left text-[11px] font-medium text-[var(--color-cs-text-secondary)]">
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Resource</th>
                  <th className="px-3 py-2">Severity</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r._id.toString()}
                    className="border-b border-[var(--color-cs-border)] last:border-b-0 hover:bg-[var(--color-cs-surface)]"
                  >
                    <td className="px-3 py-2 align-top text-[12px] text-[var(--color-cs-text-secondary)]">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 align-top text-[12px] uppercase tracking-tight text-[var(--color-cs-text-secondary)]">
                      {r.category}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="font-medium text-[var(--color-cs-text)]">{r.action}</div>
                      {r.details && Object.keys(r.details as object).length > 0 && (
                        <div className="mt-0.5 max-w-md truncate text-[11px] text-[var(--color-cs-text-muted)]">
                          {JSON.stringify(r.details)}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top text-[12px] text-[var(--color-cs-text-secondary)]">
                      {r.resourceType ? (
                        <>
                          {r.resourceType}
                          {r.resourceId ? ` · ${r.resourceId.slice(-6)}` : ""}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] uppercase ${
                          SEVERITY_BADGE[r.severity ?? "info"] ?? SEVERITY_BADGE.info
                        }`}
                      >
                        {r.severity ?? "info"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
