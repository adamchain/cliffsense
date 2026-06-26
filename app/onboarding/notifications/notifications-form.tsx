"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const frequencies = [
  { id: "realtime" as const, label: "As they happen", desc: "An email when a new alert is created." },
  { id: "daily" as const, label: "Daily digest", desc: "One summary email around 8:00 a.m. your time." },
  { id: "weekly" as const, label: "Weekly digest", desc: "Monday summary of the past week." },
];

export function NotificationsForm({ defaultEmail }: { defaultEmail: string }) {
  const router = useRouter();
  const { update } = useSession();
  const [frequency, setFrequency] = useState<"realtime" | "daily" | "weekly">("daily");
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
        notificationPrefs: { frequency, email },
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
        <div className="space-y-2.5">
          <p className="cs-label">Frequency</p>
          {frequencies.map((f) => {
            const selected = frequency === f.id;
            return (
              <label
                key={f.id}
                className={`flex cursor-pointer gap-3 rounded-2xl border p-4 text-sm transition-colors ${
                  selected
                    ? "border-[var(--color-cs-brand)] bg-[var(--color-cs-brand-soft)] ring-1 ring-[var(--color-cs-brand)]"
                    : "border-[var(--color-cs-border)] bg-white hover:border-[var(--color-cs-brand)]"
                }`}
              >
                <input
                  type="radio"
                  name="freq"
                  className="mt-0.5 accent-[var(--color-cs-brand)]"
                  checked={selected}
                  onChange={() => setFrequency(f.id)}
                />
                <span>
                  <span className="font-semibold text-[var(--color-cs-text)]">{f.label}</span>
                  <span className="mt-0.5 block text-xs text-[var(--color-cs-text-secondary)]">{f.desc}</span>
                </span>
              </label>
            );
          })}
        </div>
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
