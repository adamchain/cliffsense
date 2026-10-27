import { formatPlainUsdFromCents } from "@/lib/format/money";
import { programLabel } from "@/lib/benefits/program-meta";

/** Build an "/advisor?ask=" href from a question string. */
export function advisorAskHref(question: string): string {
  return `/advisor?ask=${encodeURIComponent(question.slice(0, 500))}`;
}

/**
 * "How do I fix this specific limit" question for a single threshold the user is
 * over or approaching. Includes the dollar figures the user is already seeing so
 * the advisor can give concrete, actionable next steps.
 */
export function fixThresholdQuestion(input: {
  program: string;
  label: string;
  currentValueCents?: number | null;
  limitCents: number;
  status?: "ok" | "watch" | "concern";
}): string {
  const prog = programLabel(input.program);
  const limit = formatPlainUsdFromCents(input.limitCents);
  const current =
    input.currentValueCents != null ? formatPlainUsdFromCents(input.currentValueCents) : null;
  const overOrNear =
    input.status === "concern" ? "appears to be over" : "is getting close to";
  const figures = current
    ? `My estimated amount this month is about ${current} against a reference limit of ${limit}.`
    : `The reference limit is ${limit}.`;
  return (
    `For ${prog} in Pennsylvania (2026): my "${input.label}" ${overOrNear} the limit. ${figures} ` +
    `What practical, concrete steps could help me stay eligible or address being over this limit — ` +
    `for example exclusions, work incentives, an ABLE account, spend-down, or what to report and to whom? ` +
    `Keep it actionable and note this isn't an eligibility determination.`
  );
}

/** General "give me an overview + tips" question for a whole program. */
export function programOverviewQuestion(program: string): string {
  const prog = programLabel(program);
  return (
    `Give me a plain-language overview of ${prog} eligibility limits in Pennsylvania for 2026 ` +
    `(income, assets, reporting) and practical tips to stay eligible while improving my situation.`
  );
}
