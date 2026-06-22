import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type PdfSection = { heading: string; lines: string[] };

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 48;
const BODY_SIZE = 8;
const BODY_LH = 11;
// Courier glyphs are ~0.6em wide; used to wrap monospaced rows to the page.
const MAX_CHARS = Math.floor((PAGE_W - MARGIN * 2) / (BODY_SIZE * 0.6));

function wrap(line: string): string[] {
  if (line.length <= MAX_CHARS) return [line];
  const out: string[] = [];
  for (let i = 0; i < line.length; i += MAX_CHARS) {
    out.push(line.slice(i, i + MAX_CHARS));
  }
  return out;
}

/**
 * Renders a paginated, monospaced report. Tabular data is drawn as CSV-style
 * rows wrapped to the page — legible for any dataset size without a layout
 * engine. Returns PDF bytes.
 */
export async function renderReportPdf(
  title: string,
  subtitle: string,
  sections: PdfSection[],
): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const mono = await doc.embedFont(StandardFonts.Courier);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const ensure = (needed: number) => {
    if (y - needed < MARGIN) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  };

  const draw = (
    text: string,
    opts: { font: typeof mono; size: number; color?: ReturnType<typeof rgb> },
  ) => {
    page.drawText(text, {
      x: MARGIN,
      y,
      size: opts.size,
      font: opts.font,
      color: opts.color ?? rgb(0.1, 0.1, 0.1),
    });
  };

  draw(title, { font: bold, size: 16 });
  y -= 20;
  if (subtitle) {
    draw(subtitle, { font: sans, size: 9, color: rgb(0.4, 0.4, 0.4) });
    y -= 16;
  }

  for (const section of sections) {
    ensure(24);
    y -= 8;
    draw(section.heading, { font: bold, size: 11 });
    y -= 14;
    for (const raw of section.lines) {
      for (const line of wrap(raw)) {
        ensure(BODY_LH);
        draw(line, { font: mono, size: BODY_SIZE });
        y -= BODY_LH;
      }
    }
  }

  ensure(28);
  y -= 10;
  draw(
    "Informational only. MyBenefitsPA does not determine eligibility — confirm with the relevant agency.",
    { font: sans, size: 8, color: rgb(0.4, 0.4, 0.4) },
  );

  return Buffer.from(await doc.save());
}
