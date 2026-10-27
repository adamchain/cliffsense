import { describe, expect, it } from "vitest";
import { isBeneWatchAdminEmail } from "./staff-email";

describe("isBeneWatchAdminEmail", () => {
  it("accepts a bene-watch.com address", () => {
    expect(isBeneWatchAdminEmail("Ada@Bene-Watch.com")).toBe(true);
    expect(isBeneWatchAdminEmail("ada+ops@bene-watch.com")).toBe(true);
  });

  it("rejects other domains and lookalikes", () => {
    expect(isBeneWatchAdminEmail("ada@mybenefitspa.com")).toBe(false);
    expect(isBeneWatchAdminEmail("ada@bene-watch.com.evil.test")).toBe(false);
    expect(isBeneWatchAdminEmail("ada@mail.bene-watch.com")).toBe(false);
    expect(isBeneWatchAdminEmail("bene-watch.com")).toBe(false);
    expect(isBeneWatchAdminEmail("ada@bene-watch.co")).toBe(false);
  });
});
