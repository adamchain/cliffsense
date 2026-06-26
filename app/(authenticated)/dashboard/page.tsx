import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppToolbar, Card, ToolbarButton } from "@/components/layout/app-shell";
import { ThresholdWhatIf, type WhatIfItem } from "@/components/charts/threshold-what-if";
import { PlaidConnectModal } from "@/components/plaid/plaid-connect-modal";
import { ActionCenter } from "@/components/actions/action-center";
import { getPrimaryBeneficiaryForUser } from "@/lib/beneficiaries/access";
import Alert from "@/lib/db/models/Alert";
import BankConnection from "@/lib/db/models/BankConnection";
import Transaction from "@/lib/db/models/Transaction";
import { connectDB } from "@/lib/db/mongodb";
import { loadThresholdDashboardPayload } from "@/lib/thresholds/threshold-dashboard";
import { buildReportingActions, type ReportingAction } from "@/lib/reporting/reporting-actions";
import {
  IconDownload,
  IconInfoCircle,
  IconPlus,
  IconRefresh,
} from "@tabler/icons-react";

function formatUsd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  const primary = await getPrimaryBeneficiaryForUser(session.user.id);
  const beneficiaryId = primary?._id.toString() ?? null;
  const oid = primary?._id;

  let payload: Awaited<ReturnType<typeof loadThresholdDashboardPayload>> | null = null;
  let activeAlerts = 0;
  let bankCount = 0;
  let recentAlerts: { id: string; message: string; createdAt: string; level: string }[] = [];
  let reportingActions: ReportingAction[] = [];

  if (oid) {
    await connectDB();
    // Trailing window for new-income-source / income-change detection.
    const now = new Date();
    const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 6, 1))
      .toISOString()
      .slice(0, 10);
    const [p, alertCount, banks, alerts, txns] = await Promise.all([
      loadThresholdDashboardPayload(oid),
      Alert.countDocuments({
        beneficiaryId: oid,
        status: { $in: ["new", "acknowledged"] },
      }),
      BankConnection.countDocuments({ beneficiaryId: oid, status: "active" }),
      Alert.find({ beneficiaryId: oid }).sort({ createdAt: -1 }).limit(4).select({ message: 1, createdAt: 1, level: 1 }).lean(),
      Transaction.find({ beneficiaryId: oid, date: { $gte: sixMonthsAgo } })
        .select({ date: 1, amountCents: 1, userCategory: 1, name: 1, merchantName: 1, pending: 1, excludedFromThresholds: 1 })
        .lean(),
    ]);
    payload = p;
    activeAlerts = alertCount;
    bankCount = banks;
    recentAlerts = alerts.map((a) => ({
      id: String(a._id),
      message: String(a.message ?? ""),
      createdAt: (a.createdAt as Date).toISOString(),
      level: String(a.level ?? "info"),
    }));
    reportingActions = buildReportingActions({
      programs: payload.programsEnrolled,
      rows: payload.rows.map((r) => ({
        thresholdType: r.thresholdType,
        label: r.label,
        program: r.program,
        status: r.status,
        attached: r.attached,
      })),
      transactions: txns.map((t) => ({
        date: String(t.date),
        amountCents: Number(t.amountCents),
        userCategory: String(t.userCategory ?? ""),
        name: t.name ? String(t.name) : undefined,
        merchantName: t.merchantName ? String(t.merchantName) : undefined,
        pending: Boolean(t.pending),
        excludedFromThresholds: Boolean(t.excludedFromThresholds),
      })),
      now,
    });
  }

  // Evaluable limits (earned / gross / countable income + asset balance) for the
  // bar view and what-if controls. Each has a live value estimated from the
  // beneficiary's categorized deposits and linked balances; annual/custom
  // reference-only thresholds carry no live value and are skipped.
  const whatIfItems: WhatIfItem[] = (payload?.rows ?? [])
    .filter((r) => r.attached && r.currentValueCents != null)
    .map((r) => ({
      id: r._id,
      label: r.label,
      kind: r.thresholdType === "asset_balance" ? "asset" : "income",
      currentCents: r.currentValueCents as number,
      projectedCents: r.projectedValueCents,
      limitCents: r.limitCents,
      warnAtPercent: r.warnAtPercent,
    }));

  const glance = payload
    ? [
        {
          label: "Earned income (MTD)",
          value: formatUsd(payload.metrics.currentEarnedIncomeCents),
          sub:
            payload.metrics.projectedEarnedIncomeCents > payload.metrics.currentEarnedIncomeCents
              ? `Projected ${formatUsd(payload.metrics.projectedEarnedIncomeCents)} by month-end`
              : "Based on tagged payroll & deposits",
        },
        {
          label: "Asset balance (checking/savings)",
          value: formatUsd(payload.metrics.maxDepositoryBalanceCents),
          sub: "Max balance across linked depository accounts",
        },
        {
          label: "Active alerts",
          value: String(activeAlerts),
          sub: activeAlerts === 0 ? "None pending" : "Needs review or acknowledged",
        },
      ]
    : [
        { label: "Earned income", value: "—", sub: "Add a beneficiary profile and programs" },
        { label: "Asset balance", value: "—", sub: "Connect a bank to calculate" },
        { label: "Active alerts", value: "0", sub: "None pending" },
      ];

  return (
    <>
      <div className="mb-1 text-xs font-medium text-[var(--color-cs-text-secondary)]">Home › Dashboard</div>
      <h1 className="mb-4 text-2xl font-extrabold tracking-tight text-[var(--color-cs-text)]">Dashboard</h1>
      <AppToolbar>
        <ToolbarButton primary href="/thresholds">
          <IconPlus size={16} stroke={1.5} aria-hidden />
          Add limit
        </ToolbarButton>
        <PlaidConnectModal
          primaryBeneficiaryId={beneficiaryId}
          variant="toolbar"
          label="Connect bank"
        />
        <ToolbarButton href="/transactions">
          <IconRefresh size={16} stroke={1.5} aria-hidden />
          Transactions
        </ToolbarButton>
        <ToolbarButton href="/reports">
          <IconDownload size={16} stroke={1.5} aria-hidden />
          Export
        </ToolbarButton>
      </AppToolbar>
      <ActionCenter actions={reportingActions} />
      <div className="grid gap-3 md:grid-cols-2">
        {beneficiaryId ? (
          <div className="md:col-span-2">
            <Card title="Limits & balances" action="All limits" actionHref="/thresholds">
              <p className="mb-4 text-xs text-[var(--color-cs-text-secondary)]">
                Where each balance sits against its limit today. Drag a slider to try a hypothetical —
                like a raise or a bigger savings balance — and see which limits would get close.
              </p>
              <ThresholdWhatIf items={whatIfItems} />
            </Card>
          </div>
        ) : null}

        <Card title="This month at a glance" action="View details" actionHref="/thresholds">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {glance.map((s) => (
              <div key={s.label} className="rounded-2xl bg-[var(--color-cs-surface)] px-4 py-3.5">
                <div className="text-[11px] text-[var(--color-cs-text-secondary)]">{s.label}</div>
                <div className="text-lg font-medium tabular-nums">{s.value}</div>
                <div className="mt-0.5 text-[11px] text-[var(--color-cs-text-secondary)]">{s.sub}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Threshold status" action="All limits" actionHref="/thresholds">
          {payload && payload.rows.length > 0 ? (
            <ul className="divide-y divide-[var(--color-cs-border)] text-[13px]">
              {payload.rows.slice(0, 5).map((r) => (
                <li key={r._id} className="flex items-center justify-between gap-2 py-2 first:pt-0">
                  <span className="min-w-0 truncate font-medium text-[var(--color-cs-text)]">{r.label}</span>
                  <span
                    className={
                      r.status === "concern"
                        ? "shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium text-[#a4262c] bg-[var(--color-cs-danger-bg)]"
                        : r.status === "watch"
                          ? "shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium text-[#ca5010] bg-[#fff4ce]"
                          : "shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium text-[#0e5e0e] bg-[var(--color-cs-success-bg)]"
                    }
                  >
                    {r.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[var(--color-cs-text-secondary)]">
              Select programs during onboarding and connect a bank — limits appear here with progress toward each
              threshold.
            </p>
          )}
        </Card>

        <Card title="Recent alerts" action="View all" actionHref="/alerts">
          <div className="divide-y divide-[var(--color-cs-border)]">
            {recentAlerts.length > 0 ? (
              recentAlerts.map((a) => (
                <div key={a.id} className="flex gap-2.5 py-2.5 first:pt-0">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      a.level === "breach"
                        ? "bg-[var(--color-cs-danger-bg)] text-[var(--color-cs-danger)]"
                        : a.level === "warning"
                          ? "bg-[#fff4ce] text-[#ca5010]"
                          : "bg-[var(--color-cs-info-bg)] text-[var(--color-cs-info)]"
                    }`}
                    aria-hidden
                  >
                    <IconInfoCircle size={16} stroke={1.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] leading-snug text-[var(--color-cs-text)]">{a.message}</p>
                    <div className="mt-1 text-[11px] text-[var(--color-cs-text-muted)]">
                      {new Date(a.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex gap-2.5 py-2.5 first:pt-0">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-cs-info-bg)] text-[var(--color-cs-info)]"
                  aria-hidden
                >
                  <IconInfoCircle size={16} stroke={1.5} />
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium">Welcome to MyBenefitsPA</div>
                  <p className="text-xs leading-snug text-[var(--color-cs-text-secondary)]">
                    Connect your bank and confirm enrolled programs to see how activity lines up with your benefit
                    programs. This is an informational assistant — not a determination of eligibility.
                  </p>
                  <div className="mt-1 text-[11px] text-[var(--color-cs-text-muted)]">Just now</div>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card title="Connected accounts" action="Manage" actionHref="/transactions">
          {bankCount > 0 ? (
            <p className="text-xs text-[var(--color-cs-text-secondary)]">
              <span className="font-medium text-[var(--color-cs-text)]">{bankCount}</span> active connection
              {bankCount === 1 ? "" : "s"}.{" "}
              <Link href="/transactions" className="text-[var(--color-cs-brand)] hover:underline">
                Manage banks
              </Link>
              .
            </p>
          ) : (
            <p className="text-xs text-[var(--color-cs-text-secondary)]">
              No accounts linked yet.{" "}
              <Link href="/transactions" className="text-[var(--color-cs-brand)] hover:underline">
                Manage banks
              </Link>
              .
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
