"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { sameOriginDest } from "@/lib/auth/redirect";

const SIGN_IN_TIMEOUT_MS = 20_000;

export function InlineLoginForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setNotice(null);
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }
    setSendingCode(true);
    try {
      const res = await fetch("/api/auth/login-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.status === 429) {
        setError("Too many code requests. Please wait a few minutes and try again.");
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError((j as { error?: string }).error ?? "Could not send a code. Please try again.");
        return;
      }
      setCodeSent(true);
      setNotice(`If an account exists for ${email.trim()}, a 6-digit code is on its way.`);
    } catch {
      setError("Could not send a code. Please try again.");
    } finally {
      setSendingCode(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await Promise.race([
        signIn("email-code", {
          email,
          code,
          redirect: false,
          callbackUrl: "/",
        }),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), SIGN_IN_TIMEOUT_MS),
        ),
      ]);
      if (res?.error) {
        setError("That code is invalid or expired. Request a new one.");
        return;
      }
      window.location.assign(sameOriginDest(res?.url, "/"));
      // If navigation never unloads the page, recover instead of spinning forever.
      await new Promise((r) => setTimeout(r, 8_000));
      setError("Sign-in is taking longer than expected. Please try again.");
    } catch (err) {
      setError(
        err instanceof Error && err.message === "timeout"
          ? "Sign-in timed out. Please try again."
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full rounded-lg border border-[var(--color-cs-border)] bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-[var(--color-cs-text)]">Sign in</h2>
      <p className="mt-1 text-[13px] text-[var(--color-cs-text-secondary)]">
        Enter your email and we&apos;ll send you a 6-digit sign-in code.
      </p>
      <form className="mt-5 flex flex-col gap-3.5" onSubmit={codeSent ? verifyCode : requestCode}>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--color-cs-text)]" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-9 w-full rounded-sm border border-[var(--color-cs-input-border)] border-b-[var(--color-cs-input-bottom)] bg-white px-2.5 text-[13px] text-[var(--color-cs-text)] outline-none focus:border-[var(--color-cs-brand)] focus:border-b-2"
          />
        </div>
        {codeSent && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-medium text-[var(--color-cs-text)]">
              <label htmlFor="code">6-digit code</label>
              <button
                type="button"
                onClick={() => requestCode()}
                disabled={sendingCode}
                className="font-normal text-[var(--color-cs-brand)] hover:underline disabled:opacity-50"
              >
                {sendingCode ? "Sending…" : "Resend"}
              </button>
            </div>
            <input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="h-9 w-full rounded-sm border border-[var(--color-cs-input-border)] border-b-[var(--color-cs-input-bottom)] bg-white px-2.5 text-[13px] tracking-[0.4em] text-[var(--color-cs-text)] outline-none focus:border-[var(--color-cs-brand)] focus:border-b-2"
            />
          </div>
        )}
        {notice && <p className="text-xs text-[var(--color-cs-success)]">{notice}</p>}
        {error && <p className="text-xs text-[var(--color-cs-danger)]">{error}</p>}
        <button
          type="submit"
          disabled={loading || sendingCode}
          className="mt-1 w-full rounded-sm bg-[var(--color-cs-brand)] py-2.5 text-sm font-medium text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-60"
        >
          {codeSent
            ? loading
              ? "Verifying…"
              : "Verify & sign in"
            : sendingCode
              ? "Sending code…"
              : "Send me a code"}
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
            className="text-center text-xs font-medium text-[var(--color-cs-text-secondary)] hover:text-[var(--color-cs-brand)]"
          >
            Use a different email
          </button>
        )}
      </form>
    </div>
  );
}
