import { describe, expect, it } from "vitest";
import {
  calendarEventHref,
  decodeCalendarEventId,
  encodeCalendarEventId,
} from "./event-id";

describe("calendar event ids", () => {
  it("round-trips generated events with apostrophes", () => {
    const ref = {
      source: "generated" as const,
      program: "SSI",
      date: "2026-08-06",
      title: "Report last month's wages",
    };
    const id = encodeCalendarEventId(ref);
    expect(id.startsWith("g_")).toBe(true);
    expect(decodeCalendarEventId(id)).toEqual(ref);
    expect(calendarEventHref(ref)).toContain("/calendar/event/");
  });

  it("encodes user deadlines", () => {
    const ref = { source: "user" as const, deadlineId: "6a6a41cc9ffbcf3af821f333" };
    expect(encodeCalendarEventId(ref)).toBe("usr_6a6a41cc9ffbcf3af821f333");
    expect(decodeCalendarEventId("usr_6a6a41cc9ffbcf3af821f333")).toEqual(ref);
  });
});
