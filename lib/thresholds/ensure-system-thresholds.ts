import Threshold from "@/lib/db/models/Threshold";
import { SYSTEM_THRESHOLD_SEEDS, thresholdSeedToDoc } from "@/lib/thresholds/system-seeds";

/** Idempotent upsert of bundled reference thresholds (safe to call on every evaluation). */
export async function ensureSystemThresholdsSeeded(): Promise<void> {
  for (const seed of SYSTEM_THRESHOLD_SEEDS) {
    await Threshold.updateOne(
      { systemKey: seed.systemKey },
      { $set: thresholdSeedToDoc(seed) },
      { upsert: true },
    );
  }
}
