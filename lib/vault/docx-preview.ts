import { inflateRawSync } from "zlib";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function isDocxFile(filename: string, mimeType: string): boolean {
  return filename.toLowerCase().endsWith(".docx") || mimeType === DOCX_MIME;
}

/** First plain-text lines of a .docx, for the vault card preview. */
export function docxPlainText(buf: Buffer, maxChars = 420): string {
  const xml = readZipEntry(buf, "word/document.xml");
  if (!xml) return "";
  const text = xml
    .toString("utf8")
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<w:br\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars).trimEnd()}…`;
}

function readZipEntry(buf: Buffer, wanted: string): Buffer | null {
  const sig = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
  let offset = 0;
  while (offset + 30 <= buf.length) {
    if (buf.readUInt32LE(offset) !== 0x04034b50) {
      const next = buf.indexOf(sig, offset + 1);
      if (next < 0) return null;
      offset = next;
      continue;
    }
    const flags = buf.readUInt16LE(offset + 6);
    const method = buf.readUInt16LE(offset + 8);
    const compSize = buf.readUInt32LE(offset + 18);
    const nameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const entryName = buf.toString("utf8", nameStart, nameStart + nameLen);
    const dataStart = nameStart + nameLen + extraLen;
    if (compSize === 0 && flags & 0x8) {
      const next = buf.indexOf(sig, dataStart);
      if (next < 0) return null;
      offset = next;
      continue;
    }
    const dataEnd = dataStart + compSize;
    if (dataEnd > buf.length) return null;
    if (entryName === wanted) {
      const data = buf.subarray(dataStart, dataEnd);
      if (method === 0) return Buffer.from(data);
      if (method === 8) return inflateRawSync(data);
      return null;
    }
    offset = dataEnd;
  }
  return null;
}
