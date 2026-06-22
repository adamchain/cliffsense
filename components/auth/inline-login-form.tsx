"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";

export function InlineLoginForm() {
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
        callbackUrl: "/",
      });
      if (res?.error) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }
      window.location.href = res?.url ?? "/";
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full rounded-lg border border-[var(--color-cs-border)] bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-[var(--color-cs-text)]">Sign in</h2>
      <p className="mt-1 text-[13px] text-[var(--color-cs-text-secondary)]">
        Use the email address you signed up with.
      </p>
      <form className="mt-5 flex flex-col gap-3.5" onSubmit={onSubmit}>
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
            className="h-9 w-full rounded-sm border border-[var(--color-cs-input-border)] border-b-[var(--color-cs-input-bottom)] bg-white px-2.5 text-[13px] text-[var(--color-cs-text)] outline-none focus:border-[var(--color-cs-brand)] focus:border-b-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-medium text-[#323130]">
            <label htmlFor="password">Password</label>
            <Link href="/auth/forgot" className="font-normal text-[var(--color-cs-brand)] hover:underline">
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
              className="h-9 w-full rounded-sm border border-[var(--color-cs-input-border)] border-b-[var(--color-cs-input-bottom)] bg-white px-2.5 pr-9 text-[13px] text-[var(--color-cs-text)] outline-none focus:border-[var(--color-cs-brand)] focus:border-b-2"
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
        {error && <p className="text-xs text-[var(--color-cs-danger)]">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full rounded-sm bg-[var(--color-cs-brand)] py-2.5 text-sm font-medium text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-5 text-center text-[13px] text-[var(--color-cs-text-secondary)]">
        New to MyBenefitsPA?{" "}
        <Link href="/auth/signup" className="font-medium text-[var(--color-cs-brand)] hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
