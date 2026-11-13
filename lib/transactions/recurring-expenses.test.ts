import { describe, expect, it } from "vitest";
import {
  irweSourceAllowsAuto,
  summarizeExpenses,
  type ExpenseInput,
} from "./recurring-expenses";

function row(
  id: string,
  date: string,
  name: string,
  category: string,
  amountCents: number,
): ExpenseInput {
  return { id, date, amountCents, name, merchantName: "", category };
}

/** Outflows from an imported statement, after they are categorized as expenses. */
const IMPORTED = [
  row("1", "2026-11-12", "CVS PHARMACY", "Pharmacy & Personal Care", 1620),
  row("2", "2026-11-11", "McDonald's", "Restaurants", 1365),
  row("3", "2026-11-10", "T-Mobile", "Phone", 4800),
  row("4", "2026-11-09", "Giant Food Stores", "Groceries", 5124),
  row("5", "2026-11-08", "ATM Withdrawal", "Cash Withdrawal", 4000),
  row("6", "2026-11-07", "Dollar General", "Household", 2173),
  row("7", "2026-11-06", "SEPTA KEY AUTOLOAD", "Transportation", 2500),
  row("8", "2026-11-05", "Comcast Internet", "Utilities", 5999),
  row("9", "2026-11-04", "Aldi", "Groceries", 3986),
  row("10", "2026-11-03", "CVS PHARMACY", "Pharmacy & Personal Care", 749),
  row("11", "2026-11-02", "PECO ELECTRIC", "Utilities", 7118),
  row("12", "2026-11-01", "Wawa #812", "Food & Convenience", 1422),
  row("13", "2026-10-31", "Rent Payment - Oakview Apartment", "Housing", 62500),
  row("14", "2026-10-30", "Giant Food Stores", "Groceries", 2954),
  row("15", "2026-10-27", "SEPTA KEY AUTOLOAD", "Transportation", 2500),
  row("16", "2026-10-25", "Amazon Marketplace", "Shopping", 2499),
  row("17", "2026-10-23", "Aldi", "Groceries", 4762),
  row("18", "2026-10-21", "CVS PHARMACY", "Pharmacy & Personal Care", 1843),
  row("19", "2026-10-20", "Pizza Hut", "Restaurants", 1986),
  row("20", "2026-10-19", "Water Utility Payment", "Utilities", 3125),
  row("21", "2026-10-17", "Walmart", "Household & Groceries", 3374),
  row("22", "2026-10-16", "Spotify", "Subscriptions", 1199),
  row("23", "2026-10-15", "Shell Gas", "Transportation", 2750),
  row("24", "2026-10-14", "Giant Food Stores", "Groceries", 3691),
  row("25", "2026-10-13", "T-Mobile", "Phone", 4800),
  row("26", "2026-10-12", "Rite Aid", "Pharmacy & Personal Care", 962),
  row("27", "2026-10-11", "Rent Payment - Oakview Apartment", "Housing", 62500),
  row("28", "2026-10-10", "McDonald's", "Restaurants", 1148),
  row("29", "2026-10-09", "Aldi", "Groceries", 4217),
  row("30", "2026-10-08", "ATM Withdrawal", "Cash Withdrawal", 6000),
  row("31", "2026-10-07", "Dollar General", "Household", 1634),
  row("32", "2026-10-06", "Comcast Internet", "Utilities", 5999),
  row("33", "2026-10-05", "SEPTA KEY AUTOLOAD", "Transportation", 2500),
  row("34", "2026-10-04", "CVS PHARMACY", "Pharmacy & Personal Care", 1289),
  row("35", "2026-10-03", "PECO ELECTRIC", "Utilities", 6840),
  row("36", "2026-10-02", "Giant Food Stores", "Groceries", 5428),
  row("37", "2026-10-01", "Wawa #812", "Food & Convenience", 1876),
];

describe("summarizeExpenses", () => {
  const summary = summarizeExpenses(IMPORTED);

  it("lists stable repeating bills and leaves grocery runs off the list", () => {
    expect(summary.recurring.map((item) => item.label)).toEqual([
      "Rent Payment - Oakview Apartment",
      "PECO ELECTRIC",
      "Comcast Internet",
      "SEPTA KEY AUTOLOAD",
      "T-Mobile",
    ]);
    expect(summary.recurring.find((item) => item.label === "Rent Payment - Oakview Apartment")).toMatchObject({
      frequency: "monthly",
      monthlyAmountCents: 62500,
      count: 2,
    });
    expect(summary.recurring.find((item) => item.label === "SEPTA KEY AUTOLOAD")).toMatchObject({
      frequency: "biweekly",
      monthlyAmountCents: 5417,
      workRelated: true,
    });
    expect(summary.recurring.find((item) => item.label === "PECO ELECTRIC")?.monthlyAmountCents).toBe(6979);
    expect(summary.recurringMonthlyCents).toBe(85695);
  });

  it("estimates monthly work expenses from pharmacy, transit, and gas", () => {
    expect(summary.workRelatedMonthlyCents).toBe(13044);
    expect(summary.workRelatedLabels).toEqual([
      "SEPTA KEY AUTOLOAD",
      "CVS PHARMACY",
      "Shell Gas",
      "Rite Aid",
    ]);
    expect(summary.workRelatedNote).toBe("SEPTA KEY AUTOLOAD, CVS PHARMACY, Shell Gas, and Rite Aid");
  });

  it("does not turn one pharmacy trip into a monthly work expense", () => {
    const one = summarizeExpenses([
      row("a", "2026-11-12", "CVS PHARMACY", "Pharmacy & Personal Care", 1620),
    ]);
    expect(one.workRelatedMonthlyCents).toBe(0);
    expect(one.recurring).toHaveLength(0);
  });
});

describe("irweSourceAllowsAuto", () => {
  it("fills an empty field and keeps a saved amount", () => {
    expect(irweSourceAllowsAuto("", 0)).toBe(true);
    expect(irweSourceAllowsAuto("auto", 13044)).toBe(true);
    expect(irweSourceAllowsAuto("manual", 5000)).toBe(false);
    expect(irweSourceAllowsAuto("", 5000)).toBe(false);
  });
});
