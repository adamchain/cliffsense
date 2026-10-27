"use client";

import { useState } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setNotice(null);
    if (!email.trim()) {
      setError("Enter your Bene-Watch email.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/admin/auth/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 429) {
        setError("Too many code requests. Wait a few minutes and try again.");
        return;
      }
      if (!res.ok) {
        setError(body.error ?? "Could not send a code.");
        return;
      }
      setCodeSent(true);
      setNotice(`A 6-digit code is on its way to ${email.trim()}.`);
    } catch {
      setError("Could not send a code. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setVerifying(true);
    try {
      const res = await fetch("/api/admin/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "That code is invalid or expired.");
        return;
      }
      window.location.assign("/admin");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center">
      <BrandLogo className="h-8 w-auto" />
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-cs-text-secondary)]">
        Admin
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Sign in</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-cs-text-secondary)]">
        This console is separate from the Bene-Watch app. We’ll email a code to a @bene-watch.com
        address.
      </p>

      <form
        className="mt-6 flex flex-col gap-4 rounded-lg border border-[var(--color-cs-border)] bg-white p-6"
        onSubmit={codeSent ? verifyCode : requestCode}
      >
        <label className="flex flex-col gap-1.5">
          <span className="cs-label">Email address</span>
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@bene-watch.com"
            className="cs-input"
            disabled={codeSent}
          />
        </label>

        {codeSent && (
          <label className="flex flex-col gap-1.5">
            <span className="flex items-center justify-between">
              <span className="cs-label">6-digit code</span>
              <button
                type="button"
                onClick={() => void requestCode()}
                disabled={sending}
                className="text-xs font-semibold text-[var(--color-cs-brand)] hover:underline disabled:opacity-50"
              >
                {sending ? "Sending…" : "Resend"}
              </button>
            </span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="cs-input tracking-[0.4em]"
            />
          </label>
        )}

        {notice && <p className="text-[13px] font-medium text-[var(--color-cs-success)]">{notice}</p>}
        {error && <p className="text-[13px] font-medium text-[var(--color-cs-danger)]">{error}</p>}

        <button type="submit" disabled={sending || verifying} className="cs-btn cs-btn-primary w-full">
          {codeSent ? (verifying ? "Verifying…" : "Verify and continue") : sending ? "Sending code…" : "Email me a code"}
        </button>

        {codeSent && (
          <button
            type="button"
            onClick={() => {
              setCodeSent(false);
              setCode("");
              setNotice(null);
              setError(null);
            }}
            className="text-center text-xs font-semibold text-[var(--color-cs-text-secondary)]"
          >
            Use a different email
          </button>
        )}
      </form>
    </div>
  );
}
