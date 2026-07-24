import type { ApplicationDoc } from "@/lib/db/models/Application";
import type { ApplicationDocumentDoc, ApplicationDocType } from "@/lib/db/models/ApplicationDocument";
import { APPLICATION_DOC_LABELS } from "@/lib/db/models/ApplicationDocument";

/* Plain-object shapes for the UI (server components + API JSON). Never includes
 * file bytes; the status token is included only when serializing for the
 * applicant / admin, not the public status page. */

export type SerializedApplicationDocument = {
  id: string;
  docType: ApplicationDocType;
  label: string;
  filename: string;
  sizeBytes: number;
  reviewStatus: string;
  createdAt: string;
};

export type SerializedApplication = {
  id: string;
  userId: string;
  accountType: string;
  status: string;
  actingFor: { personName: string; relationship: string };
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewNote: string;
  timeline: { type: string; at: string; note: string }[];
  documents: SerializedApplicationDocument[];
  createdAt: string;
};

export function serializeApplicationDocument(
  doc: Pick<
    ApplicationDocumentDoc,
    "_id" | "docType" | "filename" | "sizeBytes" | "reviewStatus" | "createdAt"
  >,
): SerializedApplicationDocument {
  return {
    id: String(doc._id),
    docType: doc.docType as ApplicationDocType,
    label: APPLICATION_DOC_LABELS[doc.docType as ApplicationDocType] ?? doc.docType,
    filename: doc.filename,
    sizeBytes: doc.sizeBytes,
    reviewStatus: doc.reviewStatus,
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

export function serializeApplication(
  app: ApplicationDoc,
  docs: ApplicationDocumentDoc[],
): SerializedApplication {
  return {
    id: String(app._id),
    userId: String(app.userId),
    accountType: app.accountType,
    status: app.status,
    actingFor: {
      personName: app.actingFor?.personName ?? "",
      relationship: app.actingFor?.relationship ?? "other",
    },
    submittedAt: app.submittedAt ? new Date(app.submittedAt).toISOString() : null,
    reviewedAt: app.reviewedAt ? new Date(app.reviewedAt).toISOString() : null,
    reviewNote: app.reviewNote ?? "",
    timeline: (app.timeline ?? []).map((t) => ({
      type: t.type,
      at: new Date(t.at).toISOString(),
      note: t.note ?? "",
    })),
    documents: docs.map(serializeApplicationDocument),
    createdAt: new Date(app.createdAt).toISOString(),
  };
}
