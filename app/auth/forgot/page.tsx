"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    }).catch(() => {});
    setBusy(false);
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16 font-sans">
      <h1 className="text-xl font-medium text-[var(--color-cs-text)]">Reset your password</h1>
      {sent ? (
        <p className="mt-3 text-[13px] text-[var(--color-cs-text-secondary)]">
          If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link. Check your inbox and
          spam folder. The link expires in 1 hour.
        </p>
      ) : (
        <>
          <p className="mt-3 text-[13px] text-[var(--color-cs-text-secondary)]">
            Enter your account email and we&apos;ll send a reset link.
          </p>
          <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-9 w-full rounded-sm border border-[var(--color-cs-input-border)] bg-white px-2.5 text-[13px] outline-none focus:border-[var(--color-cs-brand)]"
            />
            <button
              type="submit"
              disabled={busy}
              className="h-9 rounded-sm bg-[var(--color-cs-brand)] text-sm text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send reset link"}
            </button>
          </form>
        </>
      )}
      <Link href="/auth/signin" className="mt-6 inline-block text-sm text-[var(--color-cs-brand)] hover:underline">
        Back to sign in
      </Link>
    </div>
  );
}
