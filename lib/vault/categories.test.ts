import { describe, expect, it } from "vitest";
import { AUTHORITY_OPTIONS } from "@/lib/onboarding/opening";
import { SCREENING_ITEMS } from "@/lib/onboarding/screening";
import {
  VAULT_FOLDERS,
  effectiveVaultSlot,
  folderIdForDocument,
  slotAttention,
  vaultCaseContext,
} from "./categories";

describe("vault folders", () => {
  it("gives every screening program a proof slot", () => {
    const keys = new Set(VAULT_FOLDERS.flatMap((folder) => folder.slots.flatMap((slot) => [...slot.when])));
    for (const item of SCREENING_ITEMS) {
      expect(keys.has(item.id), item.program).toBe(true);
    }
  });

  it("gives every authority a proof slot", () => {
    const keys = new Set(VAULT_FOLDERS.flatMap((folder) => folder.slots.flatMap((slot) => [...slot.when])));
    const slotIds = new Set(VAULT_FOLDERS.flatMap((folder) => folder.slots.map((slot) => slot.id)));
    for (const option of AUTHORITY_OPTIONS) {
      expect(keys.has(option.id) || slotIds.has(option.id), option.label).toBe(true);
    }
  });

  it("uses unique slot ids", () => {
    const ids = VAULT_FOLDERS.flatMap((folder) => folder.slots.map((slot) => slot.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("files older uploads into the matching checklist row", () => {
    expect(folderIdForDocument("award_letter", "")).toBe("social_security");
    expect(effectiveVaultSlot("award_letter", "")).toBe("award_notice");
    expect(folderIdForDocument("correspondence", null)).toBe("notices");
    expect(folderIdForDocument("income", "pay_stubs")).toBe("income");
  });

  it("marks proof from the screening chart and leaves the notice trail as a filing place", () => {
    const ctx = vaultCaseContext({
      screening: { ssdi: "current", snap: "possible", qmb: "no", snt: "exists" },
      authorities: ["poa"],
      extraActive: ["wjs"],
    });
    const bpqy = VAULT_FOLDERS.find((f) => f.id === "social_security")!.slots.find((s) => s.id === "bpqy")!;
    const snap = VAULT_FOLDERS.find((f) => f.id === "snap")!.slots[0]!;
    const qmb = VAULT_FOLDERS.find((f) => f.id === "medicare")!.slots.find((s) => s.id === "qmb_notice")!;
    const trust = VAULT_FOLDERS.find((f) => f.id === "snt_able")!.slots.find((s) => s.id === "trust_instrument")!;
    const poa = VAULT_FOLDERS.find((f) => f.id === "identity")!.slots.find((s) => s.id === "poa")!;
    const wjs = VAULT_FOLDERS.find((f) => f.id === "medicaid")!.slots.find((s) => s.id === "wjs_notice")!;
    const notice = VAULT_FOLDERS.find((f) => f.id === "notices")!.slots[0]!;
    const id = VAULT_FOLDERS[0]!.slots[0]!;

    expect(slotAttention(bpqy, ctx)).toBe("needed");
    expect(slotAttention(snap, ctx)).toBe("review");
    expect(slotAttention(qmb, ctx)).toBe("optional");
    expect(slotAttention(trust, ctx)).toBe("needed");
    expect(slotAttention(poa, ctx)).toBe("needed");
    expect(slotAttention(wjs, ctx)).toBe("needed");
    expect(slotAttention(notice, ctx)).toBe("keep");
    expect(slotAttention(id, vaultCaseContext({}))).toBe("needed");
  });
});
