import type { AlertPlaybook } from "@/lib/alerts/alert-playbook";
import { ruleForProgram, reportingDueDate } from "@/lib/reporting/program-rules";
import { isCurrentRule, ruleStatusLine, stampForPlaybook, type RuleStamp } from "@/lib/rules/stamp";

export type ChangeConfidence = "confirmed" | "inferred";
export type DeadlineConfidence = "confirmed" | "estimated" | "unknown";

export type EvidenceRequest = {
  key: string;
  label: string;
  documentId: string | null;
};

export type AffectedBenefit = {
  program: string;
  analysis: string;
  rule: RuleStamp;
};

export type TenPartAlert = {
  whatChanged: string;
  changeConfidence: ChangeConfidence;
  affectedBenefits: AffectedBenefit[];
  whyItMatters: string;
  actionDate: {
    label: string;
    iso: string | null;
    source: string;
    confidence: DeadlineConfidence;
  };
  evidence: EvidenceRequest[];
  officialChannel: {
    agency: string;
    url: string;
    phone: string | null;
    note: string;
  };
  alternativePathway: string;
  proofToRetain: string;
  followUp: {
    ownerRole: "beneficiary_or_monitor";
    nextDate: string | null;
    note: string;
  };
  cureAndAppeal: {
    appealDeadline: string | null;
    continuedBenefitsDeadline: string | null;
    source: "notice" | "none";
    note: string;
  };
};

const COMPASS = "https://www.compass.state.pa.us/compass.web/Public/CMPHome";
const PA_DHS_PHONE = "1-877-395-8930";

function channelFor(program: string): {
  short: string;
  agency: string;
  phone?: string;
  deadlineNote: string;
  reportUrl: string;
} | null {
  const rule = ruleForProgram(program);
  if (rule) return rule;
  const key = program.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (key.includes("MEDICAID") || key === "MAWD" || key === "QMB" || key === "TANF" || key === "LIHEAP") {
    return {
      short: program,
      agency: "PA County Assistance Office",
      phone: PA_DHS_PHONE,
      deadlineNote: "Use the date on the notice. Income, household, and resource changes are generally reported within 10 days.",
      reportUrl: COMPASS,
    };
  }
  if (key === "WIC") {
    return {
      short: "WIC",
      agency: "WIC clinic",
      deadlineNote: "Use the certification appointment. WIC has no monthly wage-reporting clock.",
      reportUrl: "",
    };
  }
  return null;
}

const REVIEW =
  "This is a review signal for this program alone. Bene-Watch does not decide eligibility.";

function slotKey(label: string, index: number): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${slug || "doc"}-${index}`;
}

function dateOnly(iso: string): string {
  return iso.slice(0, 10);
}

export function composeTenPart(input: {
  playbook: AlertPlaybook;
  eventSummary: string;
  changeConfidence: ChangeConfidence;
  observedAt: Date;
  /** YYYY-MM-DD taken from a notice or typed by the user. */
  noticeDeadline?: string | null;
  userNote?: string | null;
  /** When set, only these programs are treated as affected. Otherwise the playbook catalog is used. */
  programs?: string[];
}): TenPartAlert {
  const programs = input.programs?.length
    ? input.programs
    : input.playbook.programs.length
      ? input.playbook.programs
      : ["Unspecified"];
  const observed = dateOnly(input.observedAt.toISOString());
  const confidenceLine =
    input.changeConfidence === "confirmed"
      ? "A person on this case confirmed this event."
      : "This event is inferred from linked account activity and still needs confirmation.";
  const note = input.userNote?.trim();

  const channelLines = programs.map((program) => {
    const rule = channelFor(program);
    if (!rule) {
      return `${program}: confirm the agency and use the date on the notice. Do not report automatically.`;
    }
    const phone = rule.phone ? ` ${rule.phone}.` : "";
    return `${rule.short}: ${rule.agency}.${phone} ${rule.deadlineNote} ${rule.reportUrl}`;
  });
  const primary = programs.map((program) => channelFor(program)).find(Boolean);

  let actionIso: string | null = null;
  let actionConfidence: DeadlineConfidence = "unknown";
  let actionSource = "No deadline is stored. A date printed on a notice controls.";
  const notice = input.noticeDeadline?.trim();
  if (notice && /^\d{4}-\d{2}-\d{2}$/.test(notice)) {
    actionIso = `${notice}T23:59:59.999Z`;
    actionConfidence = "confirmed";
    actionSource = "Date entered from a notice or by a person on this case.";
  } else {
    const dates = programs
      .map((program) => reportingDueDate(program, input.observedAt))
      .filter((d): d is Date => d != null)
      .sort((a, b) => a.getTime() - b.getTime());
    if (dates[0]) {
      actionIso = dates[0].toISOString();
      actionConfidence = "estimated";
      actionSource =
        "Estimated from that program's reporting clock. A date on a notice replaces it. Do not use one program's clock for another program.";
    }
  }

  return {
    whatChanged: [input.playbook.title, input.eventSummary, confidenceLine, `Observed ${observed}.`, note]
      .filter(Boolean)
      .join(" "),
    changeConfidence: input.changeConfidence,
    affectedBenefits: programs.map((program) => ({
      program,
      analysis: `${input.playbook.triggeringRule} ${REVIEW}`,
      rule: stampForPlaybook(input.playbook.id, program),
    })),
    whyItMatters: `${input.playbook.triggeringRule} ${REVIEW}`,
    actionDate: {
      label: input.playbook.effectiveDateNote,
      iso: actionIso,
      source: actionSource,
      confidence: actionConfidence,
    },
    evidence: input.playbook.documents.map((label, index) => ({
      key: slotKey(label, index),
      label,
      documentId: null,
    })),
    officialChannel: {
      agency: primary?.agency ?? "Confirm the agency that administers each benefit",
      url: primary?.reportUrl ?? "",
      phone: primary?.phone ?? null,
      note: channelLines.join("\n"),
    },
    alternativePathway: input.playbook.alternativePathway,
    proofToRetain:
      "Keep the receipt, confirmation number, copy, mailing proof, or screenshot, and link that file on this case. Bene-Watch does not file with an agency.",
    followUp: {
      ownerRole: "beneficiary_or_monitor",
      nextDate: null,
      note: "A follow-up opens after a submission is recorded and the agency has not confirmed receipt.",
    },
    cureAndAppeal: {
      appealDeadline: null,
      continuedBenefitsDeadline: null,
      source: "none",
      note: input.playbook.appealNote,
    },
  };
}

export function currentRuleSummary(parts: TenPartAlert, now: Date = new Date()): {
  current: boolean;
  line: string;
} {
  const stamps = parts.affectedBenefits.map((b) => b.rule);
  const current = stamps.length > 0 && stamps.every((stamp) => isCurrentRule(stamp, now));
  const line = stamps.map((stamp) => ruleStatusLine(stamp, now)).join(" · ");
  return { current, line };
}
