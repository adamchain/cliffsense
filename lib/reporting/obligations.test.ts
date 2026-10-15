import { describe, expect, it } from "vitest";
import {
  changeReportingByProgram,
  nextOpenObligation,
  obligationCategoryForKind,
  stageSummary,
  summarizeProgramObligations,
  type ObligationRow,
} from "./obligations";

function row(p: Partial<ObligationRow> & Pick<ObligationRow, "id" | "dueDate" | "kind">): ObligationRow {
  return {
    program: "SNAP",
    title: p.kind,
    confidence: "needs_confirmation",
    completedAt: null,
    ...p,
  };
}

describe("obligation categories", () => {
  it("keeps renewals, interim reports, change reports, and document requests apart", () => {
    expect(obligationCategoryForKind("renewal")).toBe("renewal_review");
    expect(obligationCategoryForKind("redetermination")).toBe("renewal_review");
    expect(obligationCategoryForKind("cdr")).toBe("renewal_review");
    expect(obligationCategoryForKind("assessment")).toBe("renewal_review");
    expect(obligationCategoryForKind("sar")).toBe("interim_report");
    expect(obligationCategoryForKind("change_report")).toBe("change_report");
    expect(obligationCategoryForKind("verification")).toBe("document_request");
  });
});

describe("a distant renewal never hides an earlier deadline", () => {
  const rows = [
    row({ id: "renew", kind: "renewal", dueDate: "2027-06-30", confidence: "confirmed" }),
    row({ id: "sar", kind: "sar", dueDate: "2026-12-10" }),
    row({ id: "docs", kind: "verification", dueDate: "2026-11-01", confidence: "confirmed" }),
  ];

  it("picks the earliest open obligation of any kind", () => {
    expect(nextOpenObligation(rows)?.id).toBe("docs");
  });

  it("flags that something is due before the renewal", () => {
    const s = summarizeProgramObligations("SNAP", rows, { snapCategory: "sar" });
    expect(s.nextRenewal?.id).toBe("renew");
    expect(s.nextInterim?.id).toBe("sar");
    expect(s.documentsDue.map((r) => r.id)).toEqual(["docs"]);
    expect(s.earliest?.id).toBe("docs");
    expect(s.earlierThanRenewal).toBe(true);
  });

  it("keeps overdue, unfinished obligations visible", () => {
    const s = summarizeProgramObligations("SNAP", [
      ...rows,
      row({ id: "late", kind: "change_report", dueDate: "2020-01-01" }),
    ]);
    expect(s.earliest?.id).toBe("late");
  });
});

describe("completing one obligation does not complete another", () => {
  it("only removes the completed row", () => {
    const rows = [
      row({ id: "renew", kind: "renewal", dueDate: "2027-06-30", completedAt: "2026-10-01" }),
      row({ id: "sar", kind: "sar", dueDate: "2026-12-10" }),
    ];
    const s = summarizeProgramObligations("SNAP", rows);
    expect(s.nextRenewal).toBeNull();
    expect(s.nextInterim?.id).toBe("sar");
  });

  it("does not mix programs", () => {
    const rows = [
      row({ id: "snap", kind: "sar", dueDate: "2026-12-10" }),
      row({ id: "ssi", program: "SSI", kind: "redetermination", dueDate: "2026-11-10" }),
    ];
    expect(summarizeProgramObligations("SNAP", rows).earliest?.id).toBe("snap");
    expect(summarizeProgramObligations("SSI", rows).earliest?.id).toBe("ssi");
  });
});

describe("SNAP reporting category", () => {
  it("does not assume a twice-yearly report or an exemption when unknown", () => {
    expect(summarizeProgramObligations("SNAP", [], { snapCategory: "unknown" }).interimExpected).toBeNull();
    expect(summarizeProgramObligations("SNAP", [], { snapCategory: "esap" }).interimExpected).toBeNull();
    expect(summarizeProgramObligations("SNAP", [], { snapCategory: "sar" }).interimExpected).toBe(true);
  });
});

describe("notice vs. expected schedule", () => {
  it("flags a discrepancy and keeps the notice date", () => {
    const rows = [
      row({ id: "n", kind: "sar", dueDate: "2026-12-05", confidence: "confirmed", title: "SAR" }),
      row({ id: "e", kind: "sar", dueDate: "2026-12-31", confidence: "estimated", title: "SAR" }),
    ];
    const s = summarizeProgramObligations("SNAP", rows);
    expect(s.discrepancies).toHaveLength(1);
    expect(s.nextInterim?.id).toBe("n");
  });
});

describe("change affecting several programs", () => {
  it("lists each program's own requirement once", () => {
    const out = changeReportingByProgram(["SSI", "SNAP", "MedicaidABD", "ssi"]);
    expect(out.map((o) => o.code)).toEqual(["SSI", "SNAP", "MEDICAIDABD"]);
    expect(out[0]!.deadline).toMatch(/10th of the month/);
  });
});

describe("stage summary", () => {
  it("asks for proof after submission", () => {
    expect(stageSummary({ submittedAt: "2026-10-01" })).toMatch(/save proof/);
    expect(stageSummary({})).toBe("Not started");
  });
});
