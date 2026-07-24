import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db/mongodb";
import Application from "@/lib/db/models/Application";
import ApplicationDocument, {
  APPLICATION_DOC_TYPES,
  type ApplicationDocType,
} from "@/lib/db/models/ApplicationDocument";
import { serializeApplicationDocument } from "@/lib/applications/serialize";
import { sendDocumentReceivedEmail } from "@/lib/applications/emails";
import { logActivity } from "@/lib/activity/log-activity";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set<string>(APPLICATION_DOC_TYPES);

/** Applicant uploads an authorization document (Rep Payee letter or POA). */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }
  const docTypeRaw = form.get("docType");
  const file = form.get("file");

  if (typeof docTypeRaw !== "string" || !ALLOWED.has(docTypeRaw)) {
    return NextResponse.json({ error: "Valid docType required" }, { status: 400 });
  }
  const docType = docTypeRaw as ApplicationDocType;
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File exceeds ${MAX_BYTES / 1024 / 1024}MB limit` },
      { status: 413 },
    );
  }

  await connectDB();
  const app = await Application.findOne({ userId: session.user.id });
  if (!app) {
    return NextResponse.json({ error: "No application for this account" }, { status: 404 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const doc = await ApplicationDocument.create({
    applicationId: app._id,
    userId: session.user.id,
    docType,
    filename: file.name || "upload",
    mimeType: file.type || "application/octet-stream",
    sizeBytes: buf.length,
    content: buf,
    reviewStatus: "pending",
  });

  app.timeline.push({
    type: "document_uploaded",
    at: new Date(),
    note: `Uploaded ${doc.filename}`,
  });
  await app.save();

  await logActivity({
    userId: session.user.id,
    category: "auth",
    action: "application.document_uploaded",
    resourceType: "application_document",
    resourceId: doc._id.toString(),
    details: { docType, sizeBytes: buf.length },
  });

  try {
    await sendDocumentReceivedEmail({ to: session.user.email ?? "", statusToken: app.statusToken });
  } catch (e) {
    console.warn("document received email failed", e);
  }

  return NextResponse.json({ document: serializeApplicationDocument(doc) });
}
