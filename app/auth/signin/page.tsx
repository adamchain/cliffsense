"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { AuthLoadingOverlay } from "@/components/auth/auth-loading-overlay";
import { AuthPageShell } from "@/components/layout/auth-page-shell";
import { sameOriginDest } from "@/lib/auth/redirect";
import { appPathAfterLogin } from "@/lib/auth/public-path";
import { IconLock, IconShieldCheck } from "@tabler/icons-react";

const SIGN_IN_TIMEOUT_MS = 20_000;

export default function SignInPage() {
  const searchParams = useSearchParams();
  /** Incomplete onboarding is sent to the right step by middleware after login. */
  const callbackUrl = appPathAfterLogin(searchParams.get("callbackUrl"));
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
          callbackUrl,
        }),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), SIGN_IN_TIMEOUT_MS),
        ),
      ]);
      if (res?.error) {
        setError("That code is invalid or expired. Request a new one.");
        return;
      }
      window.location.assign(appPathAfterLogin(sameOriginDest(res?.url, callbackUrl)));
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

  const [showBetaGate, setShowBetaGate] = useState(false);
  const [betaCode, setBetaCode] = useState("");
  const [betaError, setBetaError] = useState<string | null>(null);

  function handleCreateAccount() {
    setShowBetaGate(true);
    setBetaCode("");
    setBetaError(null);
  }

  function submitBetaCode(e: React.FormEvent) {
    e.preventDefault();
    if (betaCode.trim() === "access0108") {
      window.location.assign("/auth/signup");
    } else {
      setBetaError("That access code is incorrect. Check your invite and try again.");
    }
  }

  return (
    <>
      {loading ? (
        <AuthLoadingOverlay title="Signing you in" subtitle="Checking your sign-in code…" />
      ) : null}
      <AuthPageShell>
        {/* ---------- Heading ---------- */}
        <header className="border-b border-[var(--color-cs-border)] pb-7">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-cs-accent-orange)]">
            Secure sign-in
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-cs-navy)] sm:text-4xl">
            Sign in
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-cs-text-secondary)]">
            We’ll email you a 6-digit code. Use the address you signed up with.
          </p>
        </header>

        {/* ---------- Form card ---------- */}
        <div className="mt-8 rounded-lg border border-[var(--color-cs-border)] bg-white p-6 sm:p-7">
          <form className="flex flex-col gap-4" onSubmit={codeSent ? verifyCode : requestCode}>
            <div className="flex flex-col gap-1.5">
              <label className="cs-label" htmlFor="code-email">
                Email address
              </label>
              <input
                id="code-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="cs-input"
              />
            </div>
            {codeSent && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="cs-label" htmlFor="code">6-digit code</label>
                  <button
                    type="button"
                    onClick={() => requestCode()}
                    disabled={sendingCode}
                    className="text-xs font-semibold text-[var(--color-cs-brand)] hover:underline disabled:opacity-50"
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
                  className="cs-input tracking-[0.4em]"
                />
              </div>
            )}
            {notice && <p className="text-[13px] font-medium text-[var(--color-cs-success)]">{notice}</p>}
            {error && <p className="text-[13px] font-medium text-[var(--color-cs-danger)]">{error}</p>}
            <button
              type="submit"
              disabled={loading || sendingCode}
              className="cs-btn cs-btn-primary mt-1 w-full"
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
                className="text-center text-xs font-semibold text-[var(--color-cs-text-secondary)] hover:text-[var(--color-cs-brand)]"
              >
                Use a different email
              </button>
            )}
          </form>
        </div>

        {/* ---------- Trust badges ---------- */}
        <div className="mt-5 flex justify-center gap-5 text-[11px] text-[var(--color-cs-text-secondary)]">
          <span className="flex items-center gap-1.5">
            <IconLock size={14} className="text-[var(--color-cs-success)]" aria-hidden />
            256-bit encryption, in transit & at rest
          </span>
          <span className="flex items-center gap-1.5">
            <IconShieldCheck size={14} className="text-[var(--color-cs-success)]" aria-hidden />
            Bank credentials never stored
          </span>
        </div>

        {/* ---------- Create account ---------- */}
        {!showBetaGate ? (
          <p className="mt-6 text-center text-sm text-[var(--color-cs-text-secondary)]">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={handleCreateAccount}
              className="font-semibold text-[var(--color-cs-brand)] hover:underline"
            >
              Create account
            </button>
          </p>
        ) : (
          <div className="mt-6 rounded-lg border border-[var(--color-cs-border)] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[var(--color-cs-text)]">Beta access required</p>
            <p className="mt-1 text-[13px] text-[var(--color-cs-text-secondary)]">
              MyBenefitsPA is currently in private beta. Enter your access code to create an account.
            </p>
            <form className="mt-4 flex flex-col gap-3" onSubmit={submitBetaCode}>
              <input
                autoFocus
                type="text"
                value={betaCode}
                onChange={(e) => { setBetaCode(e.target.value); setBetaError(null); }}
                placeholder="Access code"
                className="cs-input"
              />
              {betaError && (
                <p className="text-[13px] font-medium text-[var(--color-cs-danger)]">{betaError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowBetaGate(false)}
                  className="flex-1 rounded-sm border border-[var(--color-cs-border)] py-2 text-sm font-medium text-[var(--color-cs-text-secondary)] hover:text-[var(--color-cs-brand)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cs-btn cs-btn-primary flex-1"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        )}
      </AuthPageShell>
    </>
  );
}
