"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const LIMITS_HASHES: Record<string, string> = {
  alerts: "/limits/alerts",
  limits: "/limits",
  policy: "/limits/policy",
  programs: "/limits/programs",
};

/** Old /settings#alerts (etc.) bookmarks land on profile now — send them to the matching page. */
export function LegacySettingsHashRedirect() {
  const router = useRouter();
  useEffect(() => {
    const id = window.location.hash.replace(/^#/, "");
    const href = LIMITS_HASHES[id];
    if (href) router.replace(href);
  }, [router]);
  return null;
}
