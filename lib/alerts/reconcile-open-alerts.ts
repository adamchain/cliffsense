import type { Types } from "mongoose";
import { enrolledMatchesProgram } from "@/lib/programs";
import { loadThresholdDashboardPayload } from "@/lib/thresholds/threshold-dashboard";
import Alert from "@/lib/db/models/Alert";
import ContinuityCase from "@/lib/db/models/ContinuityCase";

function programKey(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function listedPrograms(snapshot: unknown): string[] {
  if (!snapshot || typeof snapshot !== "object") return [];
  const row = snapshot as { program?: unknown; programs?: unknown };
  const names: string[] = [];
  if (typeof row.program === "string" && row.program.trim()) names.push(row.program);
  if (Array.isArray(row.programs)) {
    for (const program of row.programs) {
      if (typeof program === "string" && program.trim()) names.push(program);
    }
  }
  return names;
}

function reportedByUser(snapshot: unknown): boolean {
  if (!snapshot || typeof snapshot !== "object") return false;
  const id = (snapshot as { reportedByUserId?: unknown }).reportedByUserId;
  return typeof id === "string" && id.length > 0;
}

/**
 * An automatic alert stays only while its program is still enrolled and the
 * program screen is not green. A notice the user reported by hand stays.
 */
export function openAlertShouldClear(input: {
  reportedByUser: boolean;
  alertPrograms: string[];
  enrolled: string[];
  hotPrograms: string[];
}): boolean {
  if (input.reportedByUser) return false;
  const named = input.alertPrograms.map(programKey).filter(Boolean);
  if (named.length === 0) return input.hotPrograms.length === 0;
  const stillEnrolled = named.filter((program) => enrolledMatchesProgram(input.enrolled, program));
  if (stillEnrolled.length === 0) return true;
  return !stillEnrolled.some((program) => enrolledMatchesProgram(input.hotPrograms, program));
}

/**
 * Resolves unread alerts that belong to a program the account no longer has,
 * or to a program whose current screen is green. The sidebar badge counts what
 * remains.
 */
export async function reconcileOpenAlerts(beneficiaryId: Types.ObjectId): Promise<number> {
  const dashboard = await loadThresholdDashboardPayload(beneficiaryId, { skipCategorySync: true });
  const hotPrograms = [
    ...new Set(
      dashboard.rows
        .filter((row) => row.attached && row.status !== "ok" && row.program)
        .map((row) => programKey(String(row.program))),
    ),
  ];
  const open = await Alert.find({
    beneficiaryId,
    status: "new",
  })
    .select({ _id: 1, dataSnapshot: 1 })
    .lean();

  const clearIds = open
    .filter((alert) =>
      openAlertShouldClear({
        reportedByUser: reportedByUser(alert.dataSnapshot),
        alertPrograms: listedPrograms(alert.dataSnapshot),
        enrolled: dashboard.programsEnrolled,
        hotPrograms,
      }),
    )
    .map((alert) => alert._id);
  if (clearIds.length === 0) return 0;

  await Alert.updateMany({ _id: { $in: clearIds } }, { $set: { status: "resolved" } });
  await ContinuityCase.updateMany(
    { alertId: { $in: clearIds }, status: { $ne: "closed" } },
    { $set: { status: "closed" } },
  );
  return clearIds.length;
}
