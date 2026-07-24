import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import Application from "@/lib/db/models/Application";
import ApplicationDocument from "@/lib/db/models/ApplicationDocument";
import { ApplicationStatusBadge } from "@/components/applications/status-parts";
import { relationshipLabel } from "@/lib/applications/labels";

type Search = { status?: string };
const LIMIT = 100;

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  await requireAdmin();
  const sp = await searchParams;

  await connectDB();
  const filter: Record<string, unknown> = {};
  if (sp.status === "pending_review" || sp.status === "approved" || sp.status === "rejected") {
    filter.status = sp.status;
  }

  const apps = await Application.find(filter)
    // Pending first, then most recently updated.
    .sort({ status: 1, updatedAt: -1 })
    .limit(LIMIT)
    .lean();

  const ids = apps.map((a) => a._id);
  const userIds = apps.map((a) => a.userId);
  const [users, docCounts] = await Promise.all([
    User.find({ _id: { $in: userIds } }).select("email name").lean(),
    ids.length
      ? ApplicationDocument.aggregate([
          { $match: { applicationId: { $in: ids } } },
          { $group: { _id: "$applicationId", count: { $sum: 1 } } },
        ])
      : [],
  ]);
  const emailById = new Map(users.map((u) => [u._id.toString(), { email: u.email, name: u.name }]));
  const docsById = new Map<string, number>(
    (docCounts as { _id: { toString: () => string }; count: number }[]).map((c) => [
      c._id.toString(),
      c.count,
    ]),
  );

  const pendingCount = await Application.countDocuments({ status: "pending_review" });

  const chips: { label: string; status?: string }[] = [
    { label: "All" },
    { label: "Pending", status: "pending_review" },
    { label: "Approved", status: "approved" },
    { label: "Rejected", status: "rejected" },
  ];

  return (
    <>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-medium">Applications</h1>
        <span className="text-[12px] text-[var(--color-cs-text-secondary)]">
          {pendingCount.toLocaleString()} pending review
        </span>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {chips.map((c) => {
          const on = (sp.status ?? "") === (c.status ?? "");
          return (
            <Link
              key={c.label}
              href={c.status ? `/admin/applications?status=${c.status}` : "/admin/applications"}
              className={`rounded-full border px-3 py-1 text-[12px] font-medium ${
                on
                  ? "border-[var(--color-cs-brand)] bg-[var(--color-cs-info-bg)] text-[var(--color-cs-brand)]"
                  : "border-[var(--color-cs-border)] text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-surface)]"
              }`}
            >
              {c.label}
            </Link>
          );
        })}
      </div>

      {apps.length === 0 ? (
        <p className="text-[13px] text-[var(--color-cs-text-secondary)]">No applications.</p>
      ) : (
        <section className="overflow-hidden rounded border border-[var(--color-cs-border)] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] text-left text-[11px] text-[var(--color-cs-text-secondary)]">
                  <th className="px-3 py-2">Applicant</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Helping</th>
                  <th className="px-3 py-2 text-right">Docs</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Submitted</th>
                  <th className="px-3 py-2 text-right">Review</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((a) => {
                  const u = emailById.get(a.userId.toString());
                  return (
                    <tr
                      key={a._id.toString()}
                      className="border-b border-[var(--color-cs-border)] last:border-b-0 hover:bg-[var(--color-cs-surface)]"
                    >
                      <td className="px-3 py-2 align-top">
                        <div className="font-medium text-[var(--color-cs-text)]">{u?.email ?? "—"}</div>
                        {u?.name ? (
                          <div className="text-[11px] text-[var(--color-cs-text-secondary)]">{u.name}</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 align-top text-[12px] text-[var(--color-cs-text-secondary)]">
                        {a.accountType}
                      </td>
                      <td className="px-3 py-2 align-top text-[12px] text-[var(--color-cs-text-secondary)]">
                        {a.actingFor?.personName || "—"}
                        <div className="text-[11px] text-[var(--color-cs-text-muted)]">
                          {relationshipLabel(a.actingFor?.relationship ?? "other")}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top text-right tabular-nums">
                        {docsById.get(a._id.toString()) ?? 0}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <ApplicationStatusBadge status={a.status} />
                      </td>
                      <td className="px-3 py-2 align-top text-[11px] text-[var(--color-cs-text-secondary)]">
                        {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-3 py-2 align-top text-right">
                        <Link
                          href={`/admin/applications/${a._id.toString()}`}
                          className="font-semibold text-[var(--color-cs-brand)] hover:underline"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
