import { describe, expect, it } from "vitest";
import { buildLimitSources, linesForLimit } from "./limit-sources";

describe("linesForLimit", () => {
  const sources = buildLimitSources(
    [
      {
        id: "w",
        date: "2026-10-03",
        amountCents: -80_000,
        userCategory: "earned_income",
        pending: false,
        name: "Payroll",
      },
      {
        id: "g",
        date: "2026-10-04",
        amountCents: -200_000,
        userCategory: "other_income",
        pending: false,
        name: "Gift",
      },
      {
        id: "x",
        date: "2026-10-05",
        amountCents: -4_000,
        userCategory: "expense",
        pending: false,
        name: "Rent",
      },
    ],
    [{ type: "depository", name: "Checking", currentBalanceCents: 1_800_00 }],
    "2026-10",
  );

  it("lists wage deposits for an earned-income limit and leaves expenses out", () => {
    const view = linesForLimit(sources, "monthly_earned_income", "SSI");
    expect(view.lines.map((line) => line.id)).toEqual(["w"]);
    expect(view.lines[0]?.included).toBe(true);
  });

  it("leaves a large one-time deposit out of the SNAP gross total", () => {
    const view = linesForLimit(sources, "monthly_gross_income", "SNAP");
    const gift = view.lines.find((line) => line.id === "g");
    expect(gift?.included).toBe(false);
    expect(view.lines.find((line) => line.id === "w")?.included).toBe(true);
  });

  it("lists countable account balances for a resource limit", () => {
    const view = linesForLimit(sources, "asset_balance", "SSI");
    expect(view.lines).toHaveLength(1);
    expect(view.lines[0]?.name).toBe("Checking");
    expect(view.lines[0]?.included).toBe(true);
  });
});
