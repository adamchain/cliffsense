"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { AuthLoadingOverlay } from "@/components/auth/auth-loading-overlay";
import { AuthSplitLayout } from "@/components/layout/auth-split-layout";
import { IconLock, IconMail, IconShieldCheck, IconFingerprint, IconEye, IconEyeOff } from "@tabler/icons-react";

export default function SignInPage() {
  const searchParams = useSearchParams();
  /** Default `/` so middleware can send incomplete onboarding to the right step after login. */
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
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
      window.location.href = res?.url ?? callbackUrl;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      {loading ? (
        <AuthLoadingOverlay title="Signing you in" subtitle="Verifying your credentials…" />
      ) : null}
      <AuthSplitLayout
      sideTitle="Welcome back."
      sideBody={
        <p className="text-[13px] leading-relaxed text-white/85">
          Sign in to check your threshold status, review alerts, and stay on top of your benefits.
        </p>
      }
      sideFooter={
        <div className="space-y-3">
          <div className="flex flex-col gap-3 text-xs text-white/92">
            <div className="flex gap-2.5">
              <IconLock className="mt-0.5 shrink-0 text-[#7fba00]" size={16} aria-hidden />
              <span>256-bit encryption in transit and at rest</span>
            </div>
            <div className="flex gap-2.5">
              <IconShieldCheck className="mt-0.5 shrink-0 text-[#7fba00]" size={16} aria-hidden />
              <span>Bank credentials never stored — handled by Plaid</span>
            </div>
            <div className="flex gap-2.5">
              <IconFingerprint className="mt-0.5 shrink-0 text-[#7fba00]" size={16} aria-hidden />
              <span>Two-factor authentication planned post-launch</span>
            </div>
          </div>
          <p>
            Informational tool only. Not legal or financial advice.{" "}
            <Link className="text-white/95 underline" href="#">
              Terms
            </Link>{" "}
            ·{" "}
            <Link className="text-white/95 underline" href="#">
              Privacy
            </Link>{" "}
            ·{" "}
            <Link className="text-white/95 underline" href="#">
              Security
            </Link>
          </p>
        </div>
      }
    >
      <div className="w-full max-w-[360px]">
        <h1 className="text-2xl font-medium text-[var(--color-cs-text)]">Sign in</h1>
        <p className="mt-1.5 text-[13px] text-[var(--color-cs-text-secondary)]">
          Use the email address you signed up with.
        </p>
        <form className="mt-6 flex flex-col gap-3.5" onSubmit={onSubmit}>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#323130]" htmlFor="email">
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
              className="h-8 w-full rounded-sm border border-[var(--color-cs-input-border)] border-b border-b-[var(--color-cs-input-bottom)] bg-white px-2.5 text-[13px] text-[var(--color-cs-text)] outline-none focus:border-[var(--color-cs-brand)] focus:border-b-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-medium text-[#323130]">
              <label htmlFor="password">Password</label>
              <Link href="/auth/forgot" className="font-normal text-[var(--color-cs-brand)]">
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
                className="h-8 w-full rounded-sm border border-[var(--color-cs-input-border)] border-b border-b-[var(--color-cs-input-bottom)] bg-white px-2.5 pr-9 text-[13px] text-[var(--color-cs-text)] outline-none focus:border-[var(--color-cs-brand)] focus:border-b-2"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-cs-text-secondary)]"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <IconEyeOff size={16} /> : <IconEye size={16} />}
              </button>
            </div>
          </div>
          <label className="mt-1 flex items-center gap-2 text-xs text-[#323130]">
            <input type="checkbox" className="h-3.5 w-3.5 accent-[var(--color-cs-brand)]" />
            Keep me signed in on this device
          </label>
          {error && <p className="text-xs text-[var(--color-cs-danger)]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-sm bg-[var(--color-cs-brand)] py-2.5 text-sm font-medium text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <div className="my-5 flex items-center gap-2.5 text-[11px] text-[var(--color-cs-text-muted)]">
          <span className="h-px flex-1 bg-[var(--color-cs-border)]" />
          OR
          <span className="h-px flex-1 bg-[var(--color-cs-border)]" />
        </div>
        <button
          type="button"
          disabled
          title="Magic link coming soon"
          className="flex w-full items-center justify-center gap-2 rounded-sm border border-[var(--color-cs-input-border)] bg-white py-2.5 text-[13px] text-[var(--color-cs-text)] opacity-50"
        >
          <IconMail size={16} className="text-[var(--color-cs-brand)]" aria-hidden />
          Send me a sign-in link
        </button>
        <p className="mt-6 text-center text-[13px] text-[var(--color-cs-text-secondary)]">
          New to MyBenefitsPA?{" "}
          <Link href="/auth/signup" className="font-medium text-[var(--color-cs-brand)]">
            Create an account
          </Link>
        </p>
        <div className="mt-5 flex justify-center gap-4 border-t border-[var(--color-cs-border)] pt-4 text-[11px] text-[var(--color-cs-text-secondary)]">
          <span className="flex items-center gap-1.5">
            <IconLock size={14} className="text-[var(--color-cs-success)]" aria-hidden />
            Secure connection
          </span>
          <span className="flex items-center gap-1.5">
            <IconShieldCheck size={14} className="text-[var(--color-cs-success)]" aria-hidden />
            SOC 2 in progress
          </span>
        </div>
      </div>
    </AuthSplitLayout>
    </>
  );
}
