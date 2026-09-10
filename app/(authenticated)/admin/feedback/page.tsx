import { requireAdmin } from "@/lib/admin/require-admin";
import { connectDB } from "@/lib/db/mongodb";
import Feedback from "@/lib/db/models/Feedback";

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  await requireAdmin();
  await connectDB();

  const entries = await Feedback.find().sort({ createdAt: -1 }).lean();

  return (
    <>
      <h1 className="mb-1 text-xl font-medium text-[var(--color-cs-text)]">Feedback</h1>
      <p className="mb-4 text-[13px] text-[var(--color-cs-text-secondary)]">
        {entries.length} {entries.length === 1 ? "note" : "notes"} from the in-app feedback
        button.
      </p>

      {entries.length === 0 ? (
        <p className="text-[13px] text-[var(--color-cs-text-muted)]">No feedback yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-cs-border)] bg-white">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--color-cs-border)] text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-muted)]">
                <th className="px-4 py-3">From</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Page</th>
                <th className="px-4 py-3 text-right">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-cs-border)]">
              {entries.map((entry) => (
                <tr key={String(entry._id)} className="align-top hover:bg-[var(--color-cs-nav-hover)]">
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="font-medium text-[var(--color-cs-text)]">
                      {entry.name || "—"}
                    </div>
                    {entry.email ? (
                      <a
                        href={`mailto:${entry.email}`}
                        className="text-[var(--color-cs-text-secondary)] hover:text-[var(--color-cs-brand)] hover:underline"
                      >
                        {entry.email}
                      </a>
                    ) : (
                      <span className="text-[var(--color-cs-text-muted)]">No email</span>
                    )}
                  </td>
                  <td className="max-w-[480px] whitespace-pre-wrap px-4 py-3 text-[var(--color-cs-text)]">
                    {entry.message}
                  </td>
                  <td className="max-w-[180px] px-4 py-3 font-mono text-[12px] text-[var(--color-cs-text-secondary)]">
                    {entry.path || (
                      <span className="font-sans text-[var(--color-cs-text-muted)]">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-[var(--color-cs-text-muted)]">
                    {new Date(entry.createdAt as Date).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
