import mongoose from "mongoose";
import Transaction from "@/lib/db/models/Transaction";
import RecurringStream from "@/lib/db/models/RecurringStream";
import Alert from "@/lib/db/models/Alert";
import Threshold from "@/lib/db/models/Threshold";
import ActivityLog from "@/lib/db/models/ActivityLog";
import { renderReportPdf } from "@/lib/exports/pdf";
import { buildZip } from "@/lib/exports/zip";

export type Dataset =
  | "transactions"
  | "recurring"
  | "alerts"
  | "thresholds"
  | "activity"
  | "bundle";

export type Format = "csv" | "pdf" | "json" | "zip";

type Row = Record<string, unknown>;

type Collected = {
  dataset: Dataset;
  rows: Row[];
  headers: string[];
};

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s: string;
  if (v instanceof Date) s = v.toISOString();
  else if (typeof v === "object") s = JSON.stringify(v);
  else s = String(v);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowsToCsv(headers: string[], rows: Row[]): string {
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => csvCell(r[h])).join(","));
  }
  return lines.join("\n");
}

async function collectTransactions(
  beneficiaryId: mongoose.Types.ObjectId,
  fromDate: string,
  toDate: string,
): Promise<Collected> {
  const q: Record<string, unknown> = { beneficiaryId };
  if (fromDate || toDate) {
    const r: Record<string, string> = {};
    if (fromDate) r.$gte = fromDate;
    if (toDate) r.$lte = toDate;
    q.date = r;
  }
  const docs = await Transaction.find(q).sort({ date: -1 }).lean();
  const rows = docs.map((t) => ({
    date: t.date,
    postedDate: t.postedDate,
    amountCents: t.amountCents,
    amountUsd: (t.amountCents / 100).toFixed(2),
    name: t.name,
    merchantName: t.merchantName,
    category: t.category,
    userCategory: t.userCategory,
    pending: t.pending,
    currency: t.currency,
    plaidTransactionId: t.plaidTransactionId,
  }));
  return {
    dataset: "transactions",
    headers: [
      "date",
      "postedDate",
      "amountCents",
      "amountUsd",
      "name",
      "merchantName",
      "category",
      "userCategory",
      "pending",
      "currency",
      "plaidTransactionId",
    ],
    rows,
  };
}

async function collectRecurring(beneficiaryId: mongoose.Types.ObjectId): Promise<Collected> {
  const docs = await RecurringStream.find({ beneficiaryId }).lean();
  const rows = docs.map((r) => ({
    type: r.type,
    description: r.description,
    merchantName: r.merchantName,
    frequency: r.frequency,
    status: r.status,
    userCategory: r.userCategory,
    isConfirmed: r.isConfirmed,
    firstDate: r.firstDate,
    lastDate: r.lastDate,
    predictedNextDate: r.predictedNextDate,
    averageAmountCents: r.averageAmountCents,
    lastAmountCents: r.lastAmountCents,
  }));
  return {
    dataset: "recurring",
    headers: [
      "type",
      "description",
      "merchantName",
      "frequency",
      "status",
      "userCategory",
      "isConfirmed",
      "firstDate",
      "lastDate",
      "predictedNextDate",
      "averageAmountCents",
      "lastAmountCents",
    ],
    rows,
  };
}

async function collectAlerts(
  beneficiaryId: mongoose.Types.ObjectId,
  fromDate: string,
  toDate: string,
): Promise<Collected> {
  const q: Record<string, unknown> = { beneficiaryId };
  if (fromDate || toDate) {
    const r: Record<string, Date> = {};
    if (fromDate) r.$gte = new Date(fromDate);
    if (toDate) r.$lte = new Date(`${toDate}T23:59:59.999Z`);
    q.createdAt = r;
  }
  const docs = await Alert.find(q).sort({ createdAt: -1 }).lean();
  const rows = docs.map((a) => ({
    createdAt: a.createdAt,
    level: a.level,
    trigger: a.trigger,
    status: a.status,
    message: a.message,
    thresholdId: a.thresholdId ? a.thresholdId.toString() : "",
    dataSnapshot: a.dataSnapshot,
  }));
  return {
    dataset: "alerts",
    headers: ["createdAt", "level", "trigger", "status", "message", "thresholdId", "dataSnapshot"],
    rows,
  };
}

async function collectThresholds(beneficiaryId: mongoose.Types.ObjectId): Promise<Collected> {
  const docs = await Threshold.find({
    $or: [{ beneficiaryId }, { scope: "system" }],
  }).lean();
  const rows = docs.map((t) => ({
    scope: t.scope,
    program: t.program,
    state: t.state,
    label: t.label,
    thresholdType: t.thresholdType,
    limitCents: t.limitCents,
    limitUsd: (t.limitCents / 100).toFixed(2),
    comparison: t.comparison,
    warnAtPercent: t.warnAtPercent,
    effectiveFrom: t.effectiveFrom,
    effectiveTo: t.effectiveTo,
  }));
  return {
    dataset: "thresholds",
    headers: [
      "scope",
      "program",
      "state",
      "label",
      "thresholdType",
      "limitCents",
      "limitUsd",
      "comparison",
      "warnAtPercent",
      "effectiveFrom",
      "effectiveTo",
    ],
    rows,
  };
}

