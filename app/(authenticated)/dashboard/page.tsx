import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { HomeDashboard } from "@/components/dashboard/home-dashboard";
import { getPrimaryBeneficiaryForUser } from "@/lib/beneficiaries/access";
import BankConnection from "@/lib/db/models/BankConnection";
import Beneficiary from "@/lib/db/models/Beneficiary";
import ReportingDeadline from "@/lib/db/models/ReportingDeadline";
import Transaction from "@/lib/db/models/Transaction";
import { connectDB } from "@/lib/db/mongodb";
import { loadThresholdDashboardPayload } from "@/lib/thresholds/threshold-dashboard";
import { buildProgramCards } from "@/lib/benefits/program-tier";
import { calendarEventHref } from "@/lib/calendar/event-id";

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
  const primary = await getPrimaryBeneficiaryForUser(session.user.id);
  const beneficiaryId = primary?._id.toString() ?? null;
  const oid = primary?._id;

  let bankCount = 0;
  let lastSyncAt: string | null = null;
  let newDepositCount = 0;
  let beneficiaryName =
    session.user.name?.trim() || session.user.email?.split("@")[0] || "You";
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

  if (oid) {
    await connectDB();
    const now = new Date();
    const todayIso = now.toISOString().slice(0, 10);
    const yesterday = new Date(now.getTime() - 86400000);

    const [p, banks, latestBank, ben, deadlines, deposits] = await Promise.all([
      loadThresholdDashboardPayload(oid),
      BankConnection.countDocuments({ beneficiaryId: oid, status: "active" }),
      BankConnection.findOne({
        beneficiaryId: oid,
        status: "active",
        lastSyncAt: { $ne: null },
      })
        .sort({ lastSyncAt: -1 })
        .select("lastSyncAt")
        .lean(),
      Beneficiary.findById(oid).select("firstName lastName").lean(),
      ReportingDeadline.find({
        beneficiaryId: oid,
        dueDate: { $gte: new Date(`${todayIso}T00:00:00.000Z`) },
        completedAt: null,
      })
        .sort({ dueDate: 1 })
        .limit(24)
        .select({ title: 1, dueDate: 1, program: 1, kind: 1 })
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
    if (ben) {
      beneficiaryName = `${ben.firstName ?? ""} ${ben.lastName ?? ""}`.trim() || beneficiaryName;
    }
    cards = buildProgramCards(p.rows);
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
    const renewals = mapped
      .filter((m) => m.kind === "renewal")
      .sort((a, b) => a.due.localeCompare(b.due));
    const others = mapped
      .filter((m) => m.kind !== "renewal")
      .sort((a, b) => a.due.localeCompare(b.due));
    if (renewals[0]) nextRenewalDays = daysUntil(renewals[0].due);
    upcoming = [...renewals, ...others].slice(0, 8).map(({ due: _due, ...rest }) => rest);
  }

  const federal = cards.filter((c) => c.tier === "federal");
  const state = cards.filter((c) => c.tier === "state");

  return (
    <HomeDashboard
      beneficiaryName={beneficiaryName}
      beneficiaryId={beneficiaryId}
      bankCount={bankCount}
      federal={federal}
      state={state}
      upcoming={upcoming}
      pulse={{
        lastSyncAt,
        newDepositCount,
        nextRenewalDays,
      }}
    />
  );
}
