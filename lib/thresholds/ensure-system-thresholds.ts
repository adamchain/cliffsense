import Threshold from "@/lib/db/models/Threshold";
import { SYSTEM_THRESHOLD_SEEDS, thresholdSeedToDoc } from "@/lib/thresholds/system-seeds";

/**
 * Idempotent upsert of bundled reference thresholds (safe to call on every
 * evaluation). Rows an admin has hand-edited (marked `overriddenByAdminAt`) are
 * left untouched so back-office overrides survive reseeding — the filter only
 * matches non-overridden rows, and a duplicate-key error (the overridden row
 * already exists under this `systemKey`) is swallowed rather than clobbering it.
 */
export async function ensureSystemThresholdsSeeded(): Promise<void> {
  for (const seed of SYSTEM_THRESHOLD_SEEDS) {
    try {
      await Threshold.updateOne(
        { systemKey: seed.systemKey, overriddenByAdminAt: null },
        { $set: thresholdSeedToDoc(seed) },
        { upsert: true },
      );
    } catch (err) {
      // 11000 = the row exists but is admin-overridden (filtered out above), so
      // the upsert tried to insert a duplicate systemKey. Leave the override.
      if ((err as { code?: number }).code !== 11000) throw err;
    }
  }
}
