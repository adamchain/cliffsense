import { strToU8, zipSync } from "fflate";

/** Builds a ZIP archive from a map of filename → text content. */
export function buildZip(files: Record<string, string>): Buffer {
  const entries: Record<string, Uint8Array> = {};
  for (const [name, content] of Object.entries(files)) {
    entries[name] = strToU8(content);
  }
  return Buffer.from(zipSync(entries, { level: 6 }));
}
