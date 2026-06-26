import type { ReactNode } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  IconAlertTriangle,
  IconBell,
  IconBuildingBank,
  IconChevronRight,
  IconCircleCheck,
  IconFileText,
  IconListDetails,
  IconLock,
  IconMessageCircle,
  IconRepeat,
  IconRocket,
  IconShieldLock,
  IconTarget,
  IconUsers,
} from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "Help & Guide · MyBenefitsPA",
  description:
    "Quick start, step-by-step how-tos, and details on how MyBenefitsPA tracks your benefit limits.",
};

/* ---------------------------------------------------------------------------
 * Help / user guide. A single, comprehensive reference: quick start, core
 * concepts, per-feature how-tos, how the income & asset math works, alerts,
 * privacy, an FAQ and a glossary. Static content — safe to render server-side.
 * ------------------------------------------------------------------------- */

const TOC: { id: string; label: string }[] = [
  { id: "quick-start", label: "Quick start" },
  { id: "concepts", label: "Core concepts" },
  { id: "connect-bank", label: "Connect a bank" },
  { id: "transactions", label: "Categorize activity" },
  { id: "recurring", label: "Recurring income" },
  { id: "limits", label: "Limits" },
  { id: "math", label: "How the numbers work" },
  { id: "dashboard", label: "Dashboard & what-if" },
  { id: "alerts", label: "Alerts & notifications" },
  { id: "docs", label: "Reports, Exports & Vault" },
  { id: "advisor", label: "Advisor" },
  { id: "sharing", label: "Beneficiaries & sharing" },
  { id: "faq", label: "FAQ" },
  { id: "glossary", label: "Glossary" },
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

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-cs-brand)] text-[12px] font-bold text-white">
            {i + 1}
          </span>
          <div className="pt-0.5">{item}</div>
        </li>
      ))}
    </ol>
  );
}

function Tip({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] px-4 py-3 text-[13px] text-[var(--color-cs-text-secondary)]">
      {children}
    </div>
  );
}

function Term({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[14px] font-semibold text-[var(--color-cs-text)]">{name}</dt>
      <dd className="mt-0.5 text-[14px] leading-relaxed text-[var(--color-cs-text-secondary)]">
        {children}
      </dd>
    </div>
  );
}

