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
    expect(text).toMatch(/December 10, 2026/);
    expect(built.finding.deadlineConfidence).toBe("estimated");
  });

  it("does not call a summed QMB deposit total a loss of QMB", () => {
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
    expect(built.level).toBe("warning");
    expect(built.finding.risk).toBe("insufficient_information");
    expect(text).toMatch(/\$1,500\.00/);
    expect(text).toMatch(/\$1,350\.00/);
    expect(text).toMatch(/\$20/);
    expect(text).toMatch(/\$65/);
    expect(text).toMatch(/December 10, 2026/);
    expect(text).not.toMatch(/within 10 days/i);
  });

  it("still asks for the QMB category when wages alone pass the published screen", () => {
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
    expect(built.level).toBe("warning");
    expect(built.finding.risk).toBe("insufficient_information");
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
    expect(text).toMatch(/200%/);
    expect(text).toMatch(/not a loss of SNAP/i);
    expect(text).toMatch(/December 10, 2026/);
    expect(text).not.toMatch(/within 10 days/i);
    expect(finding.deadlineConfidence).toBe("estimated");
  });

  it("does not treat $2,000 of one-person gross income as a loss of SNAP", () => {
    const finding = snapReportingFinding({
      grossCents: 2000_00,
      householdSize: 1,
      monthPrefix: "2026-11",
      observedAt: OBSERVED,
    });
    const text = renderFinancialFinding(finding);
    expect(text).toMatch(/\$2,000\.00/);
    expect(text).toMatch(/\$1,729\.00/);
    expect(text).toMatch(/\$2,660\.00/);
    expect(text).toMatch(/under the 200% screening guide/);
    expect(text).toMatch(/December 10, 2026/);
    expect(finding.risk).not.toBe("potential_ineligibility");
  });

  it("does not turn the SNAP 200% guide into a reporting deadline", () => {
    const finding = snapGrossCeilingFinding({
      grossCents: 2700_00,
      limitCents: 2660_00,
      lumpLeftOutCents: 0,
      monthPrefix: "2026-11",
      crossed: true,
    });
    const text = renderFinancialFinding(finding);
    expect(text).toMatch(/200%/);
    expect(text).toMatch(/does not by itself end SNAP/i);
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
