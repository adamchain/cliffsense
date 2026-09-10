/** Canonical list of benefit programs a beneficiary can enroll in. */
export const PROGRAMS = [
  "SSI",
  "SSDI",
  "SNAP",
  "MedicaidABD",
  "MedicaidMAGI",
  "MedicaidWaiver",
  "MAWD",
  "QMB",
  "ExtraHelp",
  "TANF",
  "WIC",
  "LIHEAP",
  "ACA",
  "VA",
  "ABLE",
] as const;

export type Program = (typeof PROGRAMS)[number];

/** Older enrollment value kept so existing beneficiary records still load. */
/** Older enrollment values kept so existing beneficiary records still load. */
export const LEGACY_PROGRAMS = ["Medicaid", "Section8"] as const;
export type LegacyProgram = (typeof LEGACY_PROGRAMS)[number];

export const STORED_PROGRAMS = [...PROGRAMS, ...LEGACY_PROGRAMS] as const;
export type StoredProgram = (typeof STORED_PROGRAMS)[number];

/** Medicaid / Medicare-help categories that used to be a single "Medicaid" toggle. */
export const MEDICAID_FAMILY_PROGRAMS = [
  "MedicaidABD",
  "MedicaidMAGI",
  "MedicaidWaiver",
  "MAWD",
  "QMB",
] as const;

export type ProgramGroup = {
  id: string;
  label: string;
  hint: string;
  programs: readonly Program[];
};

export const PROGRAM_GROUPS: readonly ProgramGroup[] = [
  {
    id: "medicaid",
    label: "Medicaid (Medical Assistance)",
    hint: "Pennsylvania Medicaid is several categories with different income and asset tests. Select every type you actually receive.",
    programs: ["MedicaidABD", "MedicaidMAGI", "MedicaidWaiver", "MAWD"],
  },
  {
    id: "medicare-help",
    label: "Medicare cost help",
    hint: "These are separate from full Medicaid. You can have QMB and/or Extra Help alongside a Medicaid category.",
    programs: ["QMB", "ExtraHelp"],
  },
];

const GROUPED = new Set(PROGRAM_GROUPS.flatMap((g) => [...g.programs]));

export const UNGROUPED_PROGRAMS: Program[] = PROGRAMS.filter((p) => !GROUPED.has(p));

export function isStoredProgram(value: string): value is StoredProgram {
  return (STORED_PROGRAMS as readonly string[]).includes(value);
}

export function isMedicaidFamilyProgram(program: string): boolean {
  const k = String(program ?? "").trim().toUpperCase();
  return (
    k === "MEDICAID" ||
    k === "MEDICAIDABD" ||
    k === "MEDICAIDMAGI" ||
    k === "MEDICAIDWAIVER" ||
    k === "MAWD" ||
    k === "QMB"
  );
}

/**
 * Uppercase program keys used to attach system thresholds.
 * A legacy "Medicaid" enrollment still receives every Medicaid-family limit.
 */
export function expandEnrolledProgramKeys(programs: readonly string[]): string[] {
  const keys = new Set<string>();
  for (const p of programs) {
    const k = String(p ?? "").trim().toUpperCase();
    if (!k || k === "SECTION8") continue;
    keys.add(k);
  }
  if (keys.has("MEDICAID")) {
    for (const p of MEDICAID_FAMILY_PROGRAMS) keys.add(p.toUpperCase());
  }
  return [...keys];
}

/** Replace a generic Medicaid enrollment with the selectable subtypes for the picker. */
export function expandLegacyMedicaidSelection(programs: readonly string[]): string[] {
  const next = new Set<string>();
  let hadGeneric = false;
  for (const p of programs) {
    if (String(p).trim().toUpperCase() === "MEDICAID") {
      hadGeneric = true;
      continue;
    }
    if (p && String(p).trim().toUpperCase() !== "SECTION8") next.add(p);
  }
  if (hadGeneric) {
    for (const p of MEDICAID_FAMILY_PROGRAMS) next.add(p);
  }
  return [...next];
}

export function enrolledMatchesProgram(
  enrolled: readonly string[],
  wanted: string,
): boolean {
  const keys = expandEnrolledProgramKeys(enrolled);
  const w = String(wanted ?? "").trim().toUpperCase();
  if (!w) return false;
  if (w === "MEDICAID") return keys.some((k) => isMedicaidFamilyProgram(k));
  if (w === "EXTRAHELP" || w === "LIS") {
    return keys.includes("EXTRAHELP") || keys.includes("LIS") || keys.some((k) => k.includes("EXTRA"));
  }
  return keys.includes(w);
}
