import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { FillableFormDef } from "@/lib/forms/types";
import { displayValue } from "@/lib/forms/format";

/* ---------------------------------------------------------------------------
 * Renders a fillable form + the user's values into a clean, printable PDF.
 * Network-free (no official PDF is fetched) — this is a self-contained summary
 * document the user prints or attaches alongside the official agency form.
 * ------------------------------------------------------------------------- */

const NAVY = rgb(0.06, 0.16, 0.3);
const TEXT = rgb(0.09, 0.14, 0.23);
const MUTED = rgb(0.4, 0.45, 0.53);
const RULE = rgb(0.89, 0.91, 0.94);

const PAGE_W = 612; // US Letter
const PAGE_H = 792;
const MARGIN = 54;
const CONTENT_W = PAGE_W - MARGIN * 2;

/** Greedy word-wrap to a max width at a given font size. */
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines;
}

export async function generateFormPdf(
  form: FillableFormDef,
  values: Record<string, string>,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page: PDFPage = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN + 40) {
      page = pdf.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  };

  const drawWrapped = (
    text: string,
    f: PDFFont,
    size: number,
    color = TEXT,
    lineGap = 4,
    indent = 0,
  ) => {
    const lines = wrapText(text, f, size, CONTENT_W - indent);
    for (const line of lines) {
      ensureSpace(size + lineGap);
      page.drawText(line, { x: MARGIN + indent, y: y - size, size, font: f, color });
      y -= size + lineGap;
    }
  };

  // ---------- Header ----------
  page.drawText("MyBenefitsPA", { x: MARGIN, y: y - 12, size: 12, font: bold, color: NAVY });
  y -= 24;
  drawWrapped(form.title, bold, 18, NAVY, 5);
  y -= 2;
  drawWrapped(`${form.agency}${form.helper ? " · Helper worksheet" : ""}`, font, 10, MUTED, 4);
  y -= 10;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: RULE });
  y -= 22;

  // ---------- Sections ----------
  for (const section of form.sections) {
    ensureSpace(40);
    drawWrapped(section.title.toUpperCase(), bold, 11, NAVY, 6);
    if (section.description) {
      drawWrapped(section.description, font, 9, MUTED, 4);
      y -= 2;
    }
    for (const field of section.fields) {
      const val = displayValue(field, values[field.name] ?? "");
      ensureSpace(30);
      drawWrapped(field.label, bold, 9.5, TEXT, 3);
      drawWrapped(val, font, 11, val === "—" ? MUTED : TEXT, 4, 8);
      y -= 8;
    }
    y -= 8;
  }

  // ---------- Footer / disclaimer ----------
  ensureSpace(60);
  y -= 6;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: RULE });
  y -= 16;
  drawWrapped(`Official form to file: ${form.officialLabel} — ${form.officialUrl}`, font, 8.5, MUTED, 4);
  y -= 4;
  drawWrapped(form.disclaimer, font, 8, MUTED, 3);

  return pdf.save();
}

/** A filesystem-safe filename for the generated document. */
export function pdfFilename(form: FillableFormDef): string {
  const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `mybenefitspa-${slug}.pdf`;
}
