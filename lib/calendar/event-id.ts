/**
 * Stable, URL-safe ids for calendar events.
 * - User deadlines: `usr_<mongoId>`
 * - Generated schedule events: `g_<base64url JSON>`
 *
 * Encoding is browser-safe (no Node Buffer) so client components can build hrefs.
 */

export type CalendarEventRef =
  | { source: "user"; deadlineId: string }
  | { source: "generated"; program: string; date: string; title: string };

function bytesToBinary(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
  return binary;
}

function binaryToBytes(binary: string): Uint8Array {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function encodeUtf8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function toBase64Url(json: string): string {
  const b64 = btoa(bytesToBinary(encodeUtf8(json)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  return decodeUtf8(binaryToBytes(atob(b64 + pad)));
}

export function encodeCalendarEventId(ref: CalendarEventRef): string {
  if (ref.source === "user") return `usr_${ref.deadlineId}`;
  return `g_${toBase64Url(JSON.stringify({ p: ref.program, d: ref.date, t: ref.title }))}`;
}

export function decodeCalendarEventId(raw: string): CalendarEventRef | null {
  const id = decodeURIComponent(raw);
  if (id.startsWith("usr_")) {
    const deadlineId = id.slice(4);
    if (!deadlineId) return null;
    return { source: "user", deadlineId };
  }
  if (id.startsWith("g_")) {
    try {
      const parsed = JSON.parse(fromBase64Url(id.slice(2))) as {
        p?: string;
        d?: string;
        t?: string;
      };
      if (!parsed.p || !parsed.d || !parsed.t) return null;
      return { source: "generated", program: parsed.p, date: parsed.d, title: parsed.t };
    } catch {
      return null;
    }
  }
  // Legacy agenda ids: gen-PROGRAM-title-YYYY-MM-DD
  if (id.startsWith("gen-")) {
    const rest = id.slice(4);
    const dateMatch = rest.match(/-(\d{4}-\d{2}-\d{2})$/);
    if (!dateMatch) return null;
    const date = dateMatch[1]!;
    const beforeDate = rest.slice(0, -(date.length + 1));
    const dash = beforeDate.indexOf("-");
    if (dash < 0) return null;
    return {
      source: "generated",
      program: beforeDate.slice(0, dash),
      title: beforeDate.slice(dash + 1),
      date,
    };
  }
  if (/^[a-f0-9]{24}$/i.test(id)) {
    return { source: "user", deadlineId: id };
  }
  return null;
}

export function calendarEventHref(ref: CalendarEventRef): string {
  return `/calendar/event/${encodeURIComponent(encodeCalendarEventId(ref))}`;
}
