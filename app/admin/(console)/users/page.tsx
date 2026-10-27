import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { connectDB } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import Beneficiary from "@/lib/db/models/Beneficiary";

type Search = { q?: string; role?: string; status?: string; onboarding?: string };

const LIMIT = 100;

function buildFilter(sp: Search): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  const q = (sp.q ?? "").trim();
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ email: rx }, { name: rx }];
  }
  if (sp.role === "admin") filter.isAdmin = true;
  if (sp.status === "disabled") filter.status = "disabled";
  if (sp.status === "active") filter.status = "active";
  if (sp.onboarding === "incomplete") filter.onboardingStep = { $ne: "complete" };
  return filter;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

  await connectDB();
  const filter = buildFilter(sp);
  const [users, matchCount] = await Promise.all([
    User.find(filter)
      .select("email name accountType isAdmin status onboardingStep createdAt lastLoginAt")
      .sort({ createdAt: -1 })
      .limit(LIMIT)
      .lean(),
    User.countDocuments(filter),
  ]);

  const counts = users.length
    ? await Beneficiary.aggregate([
        { $match: { ownerUserId: { $in: users.map((u) => u._id) } } },
        { $group: { _id: "$ownerUserId", count: { $sum: 1 } } },
      ])
    : [];
  const countById = new Map<string, number>(
    counts.map((c: { _id: { toString: () => string }; count: number }) => [
      c._id.toString(),
      c.count,
    ]),
  );

  const chips: { label: string; params: Search; on: boolean }[] = [
    { label: "All", params: { q }, on: !sp.role && !sp.status && !sp.onboarding },
    { label: "Admins", params: { q, role: "admin" }, on: sp.role === "admin" },
    { label: "Disabled", params: { q, status: "disabled" }, on: sp.status === "disabled" },
    {
      label: "Onboarding incomplete",
      params: { q, onboarding: "incomplete" },
      on: sp.onboarding === "incomplete",
    },
  ];
  const toQuery = (p: Search) =>
    "?" +
    new URLSearchParams(
      Object.entries(p).filter(([, v]) => v) as [string, string][],
    ).toString();

  return (
    <>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-medium">Users</h1>
        <span className="text-[12px] text-[var(--color-cs-text-secondary)]">
          {matchCount.toLocaleString()} match{matchCount === 1 ? "" : "es"}
          {matchCount > LIMIT ? ` · showing newest ${LIMIT}` : ""}
        </span>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {chips.map((c) => (
          <Link
            key={c.label}
            href={`/admin/users${toQuery(c.params)}`}
            className={`rounded-full border px-3 py-1 text-[12px] font-medium ${
              c.on
                ? "border-[var(--color-cs-brand)] bg-[var(--color-cs-info-bg)] text-[var(--color-cs-brand)]"
                : "border-[var(--color-cs-border)] text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-surface)]"
            }`}
          >
            {c.label}
          </Link>
        ))}
      </div>

      <form className="mb-3 flex flex-wrap items-end gap-2 rounded border border-[var(--color-cs-border)] bg-white p-3 text-[13px]">
        {sp.role && <input type="hidden" name="role" value={sp.role} />}
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        {sp.onboarding && <input type="hidden" name="onboarding" value={sp.onboarding} />}
        <label className="flex flex-col text-[11px] text-[var(--color-cs-text-secondary)]">
          Search email or name
          <input
            name="q"
            defaultValue={q}
            placeholder="user@example.com"
            className="mt-0.5 h-8 w-72 rounded-sm border border-[var(--color-cs-border)] bg-white px-2 text-[12px]"
          />
        </label>
        <button
          type="submit"
          className="h-8 rounded-sm bg-[var(--color-cs-brand)] px-3 text-[12px] font-medium text-white hover:bg-[var(--color-cs-brand-hover)]"
        >
          Search
        </button>
        {q && (
          <Link
            href={`/admin/users${toQuery({ role: sp.role, status: sp.status, onboarding: sp.onboarding })}`}
            className="h-8 rounded-sm border border-[var(--color-cs-border)] px-3 pt-1.5 text-[12px] text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-nav-hover)]"
          >
            Clear
          </Link>
        )}
      </form>

      {users.length === 0 ? (
        <p className="text-[13px] text-[var(--color-cs-text-secondary)]">No users match.</p>
      ) : (
        <section className="overflow-hidden rounded border border-[var(--color-cs-border)] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] text-left text-[11px] text-[var(--color-cs-text-secondary)]">
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Onboarding</th>
                  <th className="px-3 py-2 text-right">Beneficiaries</th>
                  <th className="px-3 py-2">Joined</th>
                  <th className="px-3 py-2">Last login</th>
                  <th className="px-3 py-2 text-right">Manage</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u._id.toString()}
                    className="border-b border-[var(--color-cs-border)] last:border-b-0 hover:bg-[var(--color-cs-surface)]"
                  >
                    <td className="px-3 py-2 align-top">
                      <div className="font-medium text-[var(--color-cs-text)]">{u.email}</div>
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {u.isAdmin && (
                          <span className="inline-block rounded bg-[var(--color-cs-info-bg)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--color-cs-info)]">
                            Admin
                          </span>
                        )}
                        {u.status === "disabled" && (
                          <span className="inline-block rounded bg-[var(--color-cs-danger-bg)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--color-cs-danger)]">
                            Disabled
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top text-[var(--color-cs-text-secondary)]">
                      {u.name || "—"}
                    </td>
                    <td className="px-3 py-2 align-top text-[12px] text-[var(--color-cs-text-secondary)]">
                      {u.accountType}
                    </td>
                    <td className="px-3 py-2 align-top text-[12px] text-[var(--color-cs-text-secondary)]">
                      {u.onboardingStep}
                    </td>
                    <td className="px-3 py-2 align-top text-right tabular-nums">
                      {countById.get(u._id.toString()) ?? 0}
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-[var(--color-cs-text-secondary)]">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-[var(--color-cs-text-secondary)]">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-3 py-2 align-top text-right">
                      <Link
                        href={`/admin/users/${u._id.toString()}`}
                        className="font-semibold text-[var(--color-cs-brand)] hover:underline"
                      >
                        Manage
                      </Link>
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
