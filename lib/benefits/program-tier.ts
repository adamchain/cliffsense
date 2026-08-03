import { programCodeKey, programLabel, programMetaFor } from "@/lib/benefits/program-meta";

/** Federal SSA-style programs vs Commonwealth of Pennsylvania programs. */
export type ProgramTier = "federal" | "state";

const FEDERAL = new Set(["SSI", "SSDI", "VA", "ABLE"]);

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

export function formatUsdCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
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
};

type RowLike = {
  program: string | null;
  attached: boolean;
  status: "ok" | "watch" | "concern";
  currentValueCents: number | null;
  limitCents: number;
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
  };
  const groups = new Map<string, Acc>();

  for (const r of rows) {
    if (!r.program || !r.attached) continue;
    const code = programCodeKey(r.program);
    const g = groups.get(code) ?? {
      code,
      concern: 0,
      watch: 0,
      total: 0,
      metricStatus: "ok" as LimitStatus,
      currentCents: null,
      limitCents: null,
    };
    g.total += 1;
    if (r.status === "concern") g.concern += 1;
    else if (r.status === "watch") g.watch += 1;

    const sc = statusFromRow(r.status);
    if (r.currentValueCents != null) {
      if (g.currentCents == null || statusRank(sc) > statusRank(g.metricStatus)) {
        g.currentCents = r.currentValueCents;
        g.limitCents = r.limitCents;
        g.metricStatus = sc;
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
      const meta = programMetaFor(g.code);
      return {
        code: g.code,
        label: programLabel(g.code),
        tier: programTier(g.code),
        tag: programAgencyTag(g.code),
        status,
        word: statusWord(status, meta ? "On track" : "On track"),
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