const linkCls = "font-semibold text-[var(--color-cs-brand)] hover:underline";

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl pb-10">
      {/* Hero */}
      <div className="mb-1 text-xs font-medium text-[var(--color-cs-text-secondary)]">
        Help › Guide
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-cs-text)] sm:text-3xl">
        Help &amp; Guide
      </h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--color-cs-text-secondary)]">
        MyBenefitsPA links your bank activity to your benefit programs and gives you a calm,
        early heads-up before you approach an income or asset limit. Here&apos;s how to set it up
        and get the most from it.
      </p>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-[var(--color-cs-warning)]/30 bg-[var(--color-cs-warning-bg)] px-4 py-3 text-[13px] text-[var(--color-cs-text)]">
        <IconAlertTriangle size={18} stroke={1.8} className="mt-0.5 shrink-0 text-[var(--color-cs-warning)]" aria-hidden />
        <p>
          <span className="font-semibold">Informational only.</span> Everything here is an estimate
          to help you stay aware — not a determination of eligibility, and not legal, tax, or
          benefits advice. Always confirm with SSA, your county assistance office, or a qualified
          benefits counselor before acting.
        </p>
      </div>

      {/* Table of contents */}
      <nav className="cs-card mt-6 p-5" aria-label="On this page">
        <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[var(--color-cs-text-muted)]">
          On this page
        </h2>
        <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {TOC.map((t) => (
            <li key={t.id}>
              <a
                href={`#${t.id}`}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[14px] font-medium text-[var(--color-cs-text-secondary)] hover:bg-[var(--color-cs-nav-hover)] hover:text-[var(--color-cs-brand)]"
              >
                <IconChevronRight size={14} stroke={2} aria-hidden className="text-[var(--color-cs-text-muted)]" />
                {t.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6 space-y-5">
        {/* QUICK START */}
        <Section id="quick-start" icon={<IconRocket size={18} stroke={1.8} />} title="Quick start">
          <p>Five steps take you from sign-up to a live dashboard, usually under ten minutes.</p>
          <Steps
            items={[
              <>
                <span className="font-semibold text-[var(--color-cs-text)]">Create your profile.</span>{" "}
                Tell us your state and household size — limits and rules vary by both.
              </>,
              <>
                <span className="font-semibold text-[var(--color-cs-text)]">Add the beneficiary.</span>{" "}
                The person whose benefits you&apos;re tracking (this may be you).
              </>,
              <>
                <span className="font-semibold text-[var(--color-cs-text)]">Confirm enrolled programs.</span>{" "}
                Pick the programs in play (SNAP, Medicaid, SSI/SSDI, etc.). This decides which limits appear.
              </>,
              <>
                <span className="font-semibold text-[var(--color-cs-text)]">Connect a bank.</span>{" "}
                Securely link accounts through Plaid so deposits and balances can be read (read-only).
              </>,
              <>
                <span className="font-semibold text-[var(--color-cs-text)]">Turn on notifications.</span>{" "}
                Choose email digests and/or push alerts, then open your{" "}
                <Link href="/dashboard" className={linkCls}>dashboard</Link>.
              </>,
            ]}
          />
          <Tip>
            Already set up but the dashboard looks empty? Make sure at least one bank is{" "}
            <Link href="/transactions" className={linkCls}>connected</Link> and your{" "}
            <Link href="/thresholds" className={linkCls}>programs</Link> are confirmed — limits only
            appear once both are in place.
          </Tip>
        </Section>

        {/* CONCEPTS */}
        <Section id="concepts" icon={<IconCircleCheck size={18} stroke={1.8} />} title="Core concepts">
          <p>A few ideas make the whole app click:</p>
          <dl className="space-y-3">
            <Term name="Beneficiary">
              The person whose benefits are being tracked. All limits, deposits, and alerts belong to
              a beneficiary. You can manage more than one and{" "}
              <Link href="/beneficiaries" className={linkCls}>share access</Link> with a family member
              or representative.
            </Term>
            <Term name="Program">
              A benefit you&apos;re enrolled in (SNAP, Medicaid/Waiver, SSI, SSDI, QMB…). Programs
              determine which limits load.
            </Term>
            <Term name="Limit (threshold)">
              A dollar line a program watches — a monthly income cap or an asset/resource cap.
              MyBenefitsPA compares your estimated activity to each one.
            </Term>
            <Term name="Estimate, not a decision">
              Numbers are estimated from your categorized bank activity. Real eligibility involves
              exclusions and rules we don&apos;t fully model — treat every figure as a prompt to check,
              never a verdict.
            </Term>
          </dl>
        </Section>

        {/* CONNECT BANK */}
        <Section id="connect-bank" icon={<IconBuildingBank size={18} stroke={1.8} />} title="Connect a bank">
          <Steps
            items={[
              <>Go to <Link href="/transactions" className={linkCls}>Money</Link> and choose <span className="font-semibold text-[var(--color-cs-text)]">Connect bank</span>.</>,
              <>Find your bank and sign in <span className="font-semibold text-[var(--color-cs-text)]">on Plaid&apos;s secure screen</span>. MyBenefitsPA never sees your banking username or password.</>,
              <>Pick the checking/savings accounts to link. Deposits and balances begin importing within a minute or two.</>,
              <>Return to <Link href="/transactions" className={linkCls}>Banking</Link> to review and categorize the imported activity.</>,
            ]}
          />
          <p>
            Connections sync automatically every day. You can add more banks any time, or disconnect
            one from <Link href="/transactions" className={linkCls}>Money</Link>.
          </p>
          <Tip>
            <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-cs-text)]">
              <IconLock size={14} stroke={1.8} aria-hidden /> Access is read-only.
            </span>{" "}
            MyBenefitsPA can see transactions and balances to do the math — it can never move money.
            Access tokens are encrypted at rest.
          </Tip>
        </Section>

        {/* TRANSACTIONS */}
        <Section id="transactions" icon={<IconListDetails size={18} stroke={1.8} />} title="Categorize activity">
          <p>
            Income estimates are only as good as your categories, so the{" "}
            <Link href="/transactions" className={linkCls}>Banking</Link> screen lets you confirm how
            each deposit is counted. Most rows are auto-categorized from the bank&apos;s data; review
            anything marked <span className="font-semibold text-[var(--color-cs-text)]">Unclear</span>.
          </p>
          <ul className="space-y-2">
            <li><span className="font-semibold text-[var(--color-cs-text)]">Earned income</span> — wages, salary, commission, bonus. Counted toward income limits (grossed up to pre-tax — see below).</li>
            <li><span className="font-semibold text-[var(--color-cs-text)]">Benefit deposit</span> — SSDI, Social Security, disability, unemployment, pension, child support. Unearned income.</li>
            <li><span className="font-semibold text-[var(--color-cs-text)]">Other income</span> — interest, dividends, refunds.</li>
            <li><span className="font-semibold text-[var(--color-cs-text)]">Expense</span> — money going out. Not income.</li>
            <li><span className="font-semibold text-[var(--color-cs-text)]">Transfer</span> — moves between your own accounts. Excluded so it never double-counts.</li>
            <li><span className="font-semibold text-[var(--color-cs-text)]">Unclear</span> — needs your review; not counted until you set it.</li>
          </ul>
          <Tip>
            To stop a one-off deposit (a gift, a reimbursement) from counting, set it to{" "}
            <span className="font-semibold text-[var(--color-cs-text)]">Transfer</span> or mark it
            excluded. Your edits stick and teach future auto-categorization.
          </Tip>
        </Section>

        {/* RECURRING */}
        <Section id="recurring" icon={<IconRepeat size={18} stroke={1.8} />} title="Recurring income">
          <p>
            The <Link href="/recurring" className={linkCls}>Recurring</Link> screen detects repeating
            deposits like a paycheck or monthly benefit. Confirm a stream and MyBenefitsPA can{" "}
            <span className="font-semibold text-[var(--color-cs-text)]">project the rest of the month</span>{" "}
            — so you get a heads-up before a limit is crossed, not after.
          </p>
          <Steps
            items={[
              <>Open <Link href="/recurring" className={linkCls}>Recurring</Link> and review detected streams.</>,
              <>Confirm the ones that are real income and set the right category and frequency.</>,
              <>Exclude anything that shouldn&apos;t count toward limits.</>,
            ]}
          />
        </Section>

        {/* LIMITS */}
        <Section id="limits" icon={<IconTarget size={18} stroke={1.8} />} title="Limits">
          <p>
            <Link href="/thresholds" className={linkCls}>Limits</Link> lists the reference limits for
            your enrolled programs, plus any you add yourself. Each shows its dollar cap, source, and
            current status.
          </p>
          <ul className="space-y-2">
            <li><span className="font-semibold text-[var(--color-cs-text)]">Attach / detach</span> — turn a system limit on or off for your situation. Detached limits aren&apos;t evaluated and won&apos;t alert.</li>
            <li><span className="font-semibold text-[var(--color-cs-text)]">Add a custom limit</span> — track a monthly-earned-income or asset cap that isn&apos;t bundled.</li>
            <li><span className="font-semibold text-[var(--color-cs-text)]">Warn level</span> — each limit has a warning line (default 85–90%) that triggers a heads-up before the hard cap.</li>
          </ul>
        </Section>

        {/* MATH */}
        <Section id="math" icon={<IconTarget size={18} stroke={1.8} />} title="How the numbers work">
          <p>Three estimates drive every bar and alert:</p>
          <dl className="space-y-3">
            <Term name="Earned income (gross)">
              Your bank shows take-home pay, but programs count pre-tax gross. We gross wages up by a
              PA factor (≈ 1.13: FICA + state + local tax) so the comparison is apples-to-apples.
              Benefit deposits already arrive at gross, so they aren&apos;t adjusted.
            </Term>
            <Term name="Gross monthly income (SNAP)">
              All countable income for the month — grossed-up wages plus benefit and other income.
              SNAP&apos;s test uses this with no disregards.
            </Term>
            <Term name="Countable income (Medicaid/SSI-style)">
              For ABD Medicaid, QMB, and Waiver limits we apply the standard disregards: the $20
              general exclusion, the $65 earned-income exclusion, then half of the remaining earned
              income.
            </Term>
            <Term name="Asset balance">
              The highest current balance across your linked checking/savings accounts, compared to
              each program&apos;s resource limit.
            </Term>
          </dl>
          <Tip>
            <span className="font-semibold text-[var(--color-cs-text)]">What we don&apos;t model:</span>{" "}
            asset exclusions (a home, one car, ABLE/Special-Needs-Trust balances) and the DAC income
            exclusion. So a resource bar may read high even when your countable resources are within
            limits. Use it as a flag to verify, not a final answer.
          </Tip>
        </Section>

        {/* DASHBOARD */}
        <Section id="dashboard" icon={<IconCircleCheck size={18} stroke={1.8} />} title="Dashboard & what-if">
          <p>
            Your <Link href="/dashboard" className={linkCls}>dashboard</Link> shows each evaluable
            limit as a bar — where you sit today against the warning line and hard cap — plus this
            month at a glance, recent alerts, and connected accounts.
          </p>
          <p>
            The <span className="font-semibold text-[var(--color-cs-text)]">what-if sliders</span> let
            you model a change — a raise, or a bigger savings balance — and watch every bar and status
            react live. Your real data never changes; it&apos;s a sandbox. Hit{" "}
            <span className="font-semibold text-[var(--color-cs-text)]">Reset</span> to clear it.
          </p>
        </Section>

        {/* ALERTS */}
        <Section id="alerts" icon={<IconBell size={18} stroke={1.8} />} title="Alerts & notifications">
          <p>When activity approaches or crosses a limit, MyBenefitsPA raises an alert:</p>
          <ul className="space-y-2">
            <li><span className="font-semibold text-[var(--color-cs-text)]">Watch</span> — you&apos;ve reached a limit&apos;s warning line, or a projection suggests you&apos;ll approach it by month-end.</li>
            <li><span className="font-semibold text-[var(--color-cs-text)]">Over limit</span> — current activity meets or exceeds the cap.</li>
          </ul>
          <p>You can receive them three ways:</p>
          <ul className="space-y-2">
            <li><span className="font-semibold text-[var(--color-cs-text)]">In-app</span> — the bell and the <Link href="/alerts" className={linkCls}>Alerts</Link> page; acknowledge or resolve each one.</li>
            <li><span className="font-semibold text-[var(--color-cs-text)]">Email</span> — a real-time note on a breach, plus optional daily or weekly digests.</li>
            <li><span className="font-semibold text-[var(--color-cs-text)]">Push</span> — install the app to your home screen and enable push in <Link href="/settings" className={linkCls}>Settings</Link>.</li>
          </ul>
          <Tip>
            Repeat alerts are de-duplicated, so you won&apos;t be pinged for the same issue every sync —
            only when something changes or escalates.
          </Tip>
        </Section>

        {/* DOCS */}
        <Section id="docs" icon={<IconFileText size={18} stroke={1.8} />} title="Reports, Exports & Vault">
          <ul className="space-y-2">
            <li><span className="font-semibold text-[var(--color-cs-text)]"><Link href="/documents" className={linkCls}>Reports &amp; Docs</Link></span> — summaries you can review or hand to a counselor.</li>
            <li><span className="font-semibold text-[var(--color-cs-text)]"><Link href="/reports" className={linkCls}>Exports</Link></span> — download your activity and limit history (e.g. for a redetermination packet).</li>
            <li><span className="font-semibold text-[var(--color-cs-text)]"><Link href="/vault" className={linkCls}>Vault</Link></span> — securely store award letters, verifications, and other benefit paperwork in one place.</li>
          </ul>
        </Section>

        {/* ADVISOR */}
        <Section id="advisor" icon={<IconMessageCircle size={18} stroke={1.8} />} title="Advisor">
          <p>
            The <Link href="/advisor" className={linkCls}>Advisor</Link> answers plain-language
            questions about your situation — &ldquo;what happens if I pick up extra shifts?&rdquo; — using
            your limits and activity for context. It&apos;s a helper, not a caseworker: confirm anything
            consequential with an official source.
          </p>
        </Section>

        {/* SHARING */}
        <Section id="sharing" icon={<IconUsers size={18} stroke={1.8} />} title="Beneficiaries & sharing">
          <p>
            Managing benefits for a family member? From{" "}
            <Link href="/beneficiaries" className={linkCls}>Beneficiaries</Link> you can invite someone
            to view or help manage a beneficiary&apos;s information. Invites are sent by email and access
            can be revoked at any time.
          </p>
        </Section>

        {/* FAQ */}
        <Section id="faq" icon={<IconCircleCheck size={18} stroke={1.8} />} title="FAQ">
          <dl className="space-y-3">
            <Term name="Will MyBenefitsPA report my income to anyone?">
              No. It&apos;s a private tool for you. Nothing is shared with SSA, your county office, or any
              agency. You decide what to do with the information.
            </Term>
            <Term name="My balance shows &lsquo;over limit&rsquo; — am I losing benefits?">
              Not necessarily. The asset bar uses your raw bank balance and doesn&apos;t subtract excluded
              resources (home, a car, ABLE/SNT). Treat it as a reminder to review with a counselor.
            </Term>
            <Term name="Why is my income $0 when I have deposits?">
              Deposits only count once they&apos;re categorized as income. Check{" "}
              <Link href="/transactions" className={linkCls}>Banking</Link> for rows marked Unclear or
              Transfer.
            </Term>
            <Term name="Is my banking login safe?">
              Yes — you sign in on Plaid&apos;s screen, not ours. We never receive your credentials, access
              is read-only, and stored tokens are encrypted.
            </Term>
            <Term name="How often does data update?">
              Connections sync automatically every day; you can also review and re-categorize any time.
            </Term>
          </dl>
        </Section>

        {/* GLOSSARY */}
        <Section id="glossary" icon={<IconShieldLock size={18} stroke={1.8} />} title="Glossary">
          <dl className="space-y-3">
            <Term name="Gross income">Income before taxes and withholding — what most programs count.</Term>
            <Term name="Countable income">Income remaining after a program&apos;s disregards/exclusions are applied.</Term>
            <Term name="Resource / asset limit">A cap on countable savings and resources (excludes a home, a car, ABLE/SNT, etc.).</Term>
            <Term name="SGA (Substantial Gainful Activity)">A monthly gross-earnings line used by SSDI.</Term>
            <Term name="QMB">A Medicare Savings Program that helps pay Medicare premiums and cost-sharing.</Term>
            <Term name="Waiver (HCBS / CHC)">Home- and community-based Medicaid that can confer full coverage above standard income limits.</Term>
            <Term name="Plaid">The secure service that links your bank so balances and deposits can be read.</Term>
          </dl>
        </Section>
      </div>

      {/* Footer / contact */}
      <div className="cs-card mt-6 flex flex-col items-start gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-[var(--color-cs-text-secondary)]">
          Still stuck? We&apos;re happy to help.
        </p>
        <a href="mailto:support@mybenefitspa.com" className="cs-btn cs-btn-primary">
          Contact support
        </a>
      </div>
      <p className="mt-4 text-[12px] leading-relaxed text-[var(--color-cs-text-muted)]">
        MyBenefitsPA is an informational tool, not legal, tax, or benefits advice, and not a
        determination of eligibility. See our{" "}
        <Link href="/legal/privacy" className="underline hover:text-[var(--color-cs-text-secondary)]">Privacy Policy</Link>,{" "}
        <Link href="/legal/terms" className="underline hover:text-[var(--color-cs-text-secondary)]">Terms</Link>, and{" "}
        <Link href="/legal/security" className="underline hover:text-[var(--color-cs-text-secondary)]">Security</Link> pages.
      </p>
    </div>
  );
}
