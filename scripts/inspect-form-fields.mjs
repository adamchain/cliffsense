// Dump AcroForm field name + tooltip (/TU) for a decrypted form under public/forms.
// Usage: node scripts/inspect-form-fields.mjs ssa-827
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, PDFName, PDFString, PDFHexString } from "pdf-lib";

const id = process.argv[2];
if (!id) {
  console.error("usage: node scripts/inspect-form-fields.mjs <id>");
  process.exit(1);
}

const bytes = await readFile(path.join(process.cwd(), "public", "forms", `${id}.pdf`));
const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
const form = pdf.getForm();
const fields = form.getFields();

function tooltipOf(field) {
  try {
    const tu = field.acroField.dict.lookup(PDFName.of("TU"));
    if (tu instanceof PDFString || tu instanceof PDFHexString) return tu.decodeText();
  } catch {}
  return "";
}

console.log(`# ${id} — ${fields.length} fields`);
for (const f of fields) {
  const type = f.constructor.name.replace("PDF", "");
  console.log(`[${type}] name=${JSON.stringify(f.getName())} tip=${JSON.stringify(tooltipOf(f))}`);
}
