import type { EvidenceRequest, TenPartAlert } from "@/lib/alerts/ten-part";

export type CaseTask = {
  key: string;
  title: string;
  dueDate: string | null;
  requiresProof: boolean;
  status: "open" | "done";
};

export type CaseSubmission = {
  method: string;
  submittedAt: string;
  documentId: string;
  note: string;
};

export type CaseAcknowledgment = {
  recordedAt: string;
  note: string;
};

export type CaseFollowUp = {
  dueDate: string | null;
  reason: string;
  status: "open" | "done";
};

export type CaseStatus = "open" | "waiting_on_agency" | "closed";

export type CaseWorkflow = {
  status: CaseStatus;
  parts: TenPartAlert;
  evidence: EvidenceRequest[];
  tasks: CaseTask[];
  submission: CaseSubmission | null;
  acknowledgment: CaseAcknowledgment | null;
  followUp: CaseFollowUp | null;
};

export type CaseAction =
  | { type: "link_evidence"; slotKey: string; documentId: string | null }
  | { type: "record_submission"; method: string; submittedAt: string; documentId: string; note: string }
  | { type: "record_acknowledgment"; note: string; recordedAt: string }
  | { type: "set_appeal"; appealDeadline: string | null; continuedBenefitsDeadline: string | null };

export type CaseActionResult = { ok: true; state: CaseWorkflow } | { ok: false; error: string };

function plusDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function clone(state: CaseWorkflow): CaseWorkflow {
  return structuredClone(state);
}

function evidenceReady(state: CaseWorkflow): boolean {
  return state.evidence.length === 0 || state.evidence.every((slot) => Boolean(slot.documentId));
}

function syncTaskStatus(state: CaseWorkflow): void {
  const gather = state.tasks.find((task) => task.key === "gather");
  if (gather) gather.status = evidenceReady(state) ? "done" : "open";
  const report = state.tasks.find((task) => task.key === "report");
  if (report) report.status = state.submission?.documentId ? "done" : "open";
}

function refreshStatus(state: CaseWorkflow): void {
  const tasksDone = state.tasks.every((task) => task.status === "done");
  if (state.submission && !state.acknowledgment) {
    state.status = "waiting_on_agency";
    return;
  }
  state.status = tasksDone && state.acknowledgment ? "closed" : "open";
}

function syncParts(state: CaseWorkflow): void {
  state.parts = {
    ...state.parts,
    evidence: state.evidence.map((slot) => ({ ...slot })),
    followUp: {
      ownerRole: "beneficiary_or_monitor",
      nextDate: state.followUp?.dueDate ?? null,
      note:
        state.followUp?.reason ??
        "A follow-up opens after a submission is recorded and the agency has not confirmed receipt.",
    },
  };
}

export function initialCaseWorkflow(parts: TenPartAlert): CaseWorkflow {
  const due = parts.actionDate.iso;
  return {
    status: "open",
    parts,
    evidence: parts.evidence.map((slot) => ({ ...slot, documentId: null })),
    tasks: [
      {
        key: "gather",
        title: "Link each requested document from the Vault",
        dueDate: due,
        requiresProof: true,
        status: "open",
      },
      {
        key: "report",
        title: "Record the report and attach the receipt",
        dueDate: due,
        requiresProof: true,
        status: "open",
      },
    ],
    submission: null,
    acknowledgment: null,
    followUp: null,
  };
}

function dateOrNull(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  return `${trimmed}T23:59:59.999Z`;
}

export function applyCaseAction(state: CaseWorkflow, action: CaseAction): CaseActionResult {
  const next = clone(state);

  if (action.type === "link_evidence") {
    const slot = next.evidence.find((item) => item.key === action.slotKey);
    if (!slot) return { ok: false, error: "That document request is not on this case." };
    slot.documentId = action.documentId;
    syncTaskStatus(next);
    syncParts(next);
    refreshStatus(next);
    return { ok: true, state: next };
  }

  if (action.type === "record_submission") {
    const method = action.method.trim();
    const documentId = action.documentId.trim();
    if (!method) return { ok: false, error: "Say how this was submitted." };
    if (!action.submittedAt) return { ok: false, error: "Enter the date it was submitted." };
    if (!documentId) {
      return { ok: false, error: "Attach the receipt or confirmation. A checkbox does not close this task." };
    }
    const submittedAt = action.submittedAt.includes("T")
      ? action.submittedAt
      : `${action.submittedAt}T12:00:00.000Z`;
    next.submission = {
      method,
      submittedAt,
      documentId,
      note: action.note.trim(),
    };
    if (!next.acknowledgment) {
      next.followUp = {
        dueDate: plusDays(submittedAt, 14),
        reason: "A submission was recorded and agency acknowledgment is not confirmed.",
        status: "open",
      };
    }
    syncTaskStatus(next);
    syncParts(next);
    refreshStatus(next);
    return { ok: true, state: next };
  }

  if (action.type === "record_acknowledgment") {
    if (!next.submission) {
      return { ok: false, error: "Record the submission before recording an agency acknowledgment." };
    }
    next.acknowledgment = {
      recordedAt: action.recordedAt,
      note: action.note.trim(),
    };
    if (next.followUp) next.followUp.status = "done";
    syncTaskStatus(next);
    syncParts(next);
    refreshStatus(next);
    return { ok: true, state: next };
  }

  const appealDeadline = dateOrNull(action.appealDeadline);
  const continuedBenefitsDeadline = dateOrNull(action.continuedBenefitsDeadline);
  if (action.appealDeadline?.trim() && !appealDeadline) {
    return { ok: false, error: "Appeal date must be YYYY-MM-DD from the notice." };
  }
  if (action.continuedBenefitsDeadline?.trim() && !continuedBenefitsDeadline) {
    return { ok: false, error: "Continued-benefits date must be YYYY-MM-DD from the notice." };
  }
  if (!appealDeadline && !continuedBenefitsDeadline) {
    return { ok: false, error: "Enter an appeal date or a continued-benefits date from the notice." };
  }
  next.parts = {
    ...next.parts,
    cureAndAppeal: {
      ...next.parts.cureAndAppeal,
      appealDeadline,
      continuedBenefitsDeadline,
      source: "notice",
    },
  };
  return { ok: true, state: next };
}
