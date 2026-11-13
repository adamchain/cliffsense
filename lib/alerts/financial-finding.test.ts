import { describe, expect, it } from "vitest";
import { ALERT_PLAYBOOKS } from "@/lib/alerts/alert-playbook";
import {
  qmbIncomeFinding,
  renderFinancialFinding,
  snapGrossCeilingFinding,
  snapReportingFinding,
  waiverIncomeFinding,
} from "@/lib/alerts/financial-finding";
import { composeTenPart } from "@/lib/alerts/ten-part";
import { qmbIncomeBeforeGeneralExclusionCents } from "@/lib/benefits/qmb-limits";

const OBSERVED = new Date("2026-11-02T15:00:00.000Z");

describe("financial alert findings", () => {
  it("does not treat a waiver DAC exclusion as a QMB result", () => {
    const built = qmbIncomeFinding({
      programs: ["QMB", "DAC", "SSDI", "MedicaidWaiver"],
      countableCents: 2077_60,
      earnedCountableCents: 100_00,
      limitCents: 1350_00,
      level: "breach",
      irweCents: 0,
      monthPrefix: "2026-11",
      observedAt: OBSERVED,
    });
    const text = renderFinancialFinding(built.finding);
    expect(built.level).toBe("warning");
    expect(built.finding.risk).toBe("insufficient_information");
    expect(built.finding.countableCents).toBeNull();
    expect(text).toMatch(/What changed:/);
    expect(text).toMatch(/What counts:/);
    expect(text).toMatch(/What is the risk:/);
    expect(text).toMatch(/What should I do:/);
    expect(text).toMatch(/waiver/i);
    expect(text).not.toMatch(/crossed that limit|over the limit|over that limit/i);
    expect(text).toMatch(/was not applied/i);
    expect(built.finding.deadlineConfidence).toBe("unknown");
  });

  it("states the stored QMB addition when DAC is not enrolled", () => {
    const built = qmbIncomeFinding({
      programs: ["QMB", "SSDI"],
      countableCents: 1500_00,
      earnedCountableCents: 100_00,
      limitCents: 1350_00,
      level: "breach",
      irweCents: 0,
      monthPrefix: "2026-11",
      observedAt: OBSERVED,
    });
    const text = renderFinancialFinding(built.finding);
    expect(built.finding.risk).toBe("potential_ineligibility");
    expect(text).toMatch(/\$1,500\.00/);
    expect(text).toMatch(/\$1,350\.00/);
    expect(text).toMatch(/\$20/);
    expect(text).toMatch(/\$65/);
    expect(text).toMatch(/no DAC exclusion was applied/i);
    expect(text).toMatch(/within 10 days/i);
    expect(built.finding.deadlineConfidence).toBe("estimated");
  });

  it("keeps a QMB result when earned income alone has crossed the limit", () => {
    const built = qmbIncomeFinding({
      programs: ["QMB", "DAC"],
      countableCents: 2000_00,
      earnedCountableCents: 1600_00,
      limitCents: 1350_00,
      level: "breach",
      irweCents: 0,
      monthPrefix: "2026-11",
      observedAt: OBSERVED,
    });
    expect(built.level).toBe("breach");
    expect(built.finding.risk).toBe("potential_ineligibility");
    expect(renderFinancialFinding(built.finding)).toMatch(/earned income/i);
  });

  it("describes the SNAP 130% report separately from the 200% ceiling", () => {
    const finding = snapReportingFinding({
      grossCents: 1800_00,
      householdSize: 1,
      monthPrefix: "2026-11",
      observedAt: OBSERVED,
    });
    const text = renderFinancialFinding(finding);
    expect(finding.risk).toBe("reporting_obligation");
    expect(text).toMatch(/130%/);
    expect(text).toMatch(/not this alert/);
    expect(text).toMatch(/deductions are not part of this test/i);
    expect(finding.deadlineConfidence).toBe("estimated");
  });

  it("does not turn the SNAP 200% ceiling into a 10-day deadline", () => {
    const finding = snapGrossCeilingFinding({
      grossCents: 2700_00,
      limitCents: 2610_00,
      lumpLeftOutCents: 0,
      monthPrefix: "2026-11",
      crossed: true,
    });
    const text = renderFinancialFinding(finding);
    expect(text).toMatch(/200%/);
    expect(text).toMatch(/not the 10-day/i);
    expect(text).toMatch(/deductions were not applied/i);
    expect(finding.deadlineConfidence).toBe("unknown");
    expect(finding.deadlineIso).toBeNull();
  });

  it("withholds a waiver result when the DAC deposit was not identified", () => {
    const finding = waiverIncomeFinding({
      programs: ["MedicaidWaiver", "DAC", "SSDI"],
      countableCents: 2200_00,
      dacExcludedCents: 0,
      monthPrefix: "2026-11",
      observedAt: OBSERVED,
      level: "warning",
    });
    expect(finding.risk).toBe("insufficient_information");
    expect(renderFinancialFinding(finding)).toMatch(/No deposit was identified/);
    expect(renderFinancialFinding(finding)).not.toMatch(/crossed that limit/);
  });

  it("puts the calculation into the alert record instead of the catalog sentence", () => {
    const { finding } = qmbIncomeFinding({
      programs: ["QMB"],
      countableCents: 1000_00,
      earnedCountableCents: 0,
      limitCents: 1350_00,
      level: "warning",
      irweCents: 0,
      monthPrefix: "2026-11",
      observedAt: OBSERVED,
    });
    const parts = composeTenPart({
      playbook: ALERT_PLAYBOOKS.qmb_income_resources!,
      eventSummary: "Stored QMB addition is near the limit.",
      changeConfidence: "inferred",
      observedAt: OBSERVED,
      financialFinding: finding,
    });
    expect(parts.affectedBenefits[0]?.analysis).toBe(finding.whatCounts);
    expect(parts.whyItMatters).toBe(finding.riskText);
    expect(parts.whatChanged).toBe(finding.whatChanged);
    expect(parts.actionDate.label).toBe(finding.whatToDo);
    expect(parts.affectedBenefits[0]?.analysis).not.toMatch(/separate from full Medicaid/);
  });

  it("still counts every benefit deposit in the QMB calculator", () => {
    expect(
      qmbIncomeBeforeGeneralExclusionCents({
        earnedNetCents: 0,
        earnedGrossCents: 0,
        benefitCents: 1140_00 + 1109_00,
        otherCents: 0,
      }),
    ).toBe(2249_00);
  });
});
