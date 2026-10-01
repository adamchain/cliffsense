import { describe, expect, it } from "vitest";
import { ALERT_PLAYBOOKS } from "@/lib/alerts/alert-playbook";
import { ELIGIBILITY_LOSS_SCENARIOS } from "@/lib/alerts/eligibility-loss-scenarios";
import { composeTenPart, currentRuleSummary } from "@/lib/alerts/ten-part";
import { isCurrentRule, stampForPlaybook } from "@/lib/rules/stamp";

const NOW = new Date("2026-10-01T15:00:00.000Z");

describe("rule stamps", () => {
  it("treats 2026 SSI as current and projected immigrant rules as not current", () => {
    const ssi = stampForPlaybook("ssi_resources_2k", "SSI");
    expect(isCurrentRule(ssi, NOW)).toBe(true);
    expect(ssi.version).toBe("ssi-2026.1");

    const projected = stampForPlaybook("immigrant_restrictions_2026", "MedicaidMAGI");
    expect(projected.verified).toBe(false);
    expect(isCurrentRule(projected, NOW)).toBe(false);
  });

  it("stamps every scenario alert, and keeps unverified policy unverified", () => {
    for (const scenario of ELIGIBILITY_LOSS_SCENARIOS) {
      const playbook = ALERT_PLAYBOOKS[scenario.id]!;
      const parts = composeTenPart({
        playbook,
        eventSummary: scenario.risk,
        changeConfidence: "inferred",
        observedAt: NOW,
      });
      expect(parts.affectedBenefits).toHaveLength(playbook.programs.length);
      expect(parts.evidence.length).toBeGreaterThan(0);
      expect(parts.cureAndAppeal.source).toBe("none");
      expect(parts.cureAndAppeal.appealDeadline).toBeNull();
      expect(parts.whyItMatters).toMatch(/does not decide eligibility/);
    }

    const policy = composeTenPart({
      playbook: ALERT_PLAYBOOKS.immigrant_restrictions_2026!,
      eventSummary: "Notice received",
      changeConfidence: "confirmed",
      observedAt: NOW,
    });
    expect(currentRuleSummary(policy, NOW).current).toBe(false);
  });
});
