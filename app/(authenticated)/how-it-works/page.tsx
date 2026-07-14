import type { ReactNode } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  IconAlertTriangle,
  IconArrowDown,
  IconBell,
  IconBrain,
  IconBuildingBank,
  IconCalculator,
  IconListDetails,
  IconLock,
  IconMessageCircle,
  IconShieldLock,
  IconTarget,
  IconTrendingUp,
} from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "How it works · MyBenefitsPA",
  description:
    "A look under the hood: how MyBenefitsPA turns raw bank activity into income estimates, limit checks, and early alerts.",
};

/* ---------------------------------------------------------------------------
 * How it works — the "brain" of the system. Where the Help page teaches how to
 * *use* the app, this page explains the pipeline that runs behind it: how raw
 * bank data becomes categorized activity, estimates, projections, limit
 * evaluations and alerts. Static content — safe to render server-side.
 * ------------------------------------------------------------------------- */

const linkCls = "font-semibold text-[var(--color-cs-brand)] hover:underline";

/** One stage in the pipeline diagram at the top of the page. */
const PIPELINE: { icon: ReactNode; label: string; blurb: string }[] = [
  { icon: <IconBuildingBank size={18} stroke={1.8} />, label: "Ingest", blurb: "Read balances & deposits from your bank" },
  { icon: <IconListDetails size={18} stroke={1.8} />, label: "Understand", blurb: "Categorize each transaction" },
  { icon: <IconCalculator size={18} stroke={1.8} />, label: "Estimate", blurb: "Compute countable income & assets" },
  { icon: <IconTrendingUp size={18} stroke={1.8} />, label: "Project", blurb: "Forecast the rest of the month" },
  { icon: <IconTarget size={18} stroke={1.8} />, label: "Evaluate", blurb: "Compare against every limit" },
  { icon: <IconBell size={18} stroke={1.8} />, label: "Alert", blurb: "Warn you before a cap is crossed" },
];

function Section({
  id,
  icon,
  title,
  children,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="cs-card scroll-mt-20 p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-cs-info-bg)] text-[var(--color-cs-brand)]">
          {icon}
        </span>
        <h2 className="text-lg font-bold tracking-tight text-[var(--color-cs-text)]">{title}</h2>
      </div>
      <div className="space-y-3 text-[14px] leading-relaxed text-[var(--color-cs-text-secondary)]">
        {children}
      </div>
    </section>
  );
}

