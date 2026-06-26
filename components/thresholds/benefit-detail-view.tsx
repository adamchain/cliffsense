"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconExternalLink,
  IconRefresh,
  IconSparkles,
} from "@tabler/icons-react";
import { AppToolbar, ToolbarButton } from "@/components/layout/app-shell";
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

const STATUS: Record<
  string,
  { label: string; pill: string; bar: string }
> = {
  ok: {
    label: "On track",
    pill: "bg-[#dff6dd] text-[#107c10]",
    bar: "border-l-[#107c10]",
  },
  watch: {
    label: "Watch",
    pill: "bg-[#fed9cc] text-[#ca5010]",
    bar: "border-l-[var(--color-cs-warning)]",
  },
  concern: {
    label: "Review — may be over",
    pill: "bg-[#fde7e9] text-[#a4262c]",
    bar: "border-l-[var(--color-cs-danger)]",
  },
};

export function BenefitDetailView({
  beneficiaryId,
  program,
}: {
  beneficiaryId: string | null;
  program: string;
}) {
  const code = programCodeKey(program);
  const meta: ProgramMeta | null = programMetaFor(code);
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!beneficiaryId) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/thresholds?beneficiaryId=${encodeURIComponent(beneficiaryId)}`);
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError((json as { error?: string }).error ?? "Failed to load");
      return;
    }
    setData(json as Payload);
  }, [beneficiaryId]);

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
    <>
      <div className="mb-1 text-xs text-[var(--color-cs-text-secondary)]">
        <Link href="/thresholds" className="hover:underline">
          Limits
        </Link>{" "}
        › {title}
      </div>
      <h1 className="mb-1 text-xl font-medium text-[var(--color-cs-text)]">
        {meta?.fullName ?? title}
      </h1>
      {meta && (
        <p className="mb-3 max-w-2xl text-[13px] text-[var(--color-cs-text-secondary)]">{meta.blurb}</p>
      )}

      <AppToolbar>
        <ToolbarButton href="/thresholds" primary>
          <IconArrowLeft size={16} stroke={1.5} aria-hidden />
          All limits
        </ToolbarButton>
        <ToolbarButton onClick={() => void load()}>
          <IconRefresh size={16} stroke={1.5} aria-hidden />
          Refresh
        </ToolbarButton>
        <ToolbarButton href={advisorAskHref(programOverviewQuestion(code))}>
          <IconSparkles size={16} stroke={1.5} aria-hidden />
          Ask AI about {title}
        </ToolbarButton>
      </AppToolbar>

      {error && <p className="mb-2 text-xs text-[var(--color-cs-danger)]">{error}</p>}

      {!enrolled && (
        <div className="mb-3 rounded border border-[var(--color-cs-border)] bg-white px-3 py-2 text-[13px] text-[var(--color-cs-text-secondary)]">
          You haven&apos;t marked {title} as an enrolled program.{" "}
          <Link href="/onboarding/benefits" className="text-[var(--color-cs-brand)] hover:underline">
            Update your programs
          </Link>{" "}
          to track these limits live.
        </div>
      )}

      {/* Status summary banner */}
      {!loading && data && (
        <div
          className={`mb-3 rounded-lg border p-3 text-[13px] ${
            counts.concern > 0
              ? "border-[var(--color-cs-danger)] bg-[#fde7e9]"
              : counts.watch > 0
                ? "border-[var(--color-cs-warning)] bg-[#fff4ce]"
                : "border-[#107c10] bg-[#dff6dd]"
          }`}
        >
          {counts.total === 0 ? (
            <span className="text-[var(--color-cs-text)]">
              No reference limits are attached for {title} yet.
            </span>
          ) : counts.concern > 0 ? (
            <span className="font-medium text-[#a4262c]">
              You may be over {counts.concern} of {counts.total} {title} limit
              {counts.concern === 1 ? "" : "s"}
              {counts.watch > 0 ? `, and approaching ${counts.watch} more` : ""}. Review the
              flagged items below and use “Ask AI how to fix” for next steps.
            </span>
          ) : counts.watch > 0 ? (
            <span className="font-medium text-[#8a5400]">
              You&apos;re approaching {counts.watch} of {counts.total} {title} limit
              {counts.watch === 1 ? "" : "s"}. Nothing is over the line yet.
            </span>
          ) : (
            <span className="font-medium text-[#107c10]">
              All {counts.total} {title} limit{counts.total === 1 ? "" : "s"} look on track for{" "}
              {data.monthPrefix}.
            </span>
          )}
        </div>
      )}

      {/* Limit cards */}
      <div className="space-y-2">
        {loading && (
          <p className="text-sm text-[var(--color-cs-text-secondary)]">Loading…</p>
        )}
        {!loading &&
          rows
            // Sort most-urgent first.
            .slice()
            .sort((a, b) => rank(b.status) - rank(a.status))
            .map((r) => {
              const st = STATUS[r.status] ?? STATUS.ok;
              const cur =
                r.currentValueCents != null ? formatPlainUsdFromCents(r.currentValueCents) : null;
              const pct =
                r.currentValueCents != null && r.limitCents > 0
                  ? Math.min(100, Math.round((r.currentValueCents / r.limitCents) * 100))
                  : null;
              const fixHref = advisorAskHref(
                fixThresholdQuestion({
                  program: code,
                  label: r.label,
                  currentValueCents: r.currentValueCents,
                  limitCents: r.limitCents,
                  status: r.status,
                }),
              );
              const showFix = r.status !== "ok";
              return (
                <article
                  key={r._id}
                  className={`rounded-lg border border-[var(--color-cs-border)] border-l-4 ${st.bar} bg-white p-3 text-[13px]`}
                >
                  <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
                    <div className="font-medium text-[var(--color-cs-text)]">{r.label}</div>
                    <span
                      className={`inline-block shrink-0 rounded px-2 py-0.5 text-[11px] font-medium ${st.pill}`}
                    >
                      {st.label}
                    </span>
                  </div>

                  <div className="mb-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[12px] text-[var(--color-cs-text-secondary)]">
                    <span>{TYPE_LABEL[r.thresholdType] ?? r.thresholdType}</span>
                    <span>
                      Reference limit:{" "}
                      <span className="font-medium tabular-nums text-[var(--color-cs-text)]">
                        {formatPlainUsdFromCents(r.limitCents)}
                      </span>
                    </span>
                    {cur != null && (
                      <span>
                        Your estimate:{" "}
                        <span className="font-medium tabular-nums text-[var(--color-cs-text)]">
                          {cur}
                        </span>
                        {pct != null ? ` (${pct}%)` : ""}
                      </span>
                    )}
                  </div>

                  {pct != null && (
                    <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-cs-surface)]">
                      <div
                        className={`h-full rounded-full ${
                          r.status === "concern"
                            ? "bg-[var(--color-cs-danger)]"
                            : r.status === "watch"
                              ? "bg-[var(--color-cs-warning)]"
                              : "bg-[#107c10]"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}

                  {r.description && (
                    <p className="mb-2 text-[12px] leading-relaxed text-[var(--color-cs-text-secondary)]">
                      {r.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {showFix && (
                      <Link
                        href={fixHref}
                        className="inline-flex items-center gap-1.5 rounded-sm bg-[var(--color-cs-brand)] px-2.5 py-1 text-[12px] font-medium text-white hover:bg-[var(--color-cs-brand-hover)]"
                      >
                        <IconSparkles size={14} stroke={1.5} aria-hidden />
                        Ask AI how to fix
                      </Link>
                    )}
                    {r.sourceUrl && (
                      <a
                        href={r.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[12px] text-[var(--color-cs-brand)] hover:underline"
                      >
                        <IconExternalLink size={13} stroke={1.5} aria-hidden />
                        Official source
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
        {!loading && data && rows.length === 0 && enrolled && (
          <p className="text-sm text-[var(--color-cs-text-secondary)]">
            No reference limits are attached for {title}. Visit{" "}
            <Link href="/thresholds" className="text-[var(--color-cs-brand)] hover:underline">
              Limits
            </Link>{" "}
            to attach the ones that apply to you.
          </p>
        )}
      </div>

      {meta && (
        <div className="mt-4 rounded-lg border border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] p-3 text-[12px] text-[var(--color-cs-text-secondary)]">
          <div className="mb-1 font-medium text-[var(--color-cs-text)]">Reporting</div>
          <p className="mb-2 leading-relaxed">{meta.reporting}</p>
          <div>
            Administered by {meta.agency}.{" "}
            <a
              href={meta.officialUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--color-cs-brand)] hover:underline"
            >
              Official program page
            </a>
          </div>
          <p className="mt-2 text-[11px] text-[var(--color-cs-text-muted)]">
            Figures are informational estimates from your linked accounts — MyBenefitsPA does not
            determine eligibility. Always confirm with {meta.agency} or a benefits counselor.
          </p>
        </div>
      )}
    </>
  );
}

function rank(status: string): number {
  if (status === "concern") return 2;
  if (status === "watch") return 1;
  return 0;
}
