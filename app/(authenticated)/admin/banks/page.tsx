import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { connectDB } from "@/lib/db/mongodb";
import BankConnection from "@/lib/db/models/BankConnection";
import Beneficiary from "@/lib/db/models/Beneficiary";
import User from "@/lib/db/models/User";
import {
  BANK_STATUS_LABEL,
  BANK_STATUS_ORDER,
  getBankStatusCounts,
  type BankStatus,
} from "@/lib/admin/metrics";
import { StatCard, type StatTone } from "../_components/stat-card";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<BankStatus, StatTone> = {
  login_required: "danger",
  error: "danger",
  disconnected: "warning",
  active: "success",
};

const STATUS_BADGE: Record<BankStatus, string> = {
  login_required: "bg-[var(--color-cs-danger-bg)] text-[var(--color-cs-danger)]",
  error: "bg-[var(--color-cs-danger-bg)] text-[var(--color-cs-danger)]",
  disconnected: "bg-[var(--color-cs-warning-bg)] text-[var(--color-cs-warning)]",
  active: "bg-[var(--color-cs-success-bg)] text-[var(--color-cs-success)]",
};

export default async function AdminBanksPage() {
  await requireAdmin();

  await connectDB();
  const [counts, connections] = await Promise.all([
    getBankStatusCounts(),
    BankConnection.find({})
      .select("institutionName accounts status lastSyncAt beneficiaryId")
      .sort({ status: 1, lastSyncAt: 1 })
      .limit(300)
      .lean(),
  ]);

  const benIds = connections.map((c) => c.beneficiaryId).filter(Boolean);
  const bens = await Beneficiary.find({ _id: { $in: benIds } })
    .select("firstName lastName ownerUserId")
    .lean();
  const benById = new Map(bens.map((b) => [b._id.toString(), b]));
  const ownerIds = bens.map((b) => b.ownerUserId).filter(Boolean);
  const owners = await User.find({ _id: { $in: ownerIds } }).select("email").lean();
  const ownerById = new Map(owners.map((u) => [u._id.toString(), u.email]));

  // Group in the canonical order (problems first).
  const grouped = new Map<BankStatus, typeof connections>();
  for (const s of BANK_STATUS_ORDER) grouped.set(s, []);
  for (const c of connections) {
    const s = (c.status as BankStatus) in BANK_STATUS_LABEL ? (c.status as BankStatus) : "active";
    grouped.get(s)!.push(c);
  }

  const total = BANK_STATUS_ORDER.reduce((n, s) => n + counts[s], 0);

  return (
    <>
      <h1 className="mb-1 text-xl font-medium">Bank health</h1>
      <p className="mb-4 max-w-2xl text-[13px] text-[var(--color-cs-text-secondary)]">
        Every Plaid connection by status. Problem states sort first. Reconnection is user-initiated
        (from their own account) — this view is for monitoring and triage. Newest 300 shown.
      </p>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {BANK_STATUS_ORDER.map((s) => (
          <StatCard
            key={s}
            label={BANK_STATUS_LABEL[s]}
            value={counts[s]}
            tone={counts[s] > 0 ? STATUS_TONE[s] : "default"}
            hint={total ? `${Math.round((counts[s] / total) * 100)}% of ${total}` : undefined}
          />
        ))}
      </div>

      {BANK_STATUS_ORDER.map((s) => {
        const list = grouped.get(s)!;
        if (list.length === 0) return null;
        return (
          <section
            key={s}
            className="mb-4 overflow-hidden rounded border border-[var(--color-cs-border)] bg-white"
          >
            <header className="flex items-center gap-2 border-b border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] px-3 py-1.5">
              <span
                className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${STATUS_BADGE[s]}`}
              >
                {BANK_STATUS_LABEL[s]}
              </span>
              <span className="text-[11px] text-[var(--color-cs-text-muted)]">{list.length}</span>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--color-cs-border)] text-left text-[11px] text-[var(--color-cs-text-secondary)]">
                    <th className="px-3 py-2">Institution</th>
                    <th className="px-3 py-2">Accounts</th>
                    <th className="px-3 py-2">Beneficiary</th>
                    <th className="px-3 py-2">Owner</th>
                    <th className="px-3 py-2">Last sync</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => {
                    const ben = benById.get(c.beneficiaryId?.toString() ?? "");
                    const ownerEmail = ben ? ownerById.get(ben.ownerUserId?.toString() ?? "") : null;
                    return (
                      <tr
                        key={c._id.toString()}
                        className="border-b border-[var(--color-cs-border)] last:border-b-0 hover:bg-[var(--color-cs-surface)]"
                      >
                        <td className="px-3 py-2 align-top font-medium text-[var(--color-cs-text)]">
                          {c.institutionName || "—"}
                        </td>
                        <td className="px-3 py-2 align-top text-[12px] text-[var(--color-cs-text-secondary)]">
                          {c.accounts.length
                            ? c.accounts
                                .map((a) => `${a.name || a.subtype || "acct"}${a.mask ? ` ••${a.mask}` : ""}`)
                                .join(", ")
                            : "—"}
                        </td>
                        <td className="px-3 py-2 align-top text-[var(--color-cs-text-secondary)]">
                          {ben ? `${ben.firstName} ${ben.lastName}`.trim() : "—"}
                        </td>
                        <td className="px-3 py-2 align-top text-[12px]">
                          {ownerEmail && ben ? (
                            <Link
                              href={`/admin/users/${ben.ownerUserId?.toString()}`}
                              className="text-[var(--color-cs-brand)] hover:underline"
                            >
                              {ownerEmail}
                            </Link>
                          ) : (
                            <span className="text-[var(--color-cs-text-secondary)]">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top text-[11px] text-[var(--color-cs-text-secondary)]">
                          {c.lastSyncAt ? new Date(c.lastSyncAt).toLocaleString() : "Never"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      {total === 0 && (
        <p className="text-[13px] text-[var(--color-cs-text-secondary)]">
          No bank connections yet.
        </p>
      )}
    </>
  );
}
