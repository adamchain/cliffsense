import { requireAdmin } from "@/lib/admin/require-admin";
import { connectDB } from "@/lib/db/mongodb";
import Waitlist from "@/lib/db/models/Waitlist";

export const dynamic = "force-dynamic";

export default async function AdminWaitlistPage() {
  await requireAdmin();
  await connectDB();

  const entries = await Waitlist.find().sort({ createdAt: -1 }).lean();

  return (
    <>
      <h1 className="mb-1 text-xl font-medium text-[var(--color-cs-text)]">Waitlist</h1>
      <p className="mb-4 text-[13px] text-[var(--color-cs-text-secondary)]">
        {entries.length} {entries.length === 1 ? "entry" : "entries"} — people who submitted the
        Stay Updated form on the homepage.
      </p>

      {entries.length === 0 ? (
        <p className="text-[13px] text-[var(--color-cs-text-muted)]">No entries yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-cs-border)] bg-white">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--color-cs-border)] text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-muted)]">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3 text-right">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-cs-border)]">
              {entries.map((entry) => (
                <tr key={String(entry._id)} className="hover:bg-[var(--color-cs-nav-hover)]">
                  <td className="px-4 py-3 font-medium text-[var(--color-cs-text)]">
                    {entry.name}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-cs-text-secondary)]">
                    <a
                      href={`mailto:${entry.email}`}
                      className="hover:text-[var(--color-cs-brand)] hover:underline"
                    >
                      {entry.email}
                    </a>
                  </td>
                  <td className="max-w-[340px] px-4 py-3 text-[var(--color-cs-text-secondary)]">
                    {entry.notes || (
                      <span className="text-[var(--color-cs-text-muted)]">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-[var(--color-cs-text-muted)]">
                    {new Date(entry.createdAt as Date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
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
