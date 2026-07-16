/**
 * A dependency-free RFC 4180 CSV parser. Handles quoted fields, escaped quotes
 * (`""`), embedded commas/newlines, a UTF-8 BOM, and both `\n` and `\r\n` line
 * endings. Bank exports are small, so this parses the whole string in memory.
 */

export type ParsedCsv = {
  headers: string[];
  /** Data rows, each already aligned to `headers.length` (padded/truncated). */
  rows: string[][];
  /** The raw text of each data row, kept for audit (index-aligned with rows). */
  rawLines: string[];
};

/** Strip a leading UTF-8 BOM if present. */
function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

/**
 * Tokenize CSV text into an array of records (each a string[] of fields).
 * A record's raw source span is returned alongside for audit.
 */
function tokenize(text: string): { fields: string[]; raw: string }[] {
  const records: { fields: string[]; raw: string }[] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;
  let rawStart = 0;
  let i = 0;

  const pushField = () => {
    record.push(field);
    field = "";
  };
  const pushRecord = (endIndex: number) => {
    pushField();
    records.push({ fields: record, raw: text.slice(rawStart, endIndex) });
    record = [];
    rawStart = endIndex + 1;
  };

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      pushField();
      i++;
      continue;
    }
    if (ch === "\r") {
      // Handle \r\n as one terminator; a lone \r also ends the record.
      if (text[i + 1] === "\n") {
        pushRecord(i);
        i += 2;
        continue;
      }
      pushRecord(i);
      i++;
      continue;
    }
    if (ch === "\n") {
      pushRecord(i);
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  // Flush trailing field/record if the file didn't end in a newline.
  if (field.length > 0 || record.length > 0) {
    pushField();
    records.push({ fields: record, raw: text.slice(rawStart) });
  }
  return records;
}

export function parseCsv(input: string): ParsedCsv {
  const text = stripBom(input);
  const records = tokenize(text).filter(
    // Drop fully-blank lines (a single empty field with no other content).
    (r) => !(r.fields.length === 1 && r.fields[0].trim() === ""),
  );
  if (records.length === 0) {
    return { headers: [], rows: [], rawLines: [] };
  }
  const headers = records[0].fields.map((h) => h.trim());
  const width = headers.length;
  const rows: string[][] = [];
  const rawLines: string[] = [];
  for (let r = 1; r < records.length; r++) {
    const cells = records[r].fields.slice(0, width);
    while (cells.length < width) cells.push("");
    rows.push(cells);
    rawLines.push(records[r].raw);
  }
  return { headers, rows, rawLines };
}
