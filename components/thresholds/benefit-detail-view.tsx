"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconBriefcase,
  IconChevronDown,
  IconCurrencyDollar,
  IconExternalLink,
  IconHeart,
  IconHome,
  IconLeaf,
  IconRefresh,
  IconSparkles,
} from "@tabler/icons-react";
import { formatPlainUsdFromCents } from "@/lib/format/money";
import {
  programCodeKey,
  programMetaFor,
  type ProgramMeta,
} from "@/lib/benefits/program-meta";
import {
  advisorAskHref,
  fixThresholdQuestion,
  programOverviewQuestion,
} from "@/lib/benefits/fix-prompts";
import { SntEstimator } from "@/components/benefits/snt-estimator";
import {
  formatUsdCents,
  programAgencyTag,
  programTier,
  statusFromRow,
} from "@/lib/benefits/program-tier";
import { PaKeystoneChip, PaKeystoneMark, SsaSeal, UsFlagMark } from "@/components/benefits/wallet-seals";
import { fixedScheduleEventsForPrograms } from "@/lib/benefits/reporting-schedules";
import { calendarEventHref } from "@/lib/calendar/event-id";

type RelatedDate = {
  id: string;
  date: string;
  title: string;
  kind: string;
};

type Row = {
  _id: string;
  scope: string;
  systemKey: string | null;
  attached: boolean;
  program: string | null;
  thresholdType: string;
  label: string;
  description: string;
  sourceUrl: string;
  limitCents: number;
  warnAtPercent: number;
  currentValueCents: number | null;
  projectedValueCents: number | null;
  status: "ok" | "watch" | "concern";
};

type Payload = {
  programsEnrolled: string[];
  monthPrefix: string;
  rows: Row[];
};

