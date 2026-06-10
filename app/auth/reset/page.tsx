"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError((json as { error?: string }).error ?? "Could not reset password");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/auth/signin?reset=success"), 1200);
  }

  if (!token) {
    return (
      <p className="mt-3 text-[13px] text-[var(--color-cs-text-secondary)]">
        This reset link is missing its token. Request a new one from{" "}
        <Link href="/auth/forgot" className="text-[var(--color-cs-brand)] hover:underline">
          Forgot password
        </Link>
        .
      </p>
    );
  }

  if (done) {
    return (
      <p className="mt-3 text-[13px] text-[#107c10]">Password updated. Redirecting to sign in…</p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
      <input
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password (min 8 characters)"
        className="h-9 w-full rounded-sm border border-[var(--color-cs-input-border)] bg-white px-2.5 text-[13px] outline-none focus:border-[var(--color-cs-brand)]"
      />
      <input
        type="password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirm new password"
        className="h-9 w-full rounded-sm border border-[var(--color-cs-input-border)] bg-white px-2.5 text-[13px] outline-none focus:border-[var(--color-cs-brand)]"
      />
      {error && <p className="text-xs text-[var(--color-cs-danger)]">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="h-9 rounded-sm bg-[var(--color-cs-brand)] text-sm text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-50"
      >
        {busy ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-16 font-sans">
      <h1 className="text-xl font-medium text-[var(--color-cs-text)]">Choose a new password</h1>
      <Suspense fallback={<p className="mt-3 text-[13px] text-[var(--color-cs-text-secondary)]">Loading…</p>}>
        <ResetForm />
      </Suspense>
      <Link href="/auth/signin" className="mt-6 inline-block text-sm text-[var(--color-cs-brand)] hover:underline">
        Back to sign in
      </Link>
    </div>
  );
}
