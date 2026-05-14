"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthLoadingOverlay } from "@/components/auth/auth-loading-overlay";
import { AuthSplitLayout } from "@/components/layout/auth-split-layout";
import {
  IconCheck,
  IconUser,
  IconUsers,
  IconBriefcase,
  IconHeartHandshake,
} from "@tabler/icons-react";

const types = [
  {
    id: "beneficiary" as const,
    name: "Beneficiary",
    desc: "I’m managing my own benefits and bank activity.",
    icon: IconUser,
    tone: "a",
  },
  {
    id: "family" as const,
    name: "Family / caregiver",
    desc: "I help a loved one stay within their limits.",
    icon: IconUsers,
    tone: "b",
  },
  {
    id: "fiduciary" as const,
    name: "Professional fiduciary",
    desc: "I manage accounts for multiple clients or trusts.",
    icon: IconBriefcase,
    tone: "c",
  },
  {
    id: "nonprofit" as const,
    name: "Nonprofit / caseworker",
    desc: "I support a caseload with reporting needs.",
    icon: IconHeartHandshake,
    tone: "d",
  },
];

const toneBg: Record<string, string> = {
  a: "bg-[var(--color-cs-info-bg)] text-[var(--color-cs-brand)]",
  b: "bg-[var(--color-cs-success-bg)] text-[var(--color-cs-success)]",
  c: "bg-[#fff4ce] text-[#797673]",
  d: "bg-[var(--color-cs-danger-bg)] text-[var(--color-cs-danger)]",
};

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [accountType, setAccountType] = useState<(typeof types)[number]["id"]>("beneficiary");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function register() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, accountType }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError((j as { error?: string }).error ?? "Could not create account");
        setLoading(false);
        return;
      }
      const sign = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/onboarding/profile",
      });
      if (sign?.error) {
        setError("Account created but sign-in failed. Try signing in.");
        setLoading(false);
        return;
      }
      router.push("/onboarding/profile");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      {loading ? (
        <AuthLoadingOverlay
          title="Creating your account"
          subtitle="Securing your session and preparing your workspace…"
        />
      ) : null}
      <AuthSplitLayout
      sideTitle="Keep your benefits. Know your threshold."
      sideBody={
        <>
          <p className="text-[13px] leading-relaxed text-white/85">
            CliffSense helps you see how bank deposits and balances relate to common program limits,
            and emails you before you approach a threshold — so you can plan with your counselor or
            agency.
          </p>
          <ul className="mt-5 flex flex-col gap-3 text-xs text-white/92">
            {[
              "Connect your bank securely through Plaid",
              "Reference limits for SSI, SSDI, SNAP, Medicaid & more",
              "Get email heads-up before you near a limit",
              "Bank-level encryption, deletable anytime",
            ].map((t) => (
              <li key={t} className="flex gap-2.5">
                <IconCheck className="mt-0.5 shrink-0 text-[#7fba00]" size={16} aria-hidden />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </>
      }
      sideFooter={
        <p>
          Informational tool only. Not legal or financial advice. By signing up you agree to our{" "}
          <Link className="text-white/95 underline" href="#">
            Terms
          </Link>{" "}
          and{" "}
          <Link className="text-white/95 underline" href="#">
            Privacy Policy
          </Link>
          .
        </p>
      }
    >
      <div className="w-full max-w-[560px]">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[var(--color-cs-text-secondary)]">
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium ${
              step >= 1 ? "bg-[var(--color-cs-brand)] text-white" : "bg-[#c8c6c4] text-white"
            }`}
          >
            1
          </span>
          <span className={step === 1 ? "font-medium text-[var(--color-cs-text)]" : ""}>
            Account type
          </span>
          <span className="mx-1 h-px w-6 bg-[#c8c6c4]" />
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium ${
              step >= 2 ? "bg-[var(--color-cs-brand)] text-white" : "bg-[#c8c6c4] text-white"
            }`}
          >
            2
          </span>
          <span className={step === 2 ? "font-medium text-[var(--color-cs-text)]" : ""}>
            Your info
          </span>
          <span className="mx-1 h-px w-6 bg-[#c8c6c4]" />
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium ${
              step >= 3 ? "bg-[var(--color-cs-brand)] text-white" : "bg-[#c8c6c4] text-white"
            }`}
          >
            3
          </span>
          <span className={step === 3 ? "font-medium text-[var(--color-cs-text)]" : ""}>Verify</span>
        </div>

        {step === 1 && (
          <>
            <h1 className="text-2xl font-medium text-[var(--color-cs-text)]">Create your account</h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-cs-text-secondary)]">
              Tell us how you&apos;ll be using CliffSense. This shapes your setup and the features
              you&apos;ll see.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {types.map((t) => {
                const Icon = t.icon;
                const selected = accountType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setAccountType(t.id)}
                    className={`rounded border bg-white p-3.5 text-left transition-colors ${
                      selected
                        ? "border-2 border-[var(--color-cs-brand)] bg-[#f5faff] p-[13px]"
                        : "border-[var(--color-cs-border)] hover:border-[var(--color-cs-brand)]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded ${toneBg[t.tone]}`}
                      >
                        <Icon size={18} stroke={1.5} aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-[var(--color-cs-text)]">{t.name}</div>
                        <p className="text-xs leading-snug text-[var(--color-cs-text-secondary)]">
                          {t.desc}
                        </p>
                      </div>
                      <span
                        className={`relative h-4 w-4 shrink-0 rounded-full border-[1.5px] ${
                          selected ? "border-[var(--color-cs-brand)]" : "border-[#c8c6c4]"
                        }`}
                        aria-hidden
                      >
                        {selected && (
                          <span className="absolute inset-[3px] rounded-full bg-[var(--color-cs-brand)]" />
                        )}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-[var(--color-cs-border)] pt-4">
              <p className="text-[13px] text-[var(--color-cs-text-secondary)]">
                Already have an account?{" "}
                <Link href="/auth/signin" className="text-[var(--color-cs-brand)]">
                  Sign in
                </Link>
              </p>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 rounded-sm bg-[var(--color-cs-brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--color-cs-brand-hover)]"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-2xl font-medium text-[var(--color-cs-text)]">Your details</h1>
            <p className="mt-1.5 text-[13px] text-[var(--color-cs-text-secondary)]">
              We&apos;ll use this on your dashboard and in alert emails.
            </p>
            <div className="mt-5 flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#323130]" htmlFor="name">
                  Full name
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8 w-full rounded-sm border border-[var(--color-cs-input-border)] border-b border-b-[var(--color-cs-input-bottom)] bg-white px-2.5 text-[13px] outline-none focus:border-[var(--color-cs-brand)] focus:border-b-2"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#323130]" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-8 w-full rounded-sm border border-[var(--color-cs-input-border)] border-b border-b-[var(--color-cs-input-bottom)] bg-white px-2.5 text-[13px] outline-none focus:border-[var(--color-cs-brand)] focus:border-b-2"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-[#323130]" htmlFor="password">
                  Password (min 8 characters)
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-8 w-full rounded-sm border border-[var(--color-cs-input-border)] border-b border-b-[var(--color-cs-input-bottom)] bg-white px-2.5 text-[13px] outline-none focus:border-[var(--color-cs-brand)] focus:border-b-2"
                  required
                  minLength={8}
                />
              </div>
              {error && <p className="text-xs text-[var(--color-cs-danger)]">{error}</p>}
            </div>
            <div className="mt-5 flex justify-between border-t border-[var(--color-cs-border)] pt-4">
              <button type="button" onClick={() => setStep(1)} className="text-sm text-[var(--color-cs-brand)]">
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!name || !email || password.length < 8}
                className="rounded-sm bg-[var(--color-cs-brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-2xl font-medium text-[var(--color-cs-text)]">Review & create</h1>
            <p className="mt-1.5 text-[13px] text-[var(--color-cs-text-secondary)]">
              You&apos;re almost done. We&apos;ll send threshold reminders to{" "}
              <strong>{email}</strong>.
            </p>
            <ul className="mt-4 space-y-2 rounded border border-[var(--color-cs-border)] bg-white p-4 text-[13px] text-[var(--color-cs-text-secondary)]">
              <li>
                <span className="text-[var(--color-cs-text-muted)]">Account type:</span>{" "}
                {types.find((t) => t.id === accountType)?.name}
              </li>
              <li>
                <span className="text-[var(--color-cs-text-muted)]">Name:</span> {name}
              </li>
            </ul>
            {error && <p className="mt-3 text-xs text-[var(--color-cs-danger)]">{error}</p>}
            <div className="mt-5 flex justify-between border-t border-[var(--color-cs-border)] pt-4">
              <button type="button" onClick={() => setStep(2)} className="text-sm text-[var(--color-cs-brand)]">
                Back
              </button>
              <button
                type="button"
                onClick={register}
                disabled={loading}
                className="rounded-sm bg-[var(--color-cs-brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-60"
              >
                {loading ? "Creating…" : "Create account"}
              </button>
            </div>
          </>
        )}
      </div>
    </AuthSplitLayout>
    </>
  );
}
