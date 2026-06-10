"use client";

import { signOut } from "next-auth/react";

/**
 * Exits the onboarding flow. While onboarding is incomplete the middleware
 * traps the user inside /onboarding/* (every other path redirects back), so the
 * only real way out is to sign out. Progress is saved server-side, so signing
 * back in resumes at the same step.
 */
export function OnboardingExitButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-[11px] text-[var(--color-cs-brand)] hover:underline md:text-xs"
    >
      Save &amp; exit
    </button>
  );
}
