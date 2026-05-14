import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db/mongodb";
import Threshold from "@/lib/db/models/Threshold";
import { formatPlainUsdFromCents } from "@/lib/format/money";

export default async function AdminThresholdsPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  await connectDB();
  const rows = await Threshold.find({ scope: "system" })
    .sort({ program: 1, state: 1, label: 1 })
    .lean();

  const grouped = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = r.program ?? "—";
    const list = grouped.get(key) ?? [];
    list.push(r);
    grouped.set(key, list);
  }

  return (
    <>
      <div className="mb-1 text-xs text-[var(--color-cs-text-secondary)]">
        <Link href="/admin" className="hover:underline">Admin</Link> › Thresholds
      </div>
      <h1 className="mb-2 text-xl font-medium">System thresholds</h1>
      <p className="mb-4 max-w-2xl text-[13px] text-[var(--color-cs-text-secondary)]">
        Bundled program limits, grouped by program. Edit-in-place CRUD with effective-date windows
        is the next admin milestone — until then these reflect what the seed pushes from
        <code className="mx-1 rounded bg-[var(--color-cs-nav-hover)] px-1">/scripts</code>.
      </p>

      {rows.length === 0 ? (
        <p className="text-[13px] text-[var(--color-cs-text-secondary)]">
          No system thresholds seeded yet.
        </p>
      ) : (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([program, list]) => (
            <section
              key={program}
              className="overflow-hidden rounded border border-[var(--color-cs-border)] bg-white"
            >
              <header className="border-b border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
                {program} <span className="text-[var(--color-cs-text-muted)]">({list.length})</span>
              </header>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-[13px]">
                  <thead>
                    <tr className="border-b border-[var(--color-cs-border)] text-left text-[11px] text-[var(--color-cs-text-secondary)]">
                      <th className="px-3 py-2">Label</th>
                      <th className="px-3 py-2">State</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2 text-right">Limit</th>
                      <th className="px-3 py-2">Comparison</th>
                      <th className="px-3 py-2">Effective</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((t) => (
                      <tr
                        key={t._id.toString()}
                        className="border-b border-[var(--color-cs-border)] last:border-b-0 hover:bg-[var(--color-cs-surface)]"
                      >
                        <td className="px-3 py-2 align-top">
                          <div className="font-medium text-[var(--color-cs-text)]">{t.label}</div>
                          {t.systemKey && (
                            <div className="text-[10px] text-[var(--color-cs-text-muted)]">
                              {t.systemKey}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top text-[var(--color-cs-text-secondary)]">
                          {t.state ?? "—"}
                        </td>
                        <td className="px-3 py-2 align-top text-[12px] text-[var(--color-cs-text-secondary)]">
                          {t.thresholdType.replace(/_/g, " ")}
                        </td>
                        <td className="px-3 py-2 align-top text-right tabular-nums">
                          {formatPlainUsdFromCents(t.limitCents)}
                        </td>
                        <td className="px-3 py-2 align-top text-[var(--color-cs-text-secondary)]">
                          {t.comparison}
                        </td>
                        <td className="px-3 py-2 align-top text-[11px] text-[var(--color-cs-text-secondary)]">
                          {t.effectiveFrom ? new Date(t.effectiveFrom).toLocaleDateString() : "—"}
                          {t.effectiveTo && (
                            <>
                              {" → "}
                              {new Date(t.effectiveTo).toLocaleDateString()}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
