import {
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFHexString,
  PDFName,
  PDFRadioGroup,
  PDFString,
  PDFTextField,
  type PDFField,
} from "pdf-lib";
import type { FillableFormDef, FormFieldDef } from "@/lib/forms/types";
import { displayValue } from "@/lib/forms/format";

/* ---------------------------------------------------------------------------
 * Fetches the official agency PDF and auto-fills its AcroForm fields from the
 * user's in-app answers. Fields are matched by keyword against each official
 * field's internal name + tooltip (the human-readable label SSA/VA set for
 * accessibility), so the mapping survives the cryptic field names these forms
 * use. Best-effort: only fields we can confidently match are filled; the user
 * reviews and completes the rest on the official PDF before filing.
 * ------------------------------------------------------------------------- */

/** Thrown when the official PDF can't be fetched or auto-filled — the caller
 *  falls back to the self-contained MyBenefitsPA summary PDF. */
export class OfficialPdfUnavailable extends Error {}

const FETCH_TIMEOUT_MS = 12_000;

async function fetchOfficialPdf(url: string): Promise<ArrayBuffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "MyBenefitsPA/1.0 (+https://mybenefitspa.com)" },
      // Cache the blank official PDF for a day — it rarely changes.
      next: { revalidate: 86_400 },
    });
    if (!res.ok) throw new OfficialPdfUnavailable(`upstream ${res.status}`);
    const buf = await res.arrayBuffer();
    const head = new Uint8Array(buf.slice(0, 5));
    if (String.fromCharCode(...head) !== "%PDF-") {
      throw new OfficialPdfUnavailable("not a PDF");
    }
    return buf;
  } catch (e) {
    if (e instanceof OfficialPdfUnavailable) throw e;
    throw new OfficialPdfUnavailable(e instanceof Error ? e.message : "fetch failed");
  } finally {
    clearTimeout(timer);
  }
}

/** Read a field's tooltip (/TU), which holds the human-readable label. */
function tooltipOf(field: PDFField): string {
  try {
    const tu = field.acroField.dict.lookup(PDFName.of("TU"));
    if (tu instanceof PDFString || tu instanceof PDFHexString) return tu.decodeText();
  } catch {
    /* ignore */
  }
  return "";
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function findFieldDef(form: FillableFormDef, name: string): FormFieldDef | null {
  for (const section of form.sections) {
    for (const field of section.fields) {
      if (field.name === name) return field;
    }
  }
  return null;
}

export type OfficialFillResult = {
  bytes: Uint8Array;
  /** How many official fields we filled, and how many were available. */
  filled: number;
  totalFields: number;
};

export async function fillOfficialPdf(
  form: FillableFormDef,
  values: Record<string, string>,
): Promise<OfficialFillResult> {
  if (!form.officialFill) {
    throw new OfficialPdfUnavailable("no official-fill mapping for this form");
  }

  const buf = await fetchOfficialPdf(form.officialUrl);
  let pdf: PDFDocument;
  try {
    pdf = await PDFDocument.load(buf, { ignoreEncryption: true });
  } catch {
    throw new OfficialPdfUnavailable("could not parse PDF");
  }

  const acro = pdf.getForm();
  const fields = acro.getFields();
  if (fields.length === 0) {
    throw new OfficialPdfUnavailable("PDF has no fillable fields");
  }

  // Precompute a searchable haystack (name + tooltip) per official field.
  const indexed = fields.map((field) => ({
    field,
    used: false,
    hay: norm(`${field.getName()} ${tooltipOf(field)}`),
  }));

  let filled = 0;
  for (const [fieldName, keywords] of Object.entries(form.officialFill.matchers)) {
    const raw = (values[fieldName] ?? "").trim();
    if (!raw) continue;

    // Pick the unused official field with the strongest keyword overlap.
    let best: (typeof indexed)[number] | null = null;
    let bestScore = 0;
    for (const entry of indexed) {
      if (entry.used) continue;
      let score = 0;
      for (const kw of keywords) {
        const k = norm(kw);
        if (k && entry.hay.includes(k)) score = Math.max(score, k.length);
      }
      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    }
    if (!best || bestScore === 0) continue;

    const def = findFieldDef(form, fieldName);
    const text = def ? displayValue(def, raw) : raw;
    try {
      const f = best.field;
      if (f instanceof PDFTextField) {
        f.setText(text);
        best.used = true;
        filled += 1;
      } else if (f instanceof PDFCheckBox) {
        if (raw === "true" || raw === "yes") f.check();
        else f.uncheck();
        best.used = true;
        filled += 1;
      } else if (f instanceof PDFDropdown || f instanceof PDFRadioGroup) {
        try {
          f.select(text);
          best.used = true;
          filled += 1;
        } catch {
          /* option not present — skip */
        }
      }
    } catch {
      /* a single uncooperative field never fails the whole fill */
    }
  }

  if (filled === 0) {
    throw new OfficialPdfUnavailable("no fields could be matched");
  }

  try {
    acro.updateFieldAppearances();
  } catch {
    /* appearances are regenerated on setText anyway */
  }

  const bytes = await pdf.save({ updateFieldAppearances: false });
  return { bytes, filled, totalFields: fields.length };
}
