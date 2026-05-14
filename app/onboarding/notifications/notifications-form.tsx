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
    <form onSubmit={onSubmit} className="mt-8 max-w-md space-y-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-[#323130]" htmlFor="em">
          Alert email
        </label>
        <input
          id="em"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-8 w-full rounded-sm border border-[var(--color-cs-input-border)] border-b border-b-[var(--color-cs-input-bottom)] bg-white px-2.5 text-[13px] outline-none focus:border-[var(--color-cs-brand)] focus:border-b-2"
        />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-[#323130]">Frequency</p>
        {frequencies.map((f) => (
          <label
            key={f.id}
            className={`flex cursor-pointer gap-3 rounded border p-3 text-sm ${
              frequency === f.id
                ? "border-2 border-[var(--color-cs-brand)] bg-[#f5faff] py-[11px]"
                : "border-[var(--color-cs-border)] bg-white hover:border-[var(--color-cs-brand)]"
            }`}
          >
            <input
              type="radio"
              name="freq"
              className="mt-1 accent-[var(--color-cs-brand)]"
              checked={frequency === f.id}
              onChange={() => setFrequency(f.id)}
            />
            <span>
              <span className="font-medium text-[var(--color-cs-text)]">{f.label}</span>
              <span className="mt-0.5 block text-xs text-[var(--color-cs-text-secondary)]">{f.desc}</span>
            </span>
          </label>
        ))}
      </div>
      {error && <p className="text-xs text-[var(--color-cs-danger)]">{error}</p>}
      <div className="flex justify-end border-t border-[var(--color-cs-border)] pt-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-sm bg-[var(--color-cs-brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-60"
        >
          {loading ? "Finishing…" : "Go to dashboard"}
        </button>
      </div>
    </form>
  );
}
