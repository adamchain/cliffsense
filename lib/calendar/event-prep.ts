import { programCodeKey } from "@/lib/benefits/program-meta";

export type PrepItemKind = "document" | "action" | "link" | "review";

export type EventPrepItem = {
  id: string;
  kind: PrepItemKind;
  title: string;
  detail: string;
  href?: string;
  external?: boolean;
};

export type EventPrepPackage = {
  headline: string;
  summary: string;
  items: EventPrepItem[];
};

type PrepInput = {
  title: string;
  kind: string;
  program: string | null;
  channelLabel?: string | null;
  channelUrl?: string | null;
  estimatedWagesCents?: number | null;
};

function isWageEvent(title: string, kind: string): boolean {
  return kind !== "renewal" && /wage|earnings|income|pay\s*stub/i.test(title);
}

function isRenewalEvent(title: string, kind: string): boolean {
  return kind === "renewal" || kind === "sar" || /\brenewal|redetermination|recert/i.test(title);
}

function kindHeadline(kind: string, wage: boolean, renewal: boolean): { headline: string; summary: string } {
  switch (kind) {
    case "interview":
      return {
        headline: "Prep for the interview",
        summary: "Update the phone number on COMPASS, upload proofs first, and request a reschedule if the agency used an old number.",
      };
    case "verification":
      return {
        headline: "Prep the verification packet",
        summary: "Send complete statements (every page), not screenshots. Call the CAO to confirm what is still missing.",
      };
    case "premium":
      return {
        headline: "Cure the MAWD premium",
        summary: "Confirm arrears and due date, pay through an accepted channel, then apply for another Medicaid category if it cannot be cured.",
      };
    case "cdr":
      return {
        headline: "Prep the medical review",
        summary: "Return CDR forms by the deadline, list providers, and keep treating-source records for the whole review period.",
      };
    case "assessment":
      return {
        headline: "Prep the waiver reassessment",
        summary: "Financial renewal does not replace level-of-care. Reschedule immediately and gather current care records.",
      };
    case "appeal":
    case "continued_benefits":
      return {
        headline: "Protect appeal and continued benefits",
        summary: "The continued-benefits deadline is often earlier than the appeal deadline. File a new application in parallel.",
      };
    default:
      return wage
        ? {
            headline: "Prep for wage reporting",
            summary: "Pull pay stubs, confirm earned-income totals, then file on the agency site.",
          }
        : renewal
          ? {
              headline: "Prep for renewal",
              summary: "Gather proof of income, resources, and household — then respond by the due date.",
            }
          : {
              headline: "Prep for this deadline",
              summary: "Use Vault, Forms, and Money to assemble what the agency will ask for.",
            };
  }
}

/**
 * Checklist of items MyBenefitsPA can help gather before a deadline.
 */
export function buildEventPrepPackage(input: PrepInput): EventPrepPackage {
  const code = input.program ? programCodeKey(input.program) : null;
  const wage = isWageEvent(input.title, input.kind);
  const renewal = isRenewalEvent(input.title, input.kind);
  const items: EventPrepItem[] = [];

  if (wage) {
    items.push(
      {
        id: "review-wages",
        kind: "review",
        title: "Review earned income this month",
        detail:
          input.estimatedWagesCents != null
            ? "Compare categorized pay deposits to what you’ll report as gross wages."
            : "Categorize payroll deposits as earned income so totals match your stubs.",
        href: "/transactions",
      },
      {
        id: "pay-stubs",
        kind: "document",
        title: "Upload pay stubs",
        detail: "Save gross pay, hours, and pay dates in Vault before you file.",
        href: "/vault",
      },
      {
        id: "forms",
        kind: "document",
        title: "Open related forms",
        detail: "Printable worksheets and agency packets when you need a paper trail.",
        href: "/documents",
      },
    );
  } else if (renewal) {
    items.push(
      {
        id: "program-limits",
        kind: "review",
        title: "Check current limits",
        detail: "Confirm income and resource standing before you respond to the review.",
        href: code ? `/thresholds/${code}` : "/thresholds",
      },
      {
        id: "vault-docs",
        kind: "document",
        title: "Gather proof from Vault",
        detail: "ID, income, resources, and household docs the agency usually asks for.",
        href: "/vault",
      },
      {
        id: "forms",
        kind: "document",
        title: "Open renewal forms",
        detail: "Find packets and checklists to complete alongside the mailed notice.",
        href: "/documents",
      },
    );
  } else {
    items.push(
      {
        id: "program",
        kind: "review",
        title: "Review program status",
        detail: "See limits and what’s tracked for this benefit before you report.",
        href: code ? `/thresholds/${code}` : "/thresholds",
      },
      {
        id: "vault",
        kind: "document",
        title: "Collect supporting documents",
        detail: "Keep pay stubs, notices, and proof of changes ready in Vault.",
        href: "/vault",
      },
      {
        id: "forms",
        kind: "document",
        title: "Browse forms",
        detail: "Use worksheets when the agency asks for paper or a signed statement.",
        href: "/documents",
      },
    );
  }

  if (input.channelUrl) {
    items.push({
      id: "file",
      kind: "link",
      title: input.channelLabel ? `File via ${input.channelLabel}` : "Open filing site",
      detail: "Have stubs and totals ready, then submit on the official channel.",
      href: input.channelUrl,
      external: true,
    });
  }

  items.push({
    id: "advisor",
    kind: "action",
    title: "Ask Advisor before you submit",
    detail: "Walk through what to report and what to leave out for this deadline.",
    href: "/advisor",
  });

  const headlinePack = kindHeadline(input.kind, wage, renewal);
  const headline = headlinePack.headline;
  const summary = headlinePack.summary;

  return { headline, summary, items };
}
