"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { US_STATES } from "@/lib/constants/us-states";

type Frequency = "realtime" | "daily" | "weekly";
type AlertTypes = {
  predictive: boolean;
  breach: boolean;
  trend: boolean;
  cliff: boolean;
  reporting: boolean;
  snt: boolean;
  able: boolean;
};

const ALERT_TYPE_LABELS: { key: keyof AlertTypes; label: string; desc: string }[] = [
  { key: "breach", label: "Limit reached", desc: "A threshold has been crossed." },
  { key: "predictive", label: "Approaching a limit", desc: "On pace to cross a threshold soon." },
  { key: "trend", label: "Trend changes", desc: "Notable shifts in income or balances." },
  {
    key: "cliff",
    label: "Eligibility cliffs",
    desc: "SGA, SSI FBR, waiver twilight, MAWD paths, and similar loss risks.",
  },
  {
    key: "reporting",
    label: "Reporting deadlines",
    desc: "Wage changes and 10-day / 10th-of-month filing reminders.",
  },
  {
    key: "snt",
    label: "SNT payment effects",
    desc: "Cash vs shelter ISM vs excluded vendor payments.",
  },
  {
    key: "able",
    label: "ABLE suspension risk",
    desc: "ABLE balances near the $100k SSI cash-suspension line.",
  },
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
    <form onSubmit={save} className="space-y-5">
      <div className="space-y-3.5">
        <label className="block">
          <span className="cs-label">Display name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="cs-input mt-1.5"
          />
        </label>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <label className="block">
            <span className="cs-label">State</span>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="cs-input mt-1.5"
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
            <span className="cs-label">Household size</span>
            <input
              type="number"
              min={1}
              value={householdSize}
              onChange={(e) => setHouseholdSize(Number(e.target.value) || 1)}
              className="cs-input mt-1.5"
            />
          </label>
        </div>
      </div>

      <div className="border-t border-[var(--color-cs-sep)] pt-4" data-tour="settings-email">
        <h3 className="mb-3 text-[15px] font-semibold text-[var(--color-cs-text)]">
          Email notifications
        </h3>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <label className="block">
            <span className="cs-label">Email frequency</span>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as Frequency)}
              className="cs-input mt-1.5"
            >
              <option value="realtime">Real-time</option>
              <option value="daily">Daily digest</option>
              <option value="weekly">Weekly digest</option>
            </select>
          </label>
          <label className="block">
            <span className="cs-label">Send to email</span>
            <input
              type="email"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              placeholder="Leave blank to use sign-in email"
              className="cs-input mt-1.5"
            />
          </label>
        </div>

        <div className="mt-4">
          <span className="cs-label">Which alerts to email</span>
          <ul className="mt-2 space-y-0 overflow-hidden rounded-[14px] bg-[var(--color-cs-surface)]">
            {ALERT_TYPE_LABELS.map((t, i) => (
              <li
                key={t.key}
                className={`px-3.5 py-2.5 ${i > 0 ? "border-t border-[var(--color-cs-sep)]" : ""}`}
              >
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={alertTypes[t.key]}
                    onChange={(e) =>
                      setAlertTypes({ ...alertTypes, [t.key]: e.target.checked })
                    }
                    className="mt-1 h-4 w-4 accent-[var(--color-cs-brand)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-[15px] font-medium text-[var(--color-cs-text)]">
                      {t.label}
                    </span>
                    <span className="block text-[12px] leading-snug text-[var(--color-cs-text-secondary)]">
                      {t.desc}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4">
          <span className="cs-label">Also copy these addresses</span>
          <p className="mb-2 mt-1 text-[12px] text-[var(--color-cs-text-secondary)]">
            e.g. a family member or advisor
          </p>
          {additionalEmails.length > 0 && (
            <ul className="mb-2 space-y-1.5">
              {additionalEmails.map((em) => (
                <li
                  key={em}
                  className="flex items-center justify-between gap-2 rounded-[12px] bg-[var(--color-cs-surface)] px-3 py-2"
                >
                  <span className="truncate text-[14px] text-[var(--color-cs-text)]">{em}</span>
                  <button
                    type="button"
                    onClick={() => setAdditionalEmails(additionalEmails.filter((x) => x !== em))}
                    className="shrink-0 text-[13px] font-semibold text-[var(--color-cs-danger)]"
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
              className="cs-input flex-1"
            />
            <button type="button" onClick={addEmail} className="cs-btn cs-btn-secondary shrink-0">
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-[var(--color-cs-sep)] pt-4">
        <button type="submit" disabled={saving} className="cs-btn cs-btn-primary disabled:opacity-50">
          {saving ? "Saving…" : "Save changes"}
        </button>
        {status && (
          <span
            className={`text-[13px] ${
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
