import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { connectDB } from "@/lib/db/mongodb";
import Invite from "@/lib/db/models/Invite";
import Beneficiary from "@/lib/db/models/Beneficiary";
import User from "@/lib/db/models/User";
import { RevokeInviteButton } from "./invite-actions";

export const dynamic = "force-dynamic";

type Search = { status?: string };

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-[var(--color-cs-warning-bg)] text-[var(--color-cs-warning)]",
  accepted: "bg-[var(--color-cs-success-bg)] text-[var(--color-cs-success)]",
  revoked: "bg-[var(--color-cs-danger-bg)] text-[var(--color-cs-danger)]",
};

export default async function AdminInvitesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const status = sp.status && ["pending", "accepted", "revoked"].includes(sp.status) ? sp.status : "";

  await connectDB();
  const now = new Date();
  const filter: Record<string, unknown> = status ? { status } : {};
  const invites = await Invite.find(filter).sort({ createdAt: -1 }).limit(200).lean();

  const benIds = invites.map((i) => i.beneficiaryId).filter(Boolean);
  const inviterIds = invites.map((i) => i.invitedByUserId).filter(Boolean);
  const [bens, inviters, statusCounts] = await Promise.all([
    Beneficiary.find({ _id: { $in: benIds } }).select("firstName lastName").lean(),
    User.find({ _id: { $in: inviterIds } }).select("email name").lean(),
    Invite.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
  ]);
  const benById = new Map(bens.map((b) => [b._id.toString(), `${b.firstName} ${b.lastName}`.trim()]));
  const inviterById = new Map(inviters.map((u) => [u._id.toString(), u.email]));
  const countByStatus = new Map(statusCounts.map((c) => [c._id, c.count]));

  const chips = [
    { label: "All", value: "" },
    { label: `Pending (${countByStatus.get("pending") ?? 0})`, value: "pending" },
    { label: `Accepted (${countByStatus.get("accepted") ?? 0})`, value: "accepted" },
    { label: `Revoked (${countByStatus.get("revoked") ?? 0})`, value: "revoked" },
  ];

  return (
    <>
      <h1 className="mb-1 text-xl font-medium">Invites</h1>
      <p className="mb-3 max-w-2xl text-[13px] text-[var(--color-cs-text-secondary)]">
        Co-manager and viewer invitations across all beneficiaries. Newest 200 shown. Revoking a
        pending invite disables its link immediately.
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {chips.map((c) => {
          const on = status === c.value;
          return (
            <Link
              key={c.label}
              href={c.value ? `/admin/invites?status=${c.value}` : "/admin/invites"}
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

      {invites.length === 0 ? (
        <p className="text-[13px] text-[var(--color-cs-text-secondary)]">No invites match.</p>
      ) : (
        <section className="overflow-hidden rounded border border-[var(--color-cs-border)] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] text-left text-[11px] text-[var(--color-cs-text-secondary)]">
                  <th className="px-3 py-2">Invitee</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Beneficiary</th>
                  <th className="px-3 py-2">Invited by</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Expires</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((i) => {
                  const expired = i.status === "pending" && i.expiresAt && new Date(i.expiresAt) < now;
                  return (
                    <tr
                      key={i._id.toString()}
                      className="border-b border-[var(--color-cs-border)] last:border-b-0 hover:bg-[var(--color-cs-surface)]"
                    >
                      <td className="px-3 py-2 align-top font-medium text-[var(--color-cs-text)]">
                        {i.email}
                      </td>
                      <td className="px-3 py-2 align-top text-[12px] text-[var(--color-cs-text-secondary)]">
                        {i.role.replace(/_/g, " ")}
                      </td>
                      <td className="px-3 py-2 align-top text-[var(--color-cs-text-secondary)]">
                        {benById.get(i.beneficiaryId?.toString() ?? "") || "—"}
                      </td>
                      <td className="px-3 py-2 align-top text-[12px] text-[var(--color-cs-text-secondary)]">
                        {inviterById.get(i.invitedByUserId?.toString() ?? "") || "—"}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] uppercase ${
                            STATUS_BADGE[i.status] ?? "bg-[var(--color-cs-surface)] text-[var(--color-cs-text-secondary)]"
                          }`}
                        >
                          {i.status}
                        </span>
                        {expired && (
                          <span className="ml-1 text-[10px] text-[var(--color-cs-text-muted)]">
                            (expired)
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top text-[11px] text-[var(--color-cs-text-secondary)]">
                        {i.expiresAt ? new Date(i.expiresAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-3 py-2 align-top text-right">
                        {i.status === "pending" ? (
                          <RevokeInviteButton inviteId={i._id.toString()} email={i.email} />
                        ) : (
                          <span className="text-[11px] text-[var(--color-cs-text-muted)]">—</span>
                        )}
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
