export type Recurrence = {
  freq: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  until: Date | null;
};

/**
 * Advance a date by one recurrence step. Month/year math clamps to the end of
 * the target month (e.g. monthly from Jan 31 → Feb 28), matching how people
 * expect "same day each month" reminders to behave.
 */
export function advanceDate(from: Date, rec: Recurrence): Date {
  const next = new Date(from.getTime());
  const n = Math.max(1, rec.interval || 1);
  switch (rec.freq) {
    case "daily":
      next.setUTCDate(next.getUTCDate() + n);
      break;
    case "weekly":
      next.setUTCDate(next.getUTCDate() + n * 7);
      break;
    case "monthly": {
      const day = next.getUTCDate();
      next.setUTCDate(1);
      next.setUTCMonth(next.getUTCMonth() + n);
      next.setUTCDate(Math.min(day, daysInUTCMonth(next)));
      break;
    }
    case "yearly":
      next.setUTCFullYear(next.getUTCFullYear() + n);
      break;
  }
  return next;
}

function daysInUTCMonth(d: Date): number {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
}

/**
 * Next occurrence strictly after `from`. Returns null when the series has ended
 * (next step would fall past `until`), signalling the item should close.
 */
export function nextOccurrence(from: Date, rec: Recurrence): Date | null {
  const next = advanceDate(from, rec);
  if (rec.until && next.getTime() > rec.until.getTime()) {
    return null;
  }
  return next;
}
