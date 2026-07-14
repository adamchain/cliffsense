import { requireAdmin } from "@/lib/admin/require-admin";
import { connectDB } from "@/lib/db/mongodb";
import Threshold from "@/lib/db/models/Threshold";
import { ThresholdEditor, type ThresholdRow } from "./threshold-editor";

export const dynamic = "force-dynamic";

export default async function AdminThresholdsPage() {
  await requireAdmin();

  await connectDB();
  const rows = await Threshold.find({ scope: "system" })
    .sort({ program: 1, state: 1, label: 1 })
    .lean();

  const serialized: ThresholdRow[] = rows.map((t) => ({
    id: t._id.toString(),
    program: t.program ?? null,
    state: t.state ?? null,
    thresholdType: t.thresholdType,
    limitCents: t.limitCents,
    comparison: t.comparison as ThresholdRow["comparison"],
    warnAtPercent: t.warnAtPercent ?? 0.85,
    label: t.label,
    description: t.description ?? "",
    sourceUrl: t.sourceUrl ?? "",
    systemKey: t.systemKey ?? null,
    overridden: Boolean(t.overriddenByAdminAt),
    effectiveFrom: t.effectiveFrom ? new Date(t.effectiveFrom).toISOString() : null,
    effectiveTo: t.effectiveTo ? new Date(t.effectiveTo).toISOString() : null,
  }));

  return (
    <>
      <h1 className="mb-1 text-xl font-medium">System thresholds</h1>
      <p className="mb-4 max-w-2xl text-[13px] text-[var(--color-cs-text-secondary)]">
        Program limits applied to every beneficiary.{" "}
        <span className="font-medium text-[var(--color-cs-text)]">Bundled</span> rows come from the
        seed; editing one marks it <span className="font-medium text-[var(--color-cs-text)]">Overridden</span>{" "}
        so the seed no longer touches it, and <span className="font-medium text-[var(--color-cs-text)]">Reset</span>{" "}
        restores the bundled value. <span className="font-medium text-[var(--color-cs-text)]">Custom</span> rows
        are admin-authored. All changes are audit-logged.
      </p>
      <ThresholdEditor rows={serialized} />
    </>
  );
}
