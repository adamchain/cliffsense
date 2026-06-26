"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { AuthLoadingOverlay } from "@/components/auth/auth-loading-overlay";
import { AuthPageShell } from "@/components/layout/auth-page-shell";
import { IconLock, IconShieldCheck, IconEye, IconEyeOff } from "@tabler/icons-react";

/**
 * Resolve the post-login destination to a path on the CURRENT origin. NextAuth
 * builds `res.url` from NEXTAUTH_URL; if that env is stale (e.g. an old deploy
 * URL) it would otherwise redirect users off-site. We keep only the path so the
 * redirect always lands on the host the user is actually on.
 */
function sameOriginDest(url: string | null | undefined, fallback: string): string {
  if (!url) return fallback;
  try {
    const u = new URL(url, window.location.origin);
    return u.pathname + u.search + u.hash;
  } catch {
    return fallback;
  }
}

export default function SignInPage() {
  const searchParams = useSearchParams();
  /** Default `/` so middleware can send incomplete onboarding to the right step after login. */
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [mode, setMode] = useState<"password" | "code">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }
      window.location.href = sameOriginDest(res?.url, sameOriginDest(callbackUrl, "/"));
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

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
      await fetch("/api/auth/login-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
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
      const res = await signIn("email-code", {
        email,
        code,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError("That code is invalid or expired. Request a new one.");
        setLoading(false);
        return;
      }
      window.location.href = sameOriginDest(res?.url, sameOriginDest(callbackUrl, "/"));
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  function switchMode(next: "password" | "code") {
    setMode(next);
    setError(null);
    setNotice(null);
  }

  return (
    <>
      {loading ? (
        <AuthLoadingOverlay title="Signing you in" subtitle="Verifying your credentials…" />
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
            Sign in to check your threshold status, review alerts, and stay on top of your benefits.
            Use the email address you signed up with.
          </p>
        </header>

        {/* ---------- Form card ---------- */}
        <div className="mt-8 rounded-lg border border-[var(--color-cs-border)] bg-white p-6 sm:p-7">
          <div className="flex rounded-md border border-[var(--color-cs-border)] p-1 text-[13px] font-medium">
            <button
              type="button"
              onClick={() => switchMode("password")}
              className={`flex-1 rounded px-3 py-1.5 transition ${
                mode === "password"
                  ? "bg-[var(--color-cs-brand)] text-white"
                  : "text-[var(--color-cs-text-secondary)] hover:text-[var(--color-cs-brand)]"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => switchMode("code")}
              className={`flex-1 rounded px-3 py-1.5 transition ${
                mode === "code"
                  ? "bg-[var(--color-cs-brand)] text-white"
                  : "text-[var(--color-cs-text-secondary)] hover:text-[var(--color-cs-brand)]"
              }`}
            >
              Email code
            </button>
          </div>

          {mode === "password" ? (
            <form className="mt-5 flex flex-col gap-4" onSubmit={onSubmit}>
              <div className="flex flex-col gap-1.5">
                <label className="cs-label" htmlFor="email">
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
                  className="cs-input"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="cs-label" htmlFor="password">Password</label>
                  <Link href="/auth/forgot" className="text-xs font-semibold text-[var(--color-cs-brand)] hover:underline">
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="cs-input pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-cs-text-secondary)] hover:text-[var(--color-cs-brand)]"
                    onClick={() => setShowPw(!showPw)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  </button>
                </div>
              </div>
              <label className="mt-0.5 flex items-center gap-2 text-[13px] text-[var(--color-cs-text-secondary)]">
                <input type="checkbox" className="h-4 w-4 accent-[var(--color-cs-brand)]" />
                Keep me signed in on this device
              </label>
              {error && <p className="text-[13px] font-medium text-[var(--color-cs-danger)]">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="cs-btn cs-btn-primary mt-1 w-full"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          ) : (
            <form className="mt-5 flex flex-col gap-4" onSubmit={codeSent ? verifyCode : requestCode}>
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
          )}
        </div>

        {/* ---------- Create-account prompt ---------- */}
        <p className="mt-6 text-center text-sm text-[var(--color-cs-text-secondary)]">
          New to MyBenefitsPA?{" "}
          <Link href="/auth/signup" className="font-semibold text-[var(--color-cs-brand)] hover:underline">
            Create an account
          </Link>
        </p>

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
      </AuthPageShell>
    </>
  );
}