const TYPE_LABEL: Record<string, string> = {
  monthly_earned_income: "Monthly earned income",
  monthly_unearned_income: "Monthly countable income",
  monthly_gross_income: "Monthly gross income",
  annual_income: "Annual income",
  asset_balance: "Account balance",
  transaction_amount: "Single transaction",
  custom: "Reference figure",
};

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function relativeDateLabel(isoDate: string): string {
  const today = new Date(`${todayIso()}T00:00:00`);
  const target = new Date(`${isoDate}T00:00:00`);
  const days = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 21) return `in ${days} days`;
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function dateChipParts(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00`);
  return {
    mon: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: String(d.getDate()),
  };
}

function shortDueLabel(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function ProgramGlyph({ code }: { code: string }) {
  const color = "#fff";
  const props = { size: 23, stroke: 2, color, "aria-hidden": true as const };
  switch (code) {
    case "SSDI":
      return <IconBriefcase {...props} />;
    case "SNAP":
    case "WIC":
      return <IconLeaf {...props} />;
    case "MEDICAID":
      return <IconHeart {...props} fill={color} />;
    case "SECTION8":
    case "ABLE":
      return <IconHome {...props} />;
    default:
      return <IconCurrencyDollar {...props} />;
  }
}

function LimitCard({
  row,
  programCode,
}: {
  row: Row;
  programCode: string;
}) {
  const [open, setOpen] = useState(false);
  const sc = statusFromRow(row.status);
  const cur =
    row.currentValueCents != null ? formatPlainUsdFromCents(row.currentValueCents) : null;
  const pct =
    row.currentValueCents != null && row.limitCents > 0
      ? Math.min(100, Math.round((row.currentValueCents / row.limitCents) * 100))
      : null;
  const fixHref = advisorAskHref(
    fixThresholdQuestion({
      program: programCode,
      label: row.label,
      currentValueCents: row.currentValueCents,
      limitCents: row.limitCents,
      status: row.status,
    }),
  );

  return (
    <article className="rounded-[18px] bg-[var(--color-cs-card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
        <div className="font-semibold text-[var(--color-cs-text)]">{row.label}</div>
        <span
          className={`inline-block shrink-0 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${
            sc === "crit"
              ? "bg-[var(--color-cs-danger-bg)] text-[var(--color-cs-danger)]"
              : sc === "warn"
                ? "bg-[var(--color-cs-warning-bg)] text-[var(--color-cs-warning)]"
                : "bg-[var(--color-cs-success-bg)] text-[var(--color-cs-success)]"
          }`}
        >
          {sc === "crit" ? "Over limit" : sc === "warn" ? "Near limit" : "On track"}
        </span>
      </div>
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-[var(--color-cs-text-secondary)]">
        <span>{TYPE_LABEL[row.thresholdType] ?? row.thresholdType}</span>
        <span>
          Limit{" "}
          <span className="font-semibold tabular-nums text-[var(--color-cs-text)]">
            {formatPlainUsdFromCents(row.limitCents)}
          </span>
        </span>
        {cur != null && (
          <span>
            Current{" "}
            <span className="font-semibold tabular-nums text-[var(--color-cs-text)]">
              {cur}
            </span>
            {pct != null ? ` (${pct}%)` : ""}
          </span>
        )}
      </div>
      {pct != null && (
        <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-[rgba(120,120,128,0.18)]">
          <div
            className={`h-full rounded-full ${
              sc === "crit"
                ? "bg-[#ff3b30]"
                : sc === "warn"
                  ? "bg-[var(--color-cs-accent-orange)]"
                  : "bg-[var(--color-cs-accent-green)]"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {row.description && (
        <div className="mb-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--color-cs-brand)]"
            aria-expanded={open}
          >
            {open ? "Hide details" : "Show details"}
            <IconChevronDown
              size={14}
              stroke={2}
              className={`transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
          {open && (
            <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--color-cs-text-secondary)]">
              {row.description}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {row.status !== "ok" && (
          <Link
            href={fixHref}
            className="inline-flex items-center gap-1.5 rounded-[14px] bg-[var(--color-cs-brand)] px-3 py-1.5 text-[13px] font-semibold text-white"
          >
            <IconSparkles size={14} stroke={1.5} aria-hidden />
            Ask AI how to fix
          </Link>
        )}
        {row.sourceUrl && (
          <a
            href={row.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[13px] text-[var(--color-cs-brand)]"
          >
            <IconExternalLink size={13} stroke={1.5} aria-hidden />
            Official source
          </a>
        )}
      </div>
    </article>
  );
}

export function BenefitDetailView({
  beneficiaryId,
  program,
}: {
  beneficiaryId: string | null;
  program: string;
}) {
  const code = programCodeKey(program);
  const meta: ProgramMeta | null = programMetaFor(code);
  const tier = programTier(code);
  const fed = tier === "federal";
  const tag = programAgencyTag(code);
  const [data, setData] = useState<Payload | null>(null);
  const [relatedDates, setRelatedDates] = useState<RelatedDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!beneficiaryId) return;
    setLoading(true);
    setError(null);
    const [tRes, dRes] = await Promise.all([
      fetch(`/api/thresholds?beneficiaryId=${encodeURIComponent(beneficiaryId)}`),
      fetch(`/api/reporting-deadlines?beneficiaryId=${encodeURIComponent(beneficiaryId)}`),
    ]);
    const tJson = await tRes.json().catch(() => ({}));
    const dJson = await dRes.json().catch(() => ({}));
    setLoading(false);
    if (!tRes.ok) {
      setError((tJson as { error?: string }).error ?? "Failed to load");
      return;
    }
    const payload = tJson as Payload;
    setData(payload);

    const today = todayIso();
    const enrolled = payload.programsEnrolled ?? [];
    const generated = fixedScheduleEventsForPrograms(enrolled, new Date())
      .filter((g) => programCodeKey(g.program) === code && g.date >= today)
      .map<RelatedDate>((g) => ({
        id: `gen-${g.program}-${g.title}-${g.date}`,
        date: g.date,
        title: g.title,
        kind: "deadline",
      }));

    type Dl = {
      _id: string;
      program: string | null;
      dueDate: string;
      title: string;
      kind?: string;
      completedAt?: string | null;
      sourceKey?: string | null;
    };
    const userDates = ((dJson as { deadlines?: Dl[] }).deadlines ?? [])
      .filter((d) => {
        if (d.completedAt) return false;
        if (!d.program || programCodeKey(d.program) !== code) return false;
        return d.dueDate >= today;
      })
      .map<RelatedDate>((d) => {
        const isRenewal =
          d.kind === "renewal" ||
          d.sourceKey?.startsWith("renewal:") ||
          /\brenewal\b/i.test(d.title ?? "");
        return {
          id: `usr-${d._id}`,
          date: d.dueDate,
          title: d.title,
          kind: isRenewal ? "renewal" : (d.kind ?? "deadline"),
        };
      });

    const merged = [...generated, ...userDates]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 6);
    setRelatedDates(merged);
  }, [beneficiaryId, code]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(
    () =>
      (data?.rows ?? []).filter(
        (r) => r.program && programCodeKey(r.program) === code && r.attached,
      ),
    [data, code],
  );

  const primary = useMemo(() => {
    const sorted = rows.slice().sort((a, b) => rank(b.status) - rank(a.status));
    return sorted.find((r) => r.currentValueCents != null) ?? sorted[0] ?? null;
  }, [rows]);

  const counts = useMemo(() => {
    let concern = 0;
    let watch = 0;
    for (const r of rows) {
      if (r.status === "concern") concern += 1;
      else if (r.status === "watch") watch += 1;
    }
    return { concern, watch, ok: rows.length - concern - watch, total: rows.length };
  }, [rows]);

  const enrolled = data
    ? data.programsEnrolled.some((p) => programCodeKey(p) === code)
    : true;

  const title = meta?.label ?? program;
  const curCents = primary?.currentValueCents ?? null;
  const limitCents = primary?.limitCents ?? null;

  if (!beneficiaryId) {
    return (
      <p className="text-sm text-[var(--color-cs-text-secondary)]">
        Add a beneficiary profile first.{" "}
        <Link href="/onboarding/profile" className="text-[var(--color-cs-brand)] hover:underline">
          Continue onboarding
        </Link>
      </p>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <Link
          href="/thresholds"
          className="cs-circbtn !bg-white/75 shadow-sm"
          aria-label="Back to limits"
        >
          <IconArrowLeft size={18} stroke={2.2} />
        </Link>
        <div className="flex gap-2">
          <button
            type="button"
            className="cs-circbtn !bg-white/75 shadow-sm"
            onClick={() => void load()}
            aria-label="Refresh"
          >
            <IconRefresh size={17} stroke={2} />
          </button>
          <Link
            href={advisorAskHref(programOverviewQuestion(code))}
            className="cs-circbtn !bg-white/75 shadow-sm"
            aria-label={`Ask AI about ${title}`}
          >
            <IconSparkles size={17} stroke={2} />
          </Link>
        </div>
      </div>

      {error && <p className="mb-2 text-xs text-[var(--color-cs-danger)]">{error}</p>}

      {/* Related dates — relative labels, same card style as Limits / Home upcoming */}
      <div className="mb-5">
        <div className="mb-2 flex items-baseline justify-between px-0.5">
          <h2 className="text-[22px] font-bold tracking-tight">Dates</h2>
          <Link href="/calendar" className="text-[15px] text-[var(--color-cs-brand)]">
            Calendar
          </Link>
        </div>
        {relatedDates.length === 0 ? (
          <div className="rounded-[18px] bg-white px-4 py-3.5 text-[13.5px] text-[var(--color-cs-text-secondary)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            No upcoming dates for {title}. Set renewals in{" "}
            <Link href="/settings" className="text-[var(--color-cs-brand)]">
              Settings
            </Link>
            .
          </div>
        ) : (
          <div className="cs-ios-list">
            {relatedDates.map((d) => {
              const chip = dateChipParts(d.date);
              const rel = relativeDateLabel(d.date);
              const days = (() => {
                const today = new Date(`${todayIso()}T00:00:00`);
                const target = new Date(`${d.date}T00:00:00`);
                return Math.round((target.getTime() - today.getTime()) / 86400000);
              })();
              const eventHref = d.id.startsWith("usr-")
                ? calendarEventHref({
                    source: "user",
                    deadlineId: d.id.replace(/^usr-/, ""),
                  })
                : calendarEventHref({
                    source: "generated",
                    program: code,
                    date: d.date,
                    title: d.title,
                  });
              const subtitle =
                d.kind === "renewal"
                  ? `Renewal · ${shortDueLabel(d.date)}`
                  : `Due · ${shortDueLabel(d.date)}`;
              return (
                <Link key={d.id} href={eventHref} className="cs-ios-row">
                  <div className="cs-datechip">
                    <div className="m">{chip.mon}</div>
                    <div className="d">{chip.day}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[16px] font-semibold text-[var(--color-cs-text)]">
                      {d.title}
                    </div>
                    <div className="mt-0.5 truncate text-[12.5px] text-[var(--color-cs-text-secondary)]">
                      {subtitle}
                    </div>
                  </div>
                  <div
                    className={`shrink-0 text-[13px] font-medium ${
                      days <= 7
                        ? "text-[var(--color-cs-danger)]"
                        : "text-[var(--color-cs-text-secondary)]"
                    }`}
                  >
                    {rel}
                  </div>
                  <span
                    className="text-[18px] font-light leading-none text-[var(--color-cs-text-muted)]"
                    aria-hidden
                  >
                    ›
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_1fr] lg:items-start">
        {/* Left: hero + program description */}
        <div>
          <div className={`cs-hero ${fed ? "cs-hero--fed" : "cs-hero--state"}`}>
            <div className="cs-wcard-seal" aria-hidden>
              {fed ? <SsaSeal /> : <PaKeystoneMark />}
            </div>
            <div className="cs-hero-top">
              <div>
                <div className="cs-hero-name">
                  <ProgramGlyph code={code} />
                  {title}
                </div>
                <div className="cs-hero-tag">
                  {fed ? <UsFlagMark className="cs-fed-flag" /> : <PaKeystoneChip className="cs-pa-chip" />}
                  {tag}
                </div>
              </div>
              <div className="cs-hero-big">
                {curCents != null ? formatUsdCents(curCents) : "—"}
              </div>
            </div>
            <div className="cs-hero-bottom">
              <div className="cs-hero-label">
                {primary ? TYPE_LABEL[primary.thresholdType] ?? primary.label : "Program status"}
              </div>
              <div className="cs-hero-limit">
                {limitCents != null
                  ? `of ${formatUsdCents(limitCents)} limit`
                  : meta?.fullName ?? title}
              </div>
            </div>
          </div>

          {!loading && data && (
            <div className="mt-3.5 flex overflow-hidden rounded-[18px] bg-[var(--color-cs-card)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <div className="flex-1 px-2 py-3 text-center">
                <div className="text-[17px] font-bold tabular-nums">
                  {limitCents != null ? formatUsdCents(limitCents) : "—"}
                </div>
                <div className="mt-0.5 text-[11.5px] text-[var(--color-cs-text-secondary)]">Limit</div>
              </div>
              <div className="flex-1 border-l border-[var(--color-cs-sep)] px-2 py-3 text-center">
                <div className="text-[17px] font-bold tabular-nums">
                  {curCents != null ? formatUsdCents(curCents) : "—"}
                </div>
                <div className="mt-0.5 text-[11.5px] text-[var(--color-cs-text-secondary)]">Current</div>
              </div>
              <div className="flex-1 border-l border-[var(--color-cs-sep)] px-2 py-3 text-center">
                <div
                  className={`text-[17px] font-bold tabular-nums ${
                    counts.concern > 0
                      ? "text-[var(--color-cs-danger)]"
                      : counts.watch > 0
                        ? "text-[var(--color-cs-warning)]"
                        : "text-[var(--color-cs-success)]"
                  }`}
                >
                  {curCents != null && limitCents != null
                    ? formatUsdCents(Math.abs(limitCents - curCents))
                    : "—"}
                </div>
                <div className="mt-0.5 text-[11.5px] text-[var(--color-cs-text-secondary)]">
                  {curCents != null && limitCents != null && curCents > limitCents
                    ? "Over"
                    : "Cushion"}
                </div>
              </div>
            </div>
          )}

          {!enrolled && (
            <div className="mt-3 rounded-[16px] bg-[var(--color-cs-card)] px-4 py-3 text-[13.5px] text-[var(--color-cs-text-secondary)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              You haven&apos;t marked {title} as an enrolled program.{" "}
              <Link href="/onboarding/benefits" className="text-[var(--color-cs-brand)]">
                Update your programs
              </Link>
              .
            </div>
          )}

          {meta && (
            <div className="mt-4 rounded-[18px] bg-[var(--color-cs-card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <h2 className="text-[17px] font-bold text-[var(--color-cs-text)]">
                {meta.fullName}
              </h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--color-cs-text-secondary)]">
                {meta.blurb}
              </p>
              <div className="mt-4">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
                  Reporting
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-cs-text)]">
                  {meta.reporting}
                </p>
              </div>
              <div className="mt-4 text-[13px] text-[var(--color-cs-text-secondary)]">
                Administered by {meta.agency}.
              </div>
              <a
                href={meta.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[var(--color-cs-brand)]"
              >
                <IconExternalLink size={14} />
                Official program page
              </a>
            </div>
          )}

          <p className="mt-3 px-1 text-[12px] leading-snug text-[var(--color-cs-text-secondary)]">
            MyBenefitsPA counts these against the {title} threshold from your linked accounts.
            Nothing here is shared with any agency. Figures are informational — not an eligibility
            determination.
          </p>

          {code === "SSI" ? (
            <div className="mt-4 rounded-[18px] bg-[var(--color-cs-card)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <h2 className="mb-1 text-[17px] font-semibold text-[var(--color-cs-text)]">
                Effect of payments coming from an SNT
              </h2>
              <p className="mb-2 text-[12.5px] text-[var(--color-cs-text-secondary)]">
                How a Special Needs Trust pays out changes the SSI check differently. Use the
                estimator before a distribution.
              </p>
              <SntEstimator compact />
            </div>
          ) : null}
        </div>

        {/* Right: limits — same card stack pattern as Dates above */}
        <aside className="lg:sticky lg:top-24">
          <div className="mb-2 flex items-baseline justify-between px-0.5">
            <h2 className="text-[22px] font-bold tracking-tight">Limits</h2>
            <Link
              href={advisorAskHref(programOverviewQuestion(code))}
              className="text-[15px] text-[var(--color-cs-brand)]"
            >
              Ask Advisor
            </Link>
          </div>

          <div className="space-y-2.5">
            {loading && (
              <p className="text-sm text-[var(--color-cs-text-secondary)]">Loading…</p>
            )}
            {!loading &&
              rows
                .slice()
                .sort((a, b) => rank(b.status) - rank(a.status))
                .map((r) => <LimitCard key={r._id} row={r} programCode={code} />)}
            {!loading && data && rows.length === 0 && enrolled && (
              <div className="rounded-[18px] bg-[var(--color-cs-card)] px-4 py-3.5 text-[13.5px] text-[var(--color-cs-text-secondary)] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                No reference limits are attached for {title}. Visit{" "}
                <Link href="/thresholds" className="text-[var(--color-cs-brand)]">
                  Limits
                </Link>{" "}
                to attach the ones that apply to you.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function rank(status: string): number {
  if (status === "concern") return 2;
  if (status === "watch") return 1;
  return 0;
}
