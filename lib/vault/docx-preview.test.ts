import { deflateRawSync } from "zlib";
import { describe, expect, it } from "vitest";
import { docxPlainText, isDocxFile } from "./docx-preview";

function zipEntry(name: string, data: Buffer, method: 0 | 8): Buffer {
  const stored = method === 8 ? deflateRawSync(data) : data;
  const nameBuf = Buffer.from(name);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(method, 8);
  header.writeUInt32LE(stored.length, 18);
  header.writeUInt32LE(data.length, 22);
  header.writeUInt16LE(nameBuf.length, 26);
  return Buffer.concat([header, nameBuf, stored]);
}

describe("docx preview", () => {
  it("recognizes docx by name or mime", () => {
    expect(isDocxFile("notice.DOCX", "")).toBe(true);
    expect(
      isDocxFile("notice", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    ).toBe(true);
    expect(isDocxFile("scan.pdf", "application/pdf")).toBe(false);
  });

  it("reads paragraph text out of a deflated document.xml", () => {
    const xml = Buffer.from(
      `<w:document><w:p><w:r><w:t>Renewal notice</w:t></w:r></w:p><w:p><w:r><w:t>Due Nov 4.</w:t></w:r></w:p></w:document>`,
    );
    const buf = Buffer.concat([
      zipEntry("word/document.xml", xml, 8),
      zipEntry("[Content_Types].xml", Buffer.from("<Types/>"), 0),
    ]);
    expect(docxPlainText(buf)).toBe("Renewal notice\nDue Nov 4.");
  });
});
