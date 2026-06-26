"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthLoadingOverlay } from "@/components/auth/auth-loading-overlay";
import {
  authLabelClass,
  authPrimaryButtonClass,
  authTextInputClass,
} from "@/components/auth/auth-field-classes";
import { AuthPageShell } from "@/components/layout/auth-page-shell";
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
  c: "bg-[var(--color-cs-warning-bg)] text-[var(--color-cs-warning)]",
  d: "bg-[var(--color-cs-danger-bg)] text-[var(--color-cs-danger)]",
};

const stepsMeta = [
  { n: 1 as const, label: "Account type" },
  { n: 2 as const, label: "Your info" },
  { n: 3 as const, label: "Verify" },
];

function SignupStepper({ step }: { step: 1 | 2 | 3 }) {
  return (
    <nav aria-label="Sign-up progress" className="mt-5">
      <ol className="flex items-center gap-1 sm:gap-2">
        {stepsMeta.map((s, i) => {
          const done = step > s.n;
          const active = step === s.n;
          return (
            <li key={s.n} className="flex min-w-0 flex-1 items-center last:flex-none">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums ${
                    done || active
                      ? "bg-[var(--color-cs-brand)] text-white shadow-[0_1px_0_rgba(0,0,0,0.12)]"
                      : "border border-[var(--color-cs-border)] bg-white text-[var(--color-cs-text-muted)]"
                  }`}
                  aria-current={active ? "step" : undefined}
                >
                  {done ? <IconCheck size={14} stroke={2.5} aria-hidden /> : s.n}
                </span>
                <span
                  className={`hidden min-w-0 truncate text-xs sm:inline ${
                    active ? "font-semibold text-[var(--color-cs-text)]" : "text-[var(--color-cs-text-secondary)]"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < stepsMeta.length - 1 ? (
                <span
                  className={`mx-1.5 h-px min-w-[8px] flex-1 sm:mx-2 sm:min-w-[20px] ${
                    step > s.n ? "bg-[var(--color-cs-brand)]/45" : "bg-[var(--color-cs-border)]"
                  }`}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

const stepHeadings: Record<1 | 2 | 3, { title: string; intro: React.ReactNode }> = {
  1: {
    title: "Create your account",
    intro:
      "Tell us how you’ll be using MyBenefitsPA. This shapes your setup and the features you’ll see first.",
  },
  2: {
    title: "Your details",
    intro: "We’ll use this on your dashboard and in alert emails.",
  },
  3: {
    title: "Review & create",
    intro: null,
  },
};

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [accountType, setAccountType] = useState<(typeof types)[number]["id"]>("beneficiary");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Step 3: create the account, which emails a 6-digit confirmation code. */
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
      setCodeSent(true);
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  /** Resend the confirmation code without recreating the account. */
  async function resendCode() {
    setError(null);
    setSendingCode(true);
    try {
      await fetch("/api/auth/login-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      setError("Could not resend the code. Please try again.");
    } finally {
      setSendingCode(false);
    }
  }

  /** Verify the emailed code; a valid code confirms the email and signs in. */
  async function verifyAndCreate() {
    setError(null);
    setLoading(true);
    try {
      const sign = await signIn("email-code", {
        email,
        code,
        redirect: false,
        callbackUrl: "/onboarding/profile",
      });
      if (sign?.error) {
        setError("That code is invalid or expired. Request a new one.");
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

  const heading = stepHeadings[step];

  return (
    <>
      {loading ? (
        <AuthLoadingOverlay
          title="Creating your account"
          subtitle="Securing your session and preparing your workspace…"
        />
      ) : null}
      <AuthPageShell width="lg">
        {/* ---------- Heading ---------- */}
        <header className="border-b border-[var(--color-cs-border)] pb-7">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-cs-accent-orange)]">
            Create account
          </p>
          <SignupStepper step={step} />
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-[var(--color-cs-navy)] sm:text-4xl">
            {heading.title}
          </h1>
          {heading.intro ? (
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-cs-text-secondary)]">
              {heading.intro}
            </p>
          ) : (
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-cs-text-secondary)]">
              You’re almost done. We’ll send threshold reminders to{" "}
              <span className="font-semibold text-[var(--color-cs-text)]">{email}</span>.
            </p>
          )}
        </header>

        {/* ---------- Form card ---------- */}
        <div className="mt-8 rounded-lg border border-[var(--color-cs-border)] bg-white p-6 sm:p-7">
          {step === 1 && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {types.map((t) => {
                  const Icon = t.icon;
                  const selected = accountType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setAccountType(t.id)}
                      className={`rounded-xl border bg-white p-4 text-left shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-[border-color,box-shadow] ${
                        selected
                          ? "border-2 border-[var(--color-cs-brand)] bg-[var(--color-cs-info-bg)] p-[15px] shadow-[0_1px_0_rgba(0,0,0,0.06)] ring-1 ring-[var(--color-cs-brand)]/15"
                          : "border-[var(--color-cs-border)] hover:border-[var(--color-cs-brand)]/55 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneBg[t.tone]}`}
                        >
                          <Icon size={20} stroke={1.5} aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-[var(--color-cs-text)]">{t.name}</div>
                          <p className="mt-0.5 text-xs leading-snug text-[var(--color-cs-text-secondary)]">{t.desc}</p>
                        </div>
                        <span
                          className={`relative mt-0.5 h-[18px] w-[18px] shrink-0 rounded-full border-2 ${
                            selected ? "border-[var(--color-cs-brand)]" : "border-[var(--color-cs-text-muted)]"
                          }`}
                          aria-hidden
                        >
                          {selected ? (
                            <span className="absolute inset-[3px] rounded-full bg-[var(--color-cs-brand)]" />
                          ) : null}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[var(--color-cs-border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[var(--color-cs-text-secondary)]">
                  Already have an account?{" "}
                  <Link href="/auth/signin" className="font-semibold text-[var(--color-cs-brand)] hover:underline">
                    Sign in
                  </Link>
                </p>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className={`${authPrimaryButtonClass} w-full sm:w-auto sm:min-w-[120px]`}
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className={authLabelClass} htmlFor="name">
                    Full name
                  </label>
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={authTextInputClass}
                    required
                    autoComplete="name"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={authLabelClass} htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={authTextInputClass}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={authLabelClass} htmlFor="password">
                    Password (at least 8 characters)
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={authTextInputClass}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                {error ? (
                  <p
                    className="rounded-xl border border-[var(--color-cs-danger)]/25 bg-[var(--color-cs-danger-bg)] px-3 py-2.5 text-xs font-medium text-[var(--color-cs-danger)]"
                    role="alert"
                  >
                    {error}
                  </p>
                ) : null}
              </div>
              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[var(--color-cs-border)] pt-6 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm font-semibold text-[var(--color-cs-brand)] hover:underline sm:self-center"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!name || !email || password.length < 8}
                  className={`${authPrimaryButtonClass} w-full sm:w-auto sm:min-w-[120px]`}
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 3 && !codeSent && (
            <>
              <ul className="space-y-0 overflow-hidden rounded-xl border border-[var(--color-cs-border)] bg-white text-sm shadow-[0_1px_0_rgba(0,0,0,0.04)]">
                <li className="flex justify-between gap-4 border-b border-[var(--color-cs-border)] px-4 py-3">
                  <span className="text-[var(--color-cs-text-muted)]">Account type</span>
                  <span className="font-medium text-[var(--color-cs-text)] text-right">
                    {types.find((t) => t.id === accountType)?.name}
                  </span>
                </li>
                <li className="flex justify-between gap-4 px-4 py-3">
                  <span className="text-[var(--color-cs-text-muted)]">Name</span>
                  <span className="max-w-[60%] truncate font-medium text-[var(--color-cs-text)] text-right">{name}</span>
                </li>
              </ul>
              {error ? (
                <p
                  className="mt-4 rounded-xl border border-[var(--color-cs-danger)]/25 bg-[var(--color-cs-danger-bg)] px-3 py-2.5 text-xs font-medium text-[var(--color-cs-danger)]"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
              <p className="mt-5 text-xs leading-relaxed text-[var(--color-cs-text-secondary)]">
                By creating an account you agree to our{" "}
                <Link href="/legal/terms" className="font-semibold text-[var(--color-cs-brand)] hover:underline">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/legal/privacy" className="font-semibold text-[var(--color-cs-brand)] hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[var(--color-cs-border)] pt-6 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-sm font-semibold text-[var(--color-cs-brand)] hover:underline sm:self-center"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={register}
                  disabled={loading}
                  className={`${authPrimaryButtonClass} w-full sm:w-auto sm:min-w-[160px]`}
                >
                  {loading ? "Sending code…" : "Create account"}
                </button>
              </div>
            </>
          )}

          {step === 3 && codeSent && (
            <>
              <p className="text-sm leading-relaxed text-[var(--color-cs-text-secondary)]">
                We emailed a 6-digit code to{" "}
                <span className="font-semibold text-[var(--color-cs-text)]">{email}</span>. Enter it
                below to confirm your email and finish creating your account.
              </p>
              <div className="mt-5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className={authLabelClass} htmlFor="signup-code">
                    6-digit code
                  </label>
                  <button
                    type="button"
                    onClick={resendCode}
                    disabled={sendingCode}
                    className="text-xs font-semibold text-[var(--color-cs-brand)] hover:underline disabled:opacity-50"
                  >
                    {sendingCode ? "Sending…" : "Resend"}
                  </button>
                </div>
                <input
                  id="signup-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className={`${authTextInputClass} tracking-[0.4em]`}
                />
              </div>
              {error ? (
                <p
                  className="mt-4 rounded-xl border border-[var(--color-cs-danger)]/25 bg-[var(--color-cs-danger-bg)] px-3 py-2.5 text-xs font-medium text-[var(--color-cs-danger)]"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[var(--color-cs-border)] pt-6 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setCodeSent(false);
                    setCode("");
                    setError(null);
                  }}
                  className="text-sm font-semibold text-[var(--color-cs-brand)] hover:underline sm:self-center"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={verifyAndCreate}
                  disabled={loading || code.length !== 6}
                  className={`${authPrimaryButtonClass} w-full sm:w-auto sm:min-w-[160px]`}
                >
                  {loading ? "Verifying…" : "Verify & continue"}
                </button>
              </div>
            </>
          )}
        </div>
      </AuthPageShell>
    </>
  );
}
