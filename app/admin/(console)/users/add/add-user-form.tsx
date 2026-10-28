"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Result = {
  userId: string;
  email: string;
  emailSent: boolean;
  generatedPassword?: string;
};

const ACCOUNT_TYPES: { value: string; label: string }[] = [
  { value: "beneficiary", label: "Beneficiary (acting for themselves)" },
  { value: "family", label: "Family" },
  { value: "fiduciary", label: "Fiduciary" },
  { value: "nonprofit", label: "Nonprofit" },
];

export function AddUserForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState("beneficiary");
  const [password, setPassword] = useState("");
  const [completeOnboarding, setCompleteOnboarding] = useState(false);
  const [sendCode, setSendCode] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setBusy(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name,
        accountType,
        password: password.trim() ? password : undefined,
        completeOnboarding,
        sendCode,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as Result & { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create the user");
      return;
    }
    setResult(data);
    setEmail("");
    setName("");
    setAccountType("beneficiary");
    setPassword("");
    setCompleteOnboarding(false);
    router.refresh();
  }

  const field =
    "mt-0.5 h-9 w-full rounded-sm border border-[var(--color-cs-border)] bg-white px-2.5 text-[13px]";
  const labelCls = "flex flex-col text-[11px] text-[var(--color-cs-text-secondary)]";

  return (
    <div className="max-w-xl">
      {result && (
        <div className="mb-4 rounded border border-[var(--color-cs-success)] bg-[var(--color-cs-success-bg)] p-3 text-[13px]">
          <p className="font-semibold text-[var(--color-cs-success)]">
            Created {result.email}
          </p>
          <p className="mt-1 text-[var(--color-cs-text-secondary)]">
            {result.emailSent
              ? "A sign-in code was emailed to the user."
              : "No sign-in code email was sent."}
          </p>
          {result.generatedPassword && (
            <p className="mt-1 text-[var(--color-cs-text-secondary)]">
              Temporary password:{" "}
              <code className="rounded bg-white px-1 py-0.5 font-mono text-[12px]">
                {result.generatedPassword}
              </code>{" "}
              — share it securely; it won&apos;t be shown again.
            </p>
          )}
          <a
            href={`/admin/users/${result.userId}`}
            className="mt-2 inline-block font-semibold text-[var(--color-cs-brand)] hover:underline"
          >
            Manage this user →
          </a>
        </div>
      )}

      <form
        onSubmit={submit}
        className="flex flex-col gap-3 rounded border border-[var(--color-cs-border)] bg-white p-4"
      >
        <label className={labelCls}>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className={field}
          />
        </label>

        <label className={labelCls}>
          Full name
          <input
            type="text"
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            className={field}
          />
        </label>

        <label className={labelCls}>
          Account type
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            className={field}
          >
            {ACCOUNT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className={labelCls}>
          Password <span className="normal-case">(optional)</span>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to generate a temporary one"
            minLength={8}
            className={field}
          />
        </label>

        <label className="flex items-start gap-2 text-[12px] text-[var(--color-cs-text)]">
          <input
            type="checkbox"
            checked={completeOnboarding}
            onChange={(e) => setCompleteOnboarding(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Mark onboarding complete and approve the account. Skips the setup flow and any review
            gate — use when you&apos;re setting the account up on their behalf.
          </span>
        </label>

        <label className="flex items-start gap-2 text-[12px] text-[var(--color-cs-text)]">
          <input
            type="checkbox"
            checked={sendCode}
            onChange={(e) => setSendCode(e.target.checked)}
            className="mt-0.5"
          />
          <span>Email the user a sign-in code now.</span>
        </label>

        {error && <p className="text-[12px] text-[var(--color-cs-danger)]">{error}</p>}

        <div>
          <button
            type="submit"
            disabled={busy}
            className="h-9 rounded-sm bg-[var(--color-cs-brand)] px-4 text-[13px] font-medium text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create user"}
          </button>
        </div>
      </form>
    </div>
  );
}
