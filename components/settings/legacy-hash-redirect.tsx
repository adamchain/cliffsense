"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const LIMITS_HASHES = new Set(["alerts", "limits", "policy", "programs"]);

/** Old /settings#alerts (etc.) bookmarks land on profile now — send them to Limits. */
export function LegacySettingsHashRedirect() {
  const router = useRouter();
  useEffect(() => {
    const id = window.location.hash.replace(/^#/, "");
    if (LIMITS_HASHES.has(id)) {
      router.replace(`/limits#${id}`);
    }
  }, [router]);
  return null;
}
