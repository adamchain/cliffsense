import type { WageChangeKind } from "@/lib/alerts/wage-change";
import { programCodeKey, programLabel, programMetaFor } from "@/lib/benefits/program-meta";
import { ruleForProgram } from "@/lib/reporting/program-rules";

/** Federal SSA-style programs vs Commonwealth of Pennsylvania programs. */
export type ProgramTier = "federal" | "state";

const FEDERAL = new Set(["SSI", "SSDI", "VA", "ABLE", "EXTRAHELP"]);

export function programTier(program: string): ProgramTier {
  return FEDERAL.has(programCodeKey(program)) ? "federal" : "state";
}

export function programAgencyTag(program: string): string {
  if (programTier(program) === "federal") return "SOCIAL SECURITY ADMINISTRATION";
  return "COMMONWEALTH OF PENNSYLVANIA";
}

export type LimitStatus = "ok" | "warn" | "crit";

export function statusFromRow(status: "ok" | "watch" | "concern"): LimitStatus {
  if (status === "concern") return "crit";
  if (status === "watch") return "warn";
  return "ok";
}

export function statusFromPercent(pct: number, warnAt = 85): LimitStatus {
  if (pct > 100) return "crit";
  if (pct >= warnAt) return "warn";
  return "ok";
}

export function statusWord(sc: LimitStatus, okWord = "On track"): string {
  if (sc === "crit") return "Over limit";
  if (sc === "warn") return "Near limit";
  return okWord;
}

/** Why the card is asking for a wage report. */
export function wageChangeHeadline(kind?: WageChangeKind | null): string {
  switch (kind) {
    case "new_work":
      return "New wages showed up and need to be reported";
    case "increase":
      return "A paycheck is higher than last month and needs to be reported";
    case "decrease":
      return "A paycheck is lower than last month and needs to be reported";
    case "stopped":
      return "Wages stopped and that needs to be reported";
    default:
      return "A wage change needs to be reported";
  }
}

/** Where this program's wage change is reported. The renewal date is not that place. */
export function wageReportPlace(code: string): { href: string; sentence: string } {
  const rule = ruleForProgram(code);
  if (!rule) {
    return {
      href: "https://www.ssa.gov/manage-benefits/report-changes-affect-disability-benefits",
      sentence: "Report it to the agency that runs this benefit. The renewal date is not where you report it.",
    };
  }
  const phone = rule.phone ? ` at ${rule.phone}` : "";
  return {
    href: rule.reportUrl,
    sentence: `Report it to ${rule.agency}${phone}. ${rule.deadlineNote} The renewal date is not where you report it.`,
  };
}

/** Plain-language reassurance — answers "Am I okay?" before the numbers. */
export function statusReassurance(
  status: LimitStatus,
  opts?: {
    hasLimit?: boolean;
    code?: string;
    reportingDue?: boolean;
    wageReport?: boolean;
    wageChangeKind?: WageChangeKind | null;
  },
): string {
  const hasLimit = opts?.hasLimit ?? true;
  if (status === "warn" && opts?.reportingDue && opts.code === "SNAP") {
    return "Gross income is over the 10-day reporting line";
  }
  if (status === "warn" && opts?.wageReport) {
    return wageChangeHeadline(opts.wageChangeKind);
  }
  if (status === "crit") {
    return hasLimit
      ? "You're over the monthly limit — review needed"
      : "This benefit needs attention";
  }
  if (status === "warn") {
    return hasLimit
      ? "You're approaching the monthly limit"
      : "Something needs a closer look soon";
  }
  const code = opts?.code;
  if (code === "SSDI" || code === "SSI" || code === "VA") {
    return "You're safely below the monthly earnings limit";
  }
  if (code === "SNAP" || code === "TANF" || code === "WIC") {
    return "You're safely within your benefit limits";
  }
  if (hasLimit) return "You're safely below the monthly limit";
  return "Everything looks good for this benefit";
}

export function formatUsdCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function attachWageChangeKind<T extends ProgramCardModel>(
  cards: T[],
  kind: WageChangeKind | null | undefined,
): T[] {
  if (!kind) return cards;
  return cards.map((card) => (card.wageReport ? { ...card, wageChangeKind: kind } : card));
}

export function statusRank(sc: LimitStatus): number {
  if (sc === "crit") return 2;
  if (sc === "warn") return 1;
  return 0;
}

