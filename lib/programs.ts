/** Canonical list of benefit programs a beneficiary can be enrolled in. */
export const PROGRAMS = [
  "SSI",
  "SSDI",
  "SNAP",
  "Medicaid",
  "Section8",
  "TANF",
  "WIC",
  "LIHEAP",
  "ACA",
  "VA",
  "ABLE",
] as const;

export type Program = (typeof PROGRAMS)[number];