async function collectActivity(
  userId: string,
  fromDate: string,
  toDate: string,
): Promise<Collected> {
  const q: Record<string, unknown> = { userId };
  if (fromDate || toDate) {
    const r: Record<string, Date> = {};
    if (fromDate) r.$gte = new Date(fromDate);
    if (toDate) r.$lte = new Date(`${toDate}T23:59:59.999Z`);
    q.createdAt = r;
  }
  const docs = await ActivityLog.find(q).sort({ createdAt: -1 }).limit(5000).lean();
  const rows = docs.map((r) => ({
    createdAt: r.createdAt,
    category: r.category,
    action: r.action,
    severity: r.severity,
    resourceType: r.resourceType,
    resourceId: r.resourceId,
    details: r.details,
  }));
  return {
    dataset: "activity",
    headers: [
      "createdAt",
      "category",
      "action",
      "severity",
      "resourceType",
      "resourceId",
      "details",
    ],
    rows,
  };
}

async function collectOne(
  dataset: Exclude<Dataset, "bundle">,
  userId: string,
  beneficiaryId: mongoose.Types.ObjectId,
  fromDate: string,
  toDate: string,
): Promise<Collected> {
  switch (dataset) {
    case "transactions":
      return collectTransactions(beneficiaryId, fromDate, toDate);
    case "recurring":
      return collectRecurring(beneficiaryId);
    case "alerts":
      return collectAlerts(beneficiaryId, fromDate, toDate);
    case "thresholds":
      return collectThresholds(beneficiaryId);
    case "activity":
      return collectActivity(userId, fromDate, toDate);
  }
}

export type GeneratedExport = {
  buffer: Buffer;
  mimeType: string;
  filename: string;
  rowCount: number;
};

export async function generateExport(opts: {
  userId: string;
  beneficiaryId: string;
  format: Format;
  dataset: Dataset;
  fromDate: string;
  toDate: string;
}): Promise<GeneratedExport> {
  const benObjectId = new mongoose.Types.ObjectId(opts.beneficiaryId);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const base = `${opts.dataset}-${stamp}`;

  const collected: Collected[] = [];
  if (opts.dataset === "bundle") {
    for (const d of ["transactions", "recurring", "alerts", "thresholds", "activity"] as const) {
      collected.push(await collectOne(d, opts.userId, benObjectId, opts.fromDate, opts.toDate));
    }
  } else {
    collected.push(
      await collectOne(opts.dataset, opts.userId, benObjectId, opts.fromDate, opts.toDate),
    );
  }

  const rowCount = collected.reduce((n, c) => n + c.rows.length, 0);
  const rangeLabel =
    opts.fromDate || opts.toDate ? `Range ${opts.fromDate || "…"} → ${opts.toDate || "…"}` : "All dates";

  if (opts.format === "pdf") {
    const sections = collected.map((c) => ({
      heading: `${c.dataset} — ${c.rows.length} row(s)`,
      lines: c.rows.length ? rowsToCsv(c.headers, c.rows).split("\n") : ["(no rows)"],
    }));
    const buffer = await renderReportPdf(
      "CliffSense export",
      `${opts.dataset} · generated ${new Date().toISOString()} · ${rangeLabel}`,
      sections,
    );
    return { buffer, mimeType: "application/pdf", filename: `${base}.pdf`, rowCount };
  }

  if (opts.format === "zip") {
    const files: Record<string, string> = {
      "manifest.txt": [
        "CliffSense export bundle",
        `Generated: ${new Date().toISOString()}`,
        `Dataset: ${opts.dataset}`,
        rangeLabel,
        "",
        ...collected.map((c) => `${c.dataset}: ${c.rows.length} row(s)`),
        "",
        "Informational only. CliffSense does not determine eligibility.",
      ].join("\n"),
    };
    for (const c of collected) {
      files[`${c.dataset}.csv`] = rowsToCsv(c.headers, c.rows);
      files[`${c.dataset}.json`] = JSON.stringify(c.rows, null, 2);
    }
    return { buffer: buildZip(files), mimeType: "application/zip", filename: `${base}.zip`, rowCount };
  }

  let text: string;
  let mimeType: string;
  let filename: string;
  if (opts.format === "json") {
    const payload =
      opts.dataset === "bundle"
        ? Object.fromEntries(collected.map((c) => [c.dataset, c.rows]))
        : collected[0].rows;
    text = JSON.stringify(payload, null, 2);
    mimeType = "application/json";
    filename = `${base}.json`;
  } else {
    // csv
    if (opts.dataset === "bundle") {
      // concatenate each dataset as labeled sections
      text = collected
        .map((c) => `# ${c.dataset}\n${rowsToCsv(c.headers, c.rows)}`)
        .join("\n\n");
    } else {
      text = rowsToCsv(collected[0].headers, collected[0].rows);
    }
    mimeType = "text/csv";
    filename = `${base}.csv`;
  }

  return {
    buffer: Buffer.from(text, "utf-8"),
    mimeType,
    filename,
    rowCount,
  };
}
