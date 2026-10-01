import { describe, expect, it } from "vitest";
import { ALERT_PLAYBOOKS } from "@/lib/alerts/alert-playbook";
import { applyCaseAction, initialCaseWorkflow } from "@/lib/alerts/case-workflow";
import { composeTenPart } from "@/lib/alerts/ten-part";

const NOW = new Date("2026-06-15T15:00:00.000Z");

function openSsiCase() {
  const parts = composeTenPart({
    playbook: ALERT_PLAYBOOKS.ssi_resources_2k!,
    eventSummary: "Checking balance is over the resource screen.",
    changeConfidence: "inferred",
    observedAt: NOW,
  });
  return initialCaseWorkflow(parts);
}

describe("ten-part alerts", () => {
  it("marks a notice date confirmed and a bank signal inferred", () => {
    const inferred = composeTenPart({
      playbook: ALERT_PLAYBOOKS.ssdi_sga_after_twp!,
      eventSummary: "Gross wages reached the SGA screen.",
      changeConfidence: "inferred",
      observedAt: NOW,
    });
    expect(inferred.changeConfidence).toBe("inferred");
    expect(inferred.actionDate.confidence).not.toBe("confirmed");
    expect(inferred.whyItMatters).not.toMatch(/you are ineligible|automatic cessation/i);
    expect(inferred.affectedBenefits.map((benefit) => benefit.program)).toEqual(["SSDI"]);

    const confirmed = composeTenPart({
      playbook: ALERT_PLAYBOOKS.medicaid_renewal_packet!,
      eventSummary: "Renewal packet arrived.",
      changeConfidence: "confirmed",
      observedAt: NOW,
      noticeDeadline: "2026-07-01",
    });
    expect(confirmed.actionDate.confidence).toBe("confirmed");
    expect(confirmed.actionDate.iso).toBe("2026-07-01T23:59:59.999Z");
    expect(confirmed.officialChannel.note).toMatch(/COMPASS|County Assistance/i);
  });
});

describe("continuity cases", () => {
  it("refuses a submission without a receipt and opens follow-up after one is attached", () => {
    const opened = openSsiCase();
    const missing = applyCaseAction(opened, {
      type: "record_submission",
      method: "COMPASS",
      submittedAt: "2026-06-16",
      documentId: "",
      note: "",
    });
    expect(missing.ok).toBe(false);

    const recorded = applyCaseAction(opened, {
      type: "record_submission",
      method: "COMPASS",
      submittedAt: "2026-06-16",
      documentId: "receipt-1",
      note: "Confirmation 44",
    });
    expect(recorded.ok).toBe(true);
    if (!recorded.ok) return;
    expect(recorded.state.status).toBe("waiting_on_agency");
    expect(recorded.state.followUp?.status).toBe("open");
    expect(recorded.state.tasks.find((task) => task.key === "report")?.status).toBe("done");
    expect(recorded.state.tasks.find((task) => task.key === "gather")?.status).toBe("open");
  });

  it("closes the follow-up only after acknowledgment, and stores appeal dates from a notice", () => {
    const opened = openSsiCase();
    const recorded = applyCaseAction(opened, {
      type: "record_submission",
      method: "Mail",
      submittedAt: "2026-06-16",
      documentId: "receipt-1",
      note: "",
    });
    if (!recorded.ok) throw new Error("expected submission");

    const early = applyCaseAction(opened, {
      type: "record_acknowledgment",
      note: "Received",
      recordedAt: "2026-06-20T12:00:00.000Z",
    });
    expect(early.ok).toBe(false);

    const acked = applyCaseAction(recorded.state, {
      type: "record_acknowledgment",
      note: "CAO said it was received",
      recordedAt: "2026-06-20T12:00:00.000Z",
    });
    expect(acked.ok).toBe(true);
    if (!acked.ok) return;
    expect(acked.state.followUp?.status).toBe("done");
    expect(acked.state.status).not.toBe("waiting_on_agency");

    const appeal = applyCaseAction(acked.state, {
      type: "set_appeal",
      appealDeadline: "2026-07-20",
      continuedBenefitsDeadline: "2026-07-05",
    });
    expect(appeal.ok).toBe(true);
    if (!appeal.ok) return;
    expect(appeal.state.parts.cureAndAppeal.source).toBe("notice");
    expect(appeal.state.parts.cureAndAppeal.continuedBenefitsDeadline).toBe("2026-07-05T23:59:59.999Z");
  });

  it("marks documents gathered only when every request is linked", () => {
    let state = openSsiCase();
    const first = state.evidence[0];
    if (!first) throw new Error("expected evidence");
    const linked = applyCaseAction(state, {
      type: "link_evidence",
      slotKey: first.key,
      documentId: "doc-1",
    });
    expect(linked.ok).toBe(true);
    if (!linked.ok) return;
    expect(linked.state.tasks.find((task) => task.key === "gather")?.status).toBe("open");

    for (const slot of linked.state.evidence) {
      const step = applyCaseAction(linked.state, {
        type: "link_evidence",
        slotKey: slot.key,
        documentId: slot.key === first.key ? "doc-1" : `doc-${slot.key}`,
      });
      if (!step.ok) throw new Error(step.error);
      linked.state = step.state;
    }
    state = linked.state;
    expect(state.tasks.find((task) => task.key === "gather")?.status).toBe("done");
  });
});
