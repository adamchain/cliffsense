import { describe, expect, it } from "vitest";
import {
  ALERT_PLAYBOOKS,
  APPEAL_AND_CONTINUE,
  playbookEmailParagraphs,
  playbookIdForThreshold,
  playbookPersonaSteps,
  resolveAlertPlaybook,
  scenarioPlaybookCoverage,
} from "@/lib/alerts/alert-playbook";
import { ELIGIBILITY_LOSS_SCENARIOS } from "@/lib/alerts/eligibility-loss-scenarios";

describe("alert playbooks", () => {
  it("covers every eligibility-loss scenario id", () => {
    expect(scenarioPlaybookCoverage().missing).toEqual([]);
    for (const s of ELIGIBILITY_LOSS_SCENARIOS) {
      const pb = ALERT_PLAYBOOKS[s.id];
      expect(pb?.programs.length).toBeGreaterThan(0);
      expect(pb?.documents.length).toBeGreaterThan(0);
      expect(pb?.appealNote).toContain("appeal");
    }
  });

  it("resolves stored scenario alerts and threshold snapshots", () => {
    expect(resolveAlertPlaybook({ scenarioId: "ssdi_sga_after_twp" }).personaId).toBe(
      "anthony_sga_after_twp",
    );
    expect(playbookIdForThreshold("SSI", "asset_balance")).toBe("ssi_resources_2k");
    expect(playbookIdForThreshold("MedicaidMAGI", "monthly_gross_income")).toBe("lucas_magi_income");
    expect(resolveAlertPlaybook({ program: "SNAP", thresholdType: "monthly_gross_income" }).id).toBe(
      "snap_gross_200_fpl",
    );
  });

  it("attaches six-step persona plans and SNAP/Medicaid closure-code notes", () => {
    const renewal = ALERT_PLAYBOOKS.medicaid_renewal_packet!;
    expect(renewal.closureCodes).toEqual(expect.arrayContaining(["042"]));
    expect(playbookPersonaSteps(renewal)).toHaveLength(6);
    const snap = ALERT_PLAYBOOKS.snap_gross_200_fpl!;
    expect(snap.closureCodes).toEqual(expect.arrayContaining(["474"]));
    const email = playbookEmailParagraphs(renewal).join("\n");
    expect(email).toMatch(/Threatened program/);
    expect(email).toMatch(/042/);
    expect(email).toContain(APPEAL_AND_CONTINUE.slice(0, 40));
  });
});
