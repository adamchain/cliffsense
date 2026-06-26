"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { US_STATES } from "@/lib/constants/us-states";

type Frequency = "realtime" | "daily" | "weekly";
type AlertTypes = { predictive: boolean; breach: boolean; trend: boolean };

const ALERT_TYPE_LABELS: { key: keyof AlertTypes; label: string; desc: string }[] = [
  { key: "breach", label: "Limit reached", desc: "A threshold has been crossed." },
  { key: "predictive", label: "Approaching a limit", desc: "On pace to cross a threshold soon." },
  { key: "trend", label: "Trend changes", desc: "Notable shifts in income or balances." },
];

export function SettingsForm({
  initialName,
  initialFrequency,
  initialNotifyEmail,
  initialAlertTypes,
  initialAdditionalEmails,
  initialState,
  initialHouseholdSize,
}: {
  initialName: string;
  initialFrequency: Frequency;
  initialNotifyEmail: string;
  initialAlertTypes: AlertTypes;
  initialAdditionalEmails: string[];
  initialState: string;
  initialHouseholdSize: number;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [frequency, setFrequency] = useState<Frequency>(initialFrequency);
  const [notifyEmail, setNotifyEmail] = useState(initialNotifyEmail);
  const [alertTypes, setAlertTypes] = useState<AlertTypes>(initialAlertTypes);
  const [additionalEmails, setAdditionalEmails] = useState<string[]>(initialAdditionalEmails);
  const [newEmail, setNewEmail] = useState("");
  const [state, setState] = useState(initialState);
  const [householdSize, setHouseholdSize] = useState(initialHouseholdSize);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function addEmail() {
    const candidate = newEmail.trim().toLowerCase();
    if (!candidate) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(candidate)) {
      setStatus({ kind: "err", text: "Enter a valid email address." });
      return;
    }
    if (additionalEmails.includes(candidate)) {
      setNewEmail("");
      return;
    }
    if (additionalEmails.length >= 10) {
      setStatus({ kind: "err", text: "Up to 10 additional recipients." });
      return;
    }
    setAdditionalEmails([...additionalEmails, candidate]);
    setNewEmail("");
    setStatus(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        notificationPrefs: {
          frequency,
          email: notifyEmail,
          alertTypes,
          additionalEmails,
        },
        state: state || undefined,
        householdSize,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setStatus({ kind: "err", text: data.error ?? "Could not save" });
      return;
    }
    setStatus({ kind: "ok", text: "Saved." });
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-3 text-[13px]">
      <label className="block">
        <span className="mb-1 block text-[11px] uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
          Display name
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 w-full rounded-sm border border-[var(--color-cs-border)] px-2"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
            State
          </span>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="h-9 w-full rounded-sm border border-[var(--color-cs-border)] bg-white px-2"
          >
            <option value="">—</option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
            Household size
          </span>
          <input
            type="number"
            min={1}
            value={householdSize}
            onChange={(e) => setHouseholdSize(Number(e.target.value) || 1)}
            className="h-9 w-full rounded-sm border border-[var(--color-cs-border)] px-2"
          />
        </label>
      </div>

      <fieldset className="rounded border border-[var(--color-cs-border)] p-3">
        <legend className="px-1 text-[11px] uppercase tracking-wide text-[var(--color-cs-text-secondary)]">
          Notifications
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11px] text-[var(--color-cs-text-secondary)]">
              Email frequency
            </span>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as Frequency)}
              className="h-9 w-full rounded-sm border border-[var(--color-cs-border)] bg-white px-2"
            >
              <option value="realtime">Real-time</option>
              <option value="daily">Daily digest</option>
              <option value="weekly">Weekly digest</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] text-[var(--color-cs-text-secondary)]">
              Send to email
            </span>
            <input
              type="email"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              placeholder="leave blank to use sign-in email"
              className="h-9 w-full rounded-sm border border-[var(--color-cs-border)] px-2"
            />
          </label>
        </div>

        <div className="mt-3">
          <span className="mb-1.5 block text-[11px] text-[var(--color-cs-text-secondary)]">
            Which alerts to email
          </span>
          <div className="space-y-1.5">
            {ALERT_TYPE_LABELS.map((t) => (
              <label key={t.key} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={alertTypes[t.key]}
                  onChange={(e) =>
                    setAlertTypes({ ...alertTypes, [t.key]: e.target.checked })
                  }
                  className="mt-0.5 h-4 w-4 accent-[var(--color-cs-brand)]"
                />
                <span>
                  <span className="font-medium text-[var(--color-cs-text)]">{t.label}</span>
                  <span className="ml-1.5 text-[11px] text-[var(--color-cs-text-secondary)]">
                    {t.desc}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <span className="mb-1.5 block text-[11px] text-[var(--color-cs-text-secondary)]">
            Also copy these addresses (e.g. a family member or advisor)
          </span>
          {additionalEmails.length > 0 && (
            <ul className="mb-2 space-y-1">
              {additionalEmails.map((em) => (
                <li
                  key={em}
                  className="flex items-center justify-between rounded-sm border border-[var(--color-cs-border)] px-2 py-1"
                >
                  <span className="truncate text-[var(--color-cs-text)]">{em}</span>
                  <button
                    type="button"
                    onClick={() => setAdditionalEmails(additionalEmails.filter((x) => x !== em))}
                    className="ml-2 shrink-0 text-[11px] font-medium text-[var(--color-cs-danger)] hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addEmail();
                }
              }}
              placeholder="name@example.com"
              className="h-9 flex-1 rounded-sm border border-[var(--color-cs-border)] px-2"
            />
            <button
              type="button"
              onClick={addEmail}
              className="rounded-sm border border-[var(--color-cs-border)] px-3 text-[12px] font-medium text-[var(--color-cs-brand)] hover:bg-[var(--color-cs-bg)]"
            >
              Add
            </button>
          </div>
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-sm bg-[var(--color-cs-brand)] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {status && (
          <span
            className={`text-[11px] ${
              status.kind === "ok" ? "text-[var(--color-cs-success)]" : "text-[var(--color-cs-danger)]"
            }`}
          >
            {status.text}
          </span>
        )}
      </div>
    </form>
  );
}