export type ProgramCardModel = {
  code: string;
  label: string;
  tier: ProgramTier;
  tag: string;
  status: LimitStatus;
  word: string;
  currentCents: number | null;
  limitCents: number | null;
  pct: number | null;
  concern: number;
  watch: number;
  total: number;
  /** SNAP is under the 200% line and over the 10-day reporting line. */
  reportingDue?: boolean;
  /** A wage change is reportable even though this program is still under its limit. */
  wageReport?: boolean;
  /** What kind of wage change was detected, when wageReport is set. */
  wageChangeKind?: WageChangeKind | null;
  /**
   * Soonest open obligation for this benefit of any kind (renewal, review,
   * interim report, change report, or document request).
   */
  nextDue?: {
    title: string;
    /** YYYY-MM-DD */
    date: string;
    confidenceLabel: string;
    category: string;
  } | null;
  obligations?: { label: string; value: string; sooner: boolean }[];
};

type RowLike = {
  program: string | null;
  attached: boolean;
  status: "ok" | "watch" | "concern";
  currentValueCents: number | null;
  limitCents: number;
  statusNote?: "snap_report_130" | "wage_report" | "reference" | null;
  thresholdType?: string;
};

/** Collapse threshold rows into one wallet card per program. */
export function buildProgramCards(rows: RowLike[]): ProgramCardModel[] {
  type Acc = {
    code: string;
    concern: number;
    watch: number;
    total: number;
    metricStatus: LimitStatus;
    currentCents: number | null;
    limitCents: number | null;
    metricType: string | null;
    reportingDue: boolean;
    wageReport: boolean;
  };
  const groups = new Map<string, Acc>();

  for (const r of rows) {
    if (!r.program || !r.attached || r.statusNote === "reference") continue;
    const code = programCodeKey(r.program);
    const g = groups.get(code) ?? {
      code,
      concern: 0,
      watch: 0,
      total: 0,
      metricStatus: "ok" as LimitStatus,
      currentCents: null,
      limitCents: null,
      metricType: null,
      reportingDue: false,
      wageReport: false,
    };
    g.total += 1;
    if (r.status === "concern") g.concern += 1;
    else if (r.status === "watch") g.watch += 1;
    if (r.statusNote === "snap_report_130") g.reportingDue = true;
    if (r.statusNote === "wage_report") g.wageReport = true;

    const sc = statusFromRow(r.status);
    if (r.currentValueCents != null) {
      const bothEarned =
        g.metricType === "monthly_earned_income" && r.thresholdType === "monthly_earned_income";
      const replace =
        g.currentCents == null ||
        statusRank(sc) > statusRank(g.metricStatus) ||
        (bothEarned &&
          statusRank(sc) === statusRank(g.metricStatus) &&
          (g.limitCents ?? 0) < r.limitCents);
      if (replace) {
        g.currentCents = r.currentValueCents;
        g.limitCents = r.limitCents;
        g.metricStatus = sc;
        g.metricType = r.thresholdType ?? g.metricType;
      }
    }

    groups.set(code, g);
  }

  return [...groups.values()]
    .map((g) => {
      const pct =
        g.currentCents != null && g.limitCents != null && g.limitCents > 0
          ? Math.round((g.currentCents / g.limitCents) * 100)
          : null;
      const status: LimitStatus =
        g.concern > 0 ? "crit" : g.watch > 0 ? "warn" : "ok";
      const reportingDue = status === "warn" && g.reportingDue;
      const wageReport = status === "warn" && g.wageReport && !reportingDue;
      const meta = programMetaFor(g.code);
      return {
        code: g.code,
        label: programLabel(g.code),
        tier: programTier(g.code),
        tag: programAgencyTag(g.code),
        status,
        word: reportingDue ? "Report income" : wageReport ? "Report change" : statusWord(status, meta ? "On track" : "On track"),
        reportingDue,
        wageReport,
        currentCents: g.currentCents,
        limitCents: g.limitCents,
        pct,
        concern: g.concern,
        watch: g.watch,
        total: g.total,
      };
    })
    .sort(
      (a, b) =>
        statusRank(b.status) - statusRank(a.status) ||
        b.concern - a.concern ||
        b.watch - a.watch ||
        a.code.localeCompare(b.code),
    );
}