function Tip({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] px-4 py-3 text-[13px] text-[var(--color-cs-text-secondary)]">
      {children}
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl pb-10">
      {/* Hero */}
      <div className="mb-1 text-xs font-medium text-[var(--color-cs-text-secondary)]">
        Help › How it works
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-cs-text)] sm:text-3xl">
        How it works
      </h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--color-cs-text-secondary)]">
        A look inside the brain of MyBenefitsPA. Every bar, status, and alert you see is the end of
        a six-stage pipeline that turns raw bank activity into a plain-English picture of where you
        stand against each benefit limit. Here&apos;s each stage, in order.
      </p>

      {/* Pipeline diagram */}
      <div className="cs-card mt-6 p-5 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-[var(--color-cs-text-muted)]">
          <IconBrain size={16} stroke={1.9} aria-hidden className="text-[var(--color-cs-brand)]" />
          The pipeline
        </h2>
        <ol className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-0">
          {PIPELINE.map((stage, i) => (
            <li key={stage.label} className="flex items-stretch sm:flex-1">
              <a
                href={`#stage-${i + 1}`}
                className="flex flex-1 flex-col items-center gap-1.5 rounded-xl border border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] px-2.5 py-3 text-center transition-colors hover:border-[var(--color-cs-brand)] hover:bg-[var(--color-cs-nav-hover)]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-cs-card)] text-[var(--color-cs-brand)]">
                  {stage.icon}
                </span>
                <span className="text-[12px] font-bold text-[var(--color-cs-text)]">{stage.label}</span>
                <span className="text-[11px] leading-snug text-[var(--color-cs-text-secondary)]">{stage.blurb}</span>
              </a>
              {i < PIPELINE.length - 1 && (
                <span
                  aria-hidden
                  className="flex items-center justify-center self-center px-1 text-[var(--color-cs-text-muted)]"
                >
                  {/* Down arrow stacked on mobile, sits between cards on desktop */}
                  <IconArrowDown size={16} stroke={2} className="rotate-0 sm:-rotate-90" />
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-[var(--color-cs-warning)]/30 bg-[var(--color-cs-warning-bg)] px-4 py-3 text-[13px] text-[var(--color-cs-text)]">
        <IconAlertTriangle size={18} stroke={1.8} className="mt-0.5 shrink-0 text-[var(--color-cs-warning)]" aria-hidden />
        <p>
          <span className="font-semibold">Everything here produces an estimate.</span> The pipeline
          is built to flag things worth checking — not to decide your eligibility. Real
          determinations involve exclusions and rules we don&apos;t fully model. Always confirm with
          SSA, your county assistance office, or a benefits counselor.
        </p>
      </div>

      <div className="mt-6 space-y-5">
        {/* 1 — INGEST */}
        <Section id="stage-1" icon={<IconBuildingBank size={18} stroke={1.8} />} title="1 · Ingest — reading your bank">
          <p>
            Everything starts with the accounts you link on the{" "}
            <Link href="/transactions" className={linkCls}>Money</Link> screen. The connection runs
            through <span className="font-semibold text-[var(--color-cs-text)]">Plaid</span>, a secure
            service that hands us a read-only feed of your deposits, withdrawals, and current
            balances — never your banking login.
          </p>
          <p>
            Each linked connection syncs automatically every day, pulling in new transactions and
            refreshed balances. That raw feed is the only fuel the rest of the pipeline runs on:
            nothing is estimated for an account you haven&apos;t connected.
          </p>
          <Tip>
            <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-cs-text)]">
              <IconLock size={14} stroke={1.8} aria-hidden /> Read-only, encrypted.
            </span>{" "}
            The brain can see money to do the math — it can never move it. Access tokens are
            encrypted at rest.
          </Tip>
        </Section>

        {/* 2 — UNDERSTAND */}
        <Section id="stage-2" icon={<IconListDetails size={18} stroke={1.8} />} title="2 · Understand — categorizing activity">
          <p>
            Raw transactions don&apos;t know what they mean, so the next stage labels each one. Using
            the bank&apos;s description and category data, every deposit is sorted into a type that
            decides how — or whether — it counts:
          </p>
          <ul className="space-y-2">
            <li><span className="font-semibold text-[var(--color-cs-text)]">Earned income</span> — wages and salary. Counts toward income limits (and gets grossed up in the next stage).</li>
            <li><span className="font-semibold text-[var(--color-cs-text)]">Benefit / other income</span> — SSDI, unemployment, pensions, interest. Counts as unearned income.</li>
            <li><span className="font-semibold text-[var(--color-cs-text)]">Expense &amp; transfer</span> — money out, or moves between your own accounts. Excluded so nothing double-counts.</li>
            <li><span className="font-semibold text-[var(--color-cs-text)]">Unclear</span> — the brain isn&apos;t confident, so it waits for you rather than guessing wrong.</li>
          </ul>
          <p>
            When you correct a category on the{" "}
            <Link href="/transactions" className={linkCls}>Banking</Link> screen, that decision
            sticks and steers how similar deposits are auto-categorized later — the system learns
            your money.
          </p>
        </Section>

        {/* 3 — ESTIMATE */}
        <Section id="stage-3" icon={<IconCalculator size={18} stroke={1.8} />} title="3 · Estimate — turning activity into numbers">
          <p>
            Now the categorized activity becomes the handful of figures programs actually test
            against. This is where most of the real work happens:
          </p>
          <ul className="space-y-2">
            <li>
              <span className="font-semibold text-[var(--color-cs-text)]">Gross-up.</span> Your bank
              shows take-home pay, but programs count pre-tax gross. Wages are scaled up by a PA
              factor (≈ 1.13 for FICA, state, and local tax). Benefit deposits already arrive gross,
              so they&apos;re left alone.
            </li>
            <li>
              <span className="font-semibold text-[var(--color-cs-text)]">Disregards.</span> For
              Medicaid/SSI-style limits the brain applies the standard exclusions — the $20 general
              and $65 earned-income exclusions, then half of the remaining earned income — to get
              countable income. SNAP&apos;s gross test skips these.
            </li>
            <li>
              <span className="font-semibold text-[var(--color-cs-text)]">Assets.</span> Your highest
              current balance across linked checking/savings accounts becomes the asset figure that
              resource limits are measured against.
            </li>
          </ul>
          <Tip>
            <span className="font-semibold text-[var(--color-cs-text)]">What it doesn&apos;t model:</span>{" "}
            asset exclusions (a home, one car, ABLE/SNT balances) and the DAC exclusion. That&apos;s
            why an asset bar can read high even when your countable resources are fine — read it as a
            flag, not a verdict.
          </Tip>
        </Section>

        {/* 4 — PROJECT */}
        <Section id="stage-4" icon={<IconTrendingUp size={18} stroke={1.8} />} title="4 · Project — forecasting the month">
          <p>
            A limit crossed on the 28th is little use if you only hear about it in the next
            statement. So the brain looks at your{" "}
            <Link href="/recurring" className={linkCls}>recurring</Link> income — a paycheck, a
            monthly benefit — and projects the rest of the current month from streams you&apos;ve
            confirmed.
          </p>
          <p>
            That projection is what lets an alert say &ldquo;at this rate you&apos;ll approach the SNAP
            limit by month-end,&rdquo; giving you room to act <span className="font-semibold text-[var(--color-cs-text)]">before</span>{" "}
            a cap is crossed rather than after.
          </p>
        </Section>

        {/* 5 — EVALUATE */}
        <Section id="stage-5" icon={<IconTarget size={18} stroke={1.8} />} title="5 · Evaluate — checking every limit">
          <p>
            With estimates and projections in hand, the brain compares them against each limit that
            applies to you. Which limits load is driven by your enrolled{" "}
            <Link href="/thresholds" className={linkCls}>programs</Link> plus any custom caps you add;
            a limit you&apos;ve detached is simply skipped.
          </p>
          <p>Each evaluated limit lands in one of three states:</p>
          <ul className="space-y-2">
            <li><span className="font-semibold text-[var(--color-cs-text)]">Clear</span> — comfortably under the warning line.</li>
            <li><span className="font-semibold text-[var(--color-cs-text)]">Watch</span> — past the warning line (default 85–90% of the cap), or projected to approach it.</li>
            <li><span className="font-semibold text-[var(--color-cs-text)]">Over limit</span> — current or projected activity meets or exceeds the cap.</li>
          </ul>
          <p>
            This is exactly what the bars on your{" "}
            <Link href="/dashboard" className={linkCls}>dashboard</Link> visualize — and what the
            what-if sliders re-run live when you model a change.
          </p>
        </Section>

        {/* 6 — ALERT */}
        <Section id="stage-6" icon={<IconBell size={18} stroke={1.8} />} title="6 · Alert — telling you at the right moment">
          <p>
            When a limit moves into Watch or Over, the final stage raises an{" "}
            <Link href="/alerts" className={linkCls}>alert</Link>. Crucially, it de-duplicates:
            you&apos;re pinged when something <span className="font-semibold text-[var(--color-cs-text)]">changes or escalates</span>,
            not for the same issue on every daily sync.
          </p>
          <p>Alerts reach you three ways, each configurable in <Link href="/settings" className={linkCls}>Settings</Link>:</p>
          <ul className="space-y-2">
            <li><span className="font-semibold text-[var(--color-cs-text)]">In-app</span> — the bell and the Alerts page.</li>
            <li><span className="font-semibold text-[var(--color-cs-text)]">Email</span> — a real-time note on a breach, plus optional digests.</li>
            <li><span className="font-semibold text-[var(--color-cs-text)]">Push</span> — once you install the app to your home screen.</li>
          </ul>
        </Section>

        {/* ADVISOR */}
        <Section id="advisor" icon={<IconMessageCircle size={18} stroke={1.8} />} title="Where the Advisor fits in">
          <p>
            The <Link href="/advisor" className={linkCls}>Advisor</Link> sits on top of this whole
            pipeline. When you ask a plain-language question — &ldquo;what if I pick up extra
            shifts?&rdquo; — it reads the same estimates, projections, and limit states the pipeline
            produced and answers in context. It&apos;s a helper drawing on your real numbers, not a
            caseworker: confirm anything consequential with an official source.
          </p>
        </Section>

        {/* PRIVACY */}
        <Section id="privacy" icon={<IconShieldLock size={18} stroke={1.8} />} title="Your data stays yours">
          <p>
            The brain runs for you and only you. Nothing it computes is shared with SSA, your county
            office, or any agency — there is no reporting path out. Bank access is read-only, stored
            tokens are encrypted, and you decide what to do with what you learn.
          </p>
          <p>
            Want the step-by-step version of setting all this up? The{" "}
            <Link href="/help" className={linkCls}>Help &amp; Guide</Link> walks through each screen.
          </p>
        </Section>
      </div>

      <p className="mt-6 text-[12px] leading-relaxed text-[var(--color-cs-text-muted)]">
        MyBenefitsPA is an informational tool, not legal, tax, or benefits advice, and not a
        determination of eligibility. See our{" "}
        <Link href="/legal/privacy" className="underline hover:text-[var(--color-cs-text-secondary)]">Privacy Policy</Link>,{" "}
        <Link href="/legal/terms" className="underline hover:text-[var(--color-cs-text-secondary)]">Terms</Link>, and{" "}
        <Link href="/legal/security" className="underline hover:text-[var(--color-cs-text-secondary)]">Security</Link> pages.
      </p>
    </div>
  );
}
