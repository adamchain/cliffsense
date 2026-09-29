"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function NotificationsForm({ defaultEmail }: { defaultEmail: string }) {
  const router = useRouter();
  const { update } = useSession();
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        onboardingStep: "complete",
        notificationPrefs: { email },
      }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Could not save preferences");
      return;
    }
    await update({ onboardingStep: "complete" });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="cs-card space-y-5 p-6 md:p-7">
        <div className="flex flex-col gap-1.5">
          <label className="cs-label" htmlFor="em">
            Alert email
          </label>
          <input
            id="em"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="cs-input"
          />
        </div>
        <p className="text-sm text-[var(--color-cs-text-secondary)]">
          An email goes out when an alert is created. You can choose which kinds of alerts later in Settings.
        </p>
      </div>
      {error && <p className="text-[13px] text-[var(--color-cs-danger)]">{error}</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="cs-btn cs-btn-primary">
          {loading ? "Finishing…" : "Go to dashboard"}
        </button>
      </div>
    </form>
  );
}
