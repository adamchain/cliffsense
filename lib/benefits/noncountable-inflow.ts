/**
 * Deposits that are not countable income even when a bank feed tags them as a
 * benefit or other income. SNAP is never income. An ABLE distribution is left
 * out of this estimate; a withdrawal that was not for a qualified disability
 * expense can still count, and a counselor has to make that call.
 */

export type NoncountableInflow = "snap" | "able_distribution";

const SNAP =
  /\b(?:snap|food\s*stamps?)\b|\b(?:ebt\s*food|food\s*ebt|fs\s*ebt)\b/i;

const ABLE_PROGRAM =
  /\b(?:pa\s*able|able\s*united|able\s*now|national\s*able|calable|oregon\s*able|stable\s*account)\b/i;

const ABLE_MOVE =
  /\bable\b.{0,40}\b(?:distribution|withdrawal|disbursement)\b|\b(?:distribution|withdrawal|disbursement)\b.{0,40}\bable\b/i;

export function noncountableInflowReason(text: string): NoncountableInflow | null {
  if (SNAP.test(text)) return "snap";
  if (ABLE_PROGRAM.test(text) || ABLE_MOVE.test(text)) return "able_distribution";
  return null;
}

export function noncountableIncomeNote(reason: NoncountableInflow): string {
  if (reason === "snap") return "SNAP is not counted as income.";
  return "An ABLE distribution is left out of this income estimate.";
}
