import type { CaseWorkflow } from "@/lib/alerts/case-workflow";
import type { TenPartAlert } from "@/lib/alerts/ten-part";

export type ContinuityCaseView = {
  id: string;
  alertId: string;
  status: CaseWorkflow["status"];
  parts: TenPartAlert;
  evidence: CaseWorkflow["evidence"];
  tasks: CaseWorkflow["tasks"];
  submission: CaseWorkflow["submission"];
  acknowledgment: CaseWorkflow["acknowledgment"];
  followUp: CaseWorkflow["followUp"];
};

function asString(value: unknown): string | null {
  if (value == null || value === "") return null;
  return String(value);
}

export function serializeContinuityCase(raw: {
  _id: unknown;
  alertId: unknown;
  status?: unknown;
  parts?: unknown;
  evidence?: unknown;
  tasks?: unknown;
  submission?: unknown;
  acknowledgment?: unknown;
  followUp?: unknown;
}): ContinuityCaseView {
  const evidence = Array.isArray(raw.evidence) ? raw.evidence : [];
  const tasks = Array.isArray(raw.tasks) ? raw.tasks : [];
  const submission = raw.submission as CaseWorkflow["submission"] | null;
  return {
    id: String(raw._id),
    alertId: String(raw.alertId),
    status: (raw.status as CaseWorkflow["status"]) ?? "open",
    parts: raw.parts as TenPartAlert,
    evidence: evidence.map((slot) => {
      const row = slot as { key?: string; label?: string; documentId?: unknown };
      return {
        key: String(row.key ?? ""),
        label: String(row.label ?? ""),
        documentId: asString(row.documentId),
      };
    }),
    tasks: tasks.map((task) => {
      const row = task as CaseWorkflow["tasks"][number];
      return {
        key: row.key,
        title: row.title,
        dueDate: row.dueDate ?? null,
        requiresProof: Boolean(row.requiresProof),
        status: row.status === "done" ? "done" : "open",
      };
    }),
    submission: submission?.documentId
      ? { ...submission, documentId: String(submission.documentId) }
      : null,
    acknowledgment: (raw.acknowledgment as CaseWorkflow["acknowledgment"]) ?? null,
    followUp: (raw.followUp as CaseWorkflow["followUp"]) ?? null,
  };
}

export function workflowFromCase(view: ContinuityCaseView): CaseWorkflow {
  return {
    status: view.status,
    parts: view.parts,
    evidence: view.evidence,
    tasks: view.tasks,
    submission: view.submission,
    acknowledgment: view.acknowledgment,
    followUp: view.followUp,
  };
}
