import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { HomeDashboard } from "@/components/dashboard/home-dashboard";
import { displayNameForBeneficiary } from "@/lib/beneficiaries/access";
import { loadActiveBeneficiaryContext } from "@/lib/beneficiaries/active";
import BankConnection from "@/lib/db/models/BankConnection";
import ReportingDeadline from "@/lib/db/models/ReportingDeadline";
import Transaction from "@/lib/db/models/Transaction";
import { connectDB } from "@/lib/db/mongodb";
import { countVisibleBankConnections } from "@/lib/banks/linked-connections";
import { loadThresholdDashboardPayload } from "@/lib/thresholds/threshold-dashboard";
import { buildProgramCards } from "@/lib/benefits/program-tier";
import { calendarEventHref } from "@/lib/calendar/event-id";
import {
  DATE_CONFIDENCE_LABEL,
  normalizeConfidence,
  obligationCategoryForKind,
} from "@/lib/reporting/obligations";
import { programCodeKey } from "@/lib/benefits/program-meta";

function relativeLabel(isoDate: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(`${isoDate}T12:00:00`);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1 && diff < 14) return `in ${diff} days`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(`${isoDate}T12:00:00`);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  const { accounts, active } = await loadActiveBeneficiaryContext(session.user.id);
  const beneficiaryId = active?._id.toString() ?? null;
  const oid = active?._id;

  let bankCount = 0;
  let lastSyncAt: string | null = null;
  let newDepositCount = 0;
  const beneficiaryName =
    (active && displayNameForBeneficiary(active)) ||
    session.user.name?.trim() ||
    session.user.email?.split("@")[0] ||
    "You";
  let cards = buildProgramCards([]);
  let upcoming: {
    id: string;
    title: string;
    subtitle: string;
    mon: string;
    day: string;
    rel: string;
    href: string;
    kind: string;
  }[] = [];
  let nextRenewalDays: number | null = null;
  let nextDeadline: { title: string; days: number; beforeRenewal: boolean } | null = null;

  if (oid) {
    await connectDB();
    const now = new Date();
    const todayIso = now.toISOString().slice(0, 10);
    const yesterday = new Date(now.getTime() - 86400000);

    const [p, banks, latestBank, deadlines, deposits] = await Promise.all([
      loadThresholdDashboardPayload(oid),
      countVisibleBankConnections(oid),
      BankConnection.findOne({
        beneficiaryId: oid,
        status: "active",
        lastSyncAt: { $ne: null },
      })
        .sort({ lastSyncAt: -1 })
        .select("lastSyncAt")
        .lean(),
      ReportingDeadline.find({
        beneficiaryId: oid,
        dueDate: { $gte: new Date(`${todayIso}T00:00:00.000Z`) },
        completedAt: null,
      })
        .sort({ dueDate: 1 })
        .limit(24)
        .select({ title: 1, dueDate: 1, program: 1, kind: 1, confidence: 1 })
        .lean(),
      Transaction.countDocuments({
        beneficiaryId: oid,
        createdAt: { $gte: yesterday },
        userCategory: { $in: ["benefit_deposit", "earned_income", "other_income"] },
      }),
    ]);

    bankCount = banks;
    newDepositCount = deposits;
    if (latestBank?.lastSyncAt) {
      lastSyncAt = new Date(latestBank.lastSyncAt as Date).toISOString();
    }
    cards = buildProgramCards(p.rows);
    // Each benefit card shows its own soonest obligation, whatever the kind.
    for (const card of cards) {
      const mine = deadlines
        .filter((d) => d.program && programCodeKey(String(d.program)) === card.code)
        .sort((a, b) => (a.dueDate as Date).getTime() - (b.dueDate as Date).getTime());
      const d = mine[0];
      if (!d) continue;
      card.nextDue = {
        title: String(d.title ?? "Deadline"),
        date: (d.dueDate as Date).toISOString().slice(0, 10),
        confidenceLabel:
          DATE_CONFIDENCE_LABEL[normalizeConfidence((d as { confidence?: string }).confidence)],
        category: obligationCategoryForKind(String((d as { kind?: string }).kind ?? "deadline")),
      };
    }
    const mapped = deadlines.map((d) => {
      const dt = new Date(d.dueDate as Date);
      const due = dt.toISOString().slice(0, 10);
      const kind = String((d as { kind?: string }).kind ?? "deadline");
      return {
        id: String(d._id),
        title: String(d.title ?? "Reporting deadline"),
        subtitle: d.program
          ? `${d.program} · ${dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`
          : dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        mon: dt.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
        day: String(dt.getDate()),
        rel: relativeLabel(due),
        href: calendarEventHref({ source: "user", deadlineId: String(d._id) }),
        kind,
        due,
      };
    });
    // One date-ordered list: a distant renewal must never push an earlier
    // interim report, change report, or document request out of view.
    const byDue = mapped.slice().sort((a, b) => a.due.localeCompare(b.due));
    const firstRenewal = byDue.find((m) => obligationCategoryForKind(m.kind) === "renewal_review");
    if (firstRenewal) nextRenewalDays = daysUntil(firstRenewal.due);
    const first = byDue[0];
    if (first) {
      nextDeadline = {
        title: first.title,
        days: daysUntil(first.due),
        beforeRenewal: Boolean(
          firstRenewal &&
            obligationCategoryForKind(first.kind) !== "renewal_review" &&
            first.due < firstRenewal.due,
        ),
      };
    }
    upcoming = byDue.slice(0, 8).map(({ id, title, subtitle, mon, day, rel, href, kind }) => ({
      id,
      title,
      subtitle,
      mon,
      day,
      rel,
      href,
      kind,
    }));
  }

  const federal = cards.filter((c) => c.tier === "federal");
  const state = cards.filter((c) => c.tier === "state");

  return (
    <HomeDashboard
      beneficiaryName={beneficiaryName}
      beneficiaryId={beneficiaryId}
      accounts={accounts.map((a) => ({
        id: a._id.toString(),
        name: displayNameForBeneficiary(a) || "Beneficiary",
        roleLabel: a.roleLabel,
      }))}
      bankCount={bankCount}
      federal={federal}
      state={state}
      upcoming={upcoming}
      pulse={{
        lastSyncAt,
        newDepositCount,
        nextRenewalDays,
        nextDeadline,
      }}
    />
  );
}
