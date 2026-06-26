import type { FormFieldDef } from "@/lib/forms/types";

/** Render a stored field value for display (PDF + print view). */
export function displayValue(field: FormFieldDef, raw: string): string {
  const value = (raw ?? "").trim();
  if (!value) return "—";
  switch (field.type) {
    case "currency": {
      const n = Number(value.replace(/[^0-9.-]/g, ""));
      if (!Number.isFinite(n)) return value;
      return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
    }
    case "checkbox":
      return value === "true" ? "Yes" : "No";
    case "select":
      return field.options?.find((o) => o.value === value)?.label ?? value;
    case "date": {
      // value is YYYY-MM-DD
      const [y, m, d] = value.split("-").map(Number);
      if (!y || !m || !d) return value;
      return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
      });
    }
    default:
      return value;
  }
}
