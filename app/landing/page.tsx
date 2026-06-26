import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";
import type { Metadata } from "next";
import {
  IconArrowRight,
  IconBell,
  IconBuildingBank,
  IconCalendarEvent,
  IconFileText,
  IconFolder,
  IconLock,
  IconMessageCircle,
  IconShieldCheck,
  IconShieldLock,
  IconSparkles,
  IconTarget,
  IconWallet,
} from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "MyBenefitsPA — Your benefits, all in one place",
  description:
    "One place for your money, your limits, your reporting deadlines, and your benefit paperwork — instead of spreadsheets, sticky notes, and guesswork.",
};

/* ----------------------------------------------------------------------------
 * Landing page — layout rhythm modeled on a modern all-in-one product site
 * (big hero + framed product shot → module cards → dark automation/advisor
 * section → dark connected section → multi-column footer), built with the
 * MyBenefitsPA palette and the shared cs- design tokens. Server component.
 * ------------------------------------------------------------------------- */

type Icon = ComponentType<{ size?: number; stroke?: number; className?: string }>;

/** A framed product screenshot — soft card with a generous shadow. */
function Shot({
  src,
  alt,
  priority = false,
  sizes = "(min-width: 1024px) 1024px, 100vw",
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-cs-border)] bg-white shadow-[0_30px_70px_-32px_rgba(15,27,51,0.45)]">
      <Image
        src={src}
        alt={alt}
        width={2880}
        height={1800}
        priority={priority}
        sizes={sizes}
        className="block h-auto w-full"
      />
    </div>
  );
}

/** One "module" card in the showcase row — a tall gradient panel with a label
 *  and a strip of feature pills, echoing a connected-suite product grid. */
function ModuleCard({
  icon: Icon,
  label,
  gradient,
  pills,
  featured = false,
}: {
  icon: Icon;
  label: string;
  gradient: string;
  pills: string[];
  featured?: boolean;
}) {
  return (
    <div
      className={`relative flex h-[340px] w-[260px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-3xl p-5 text-white ${gradient} ${
        featured ? "ring-2 ring-[var(--color-cs-navy)] ring-offset-2" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-bold">{label}</span>
        <Icon size={22} stroke={1.8} className="opacity-90" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {pills.map((p) => (
          <span
            key={p}
            className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm"
          >
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}

const MODULES: {
  icon: Icon;
  label: string;
  gradient: string;
  pills: string[];
  featured?: boolean;
}[] = [
  {
    icon: IconWallet,
    label: "Money",
    gradient: "bg-gradient-to-br from-[#4b63f0] to-[#7186f6]",
    pills: ["Accounts", "Income", "Expenses"],
  },
  {
    icon: IconTarget,
    label: "Limits",
    gradient: "bg-gradient-to-br from-[#0f1b33] to-[#2a3a5e]",
    pills: ["SSI", "SNAP", "Medicaid", "ABLE"],
    featured: true,
  },
  {
    icon: IconBell,
    label: "Alerts",
    gradient: "bg-gradient-to-br from-[#f2994a] to-[#f6b06f]",
    pills: ["Predictive", "Breach", "Email"],
  },
  {
    icon: IconCalendarEvent,
    label: "Calendar",
    gradient: "bg-gradient-to-br from-[#2fb37b] to-[#56c596]",
    pills: ["Deadlines", "SAR", "Renewals"],
  },
  {
    icon: IconFileText,
    label: "Paperwork",
    gradient: "bg-gradient-to-br from-[#5a4bf0] to-[#8a7df6]",
    pills: ["SSA-821", "Guided", "Auto-fill"],
  },
  {
    icon: IconMessageCircle,
    label: "Advisor",
    gradient: "bg-gradient-to-br from-[#4b63f0] to-[#0f1b33]",
    pills: ["Your numbers", "How to fix"],
  },
  {
    icon: IconFolder,
    label: "Vault",
    gradient: "bg-gradient-to-br from-[#6b7280] to-[#9aa1ad]",
    pills: ["Receipts", "Letters", "Exports"],
  },
];

const FEATURES: { icon: Icon; title: string; body: string }[] = [
  {
    icon: IconBuildingBank,
    title: "Bank-linked money",
    body: "Connect accounts through Plaid; balances and deposits stay current automatically.",
  },
  {
    icon: IconTarget,
    title: "Limits & balances",
    body: "Every balance shown against its warning line and hard limit, color-coded at a glance.",
  },
  {
    icon: IconBell,
    title: "Early alerts",
    body: "A heads-up the moment a balance or income gets close — by email and push, with time to act.",
  },
  {
    icon: IconCalendarEvent,
    title: "Reporting calendar",
    body: "Every program's deadlines in one place, plus a 'do I need to report this?' guide.",
  },
  {
    icon: IconFileText,
    title: "Benefit paperwork",
    body: "Reporting and recertification forms for your programs — pre-filled and downloadable.",
  },
  {
    icon: IconMessageCircle,
    title: "AI advisor",
    body: "Ask about your own numbers in plain language, and get concrete next steps.",
  },
];

const FOOTER_GROUPS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Money",
    links: [
      { label: "Accounts", href: "/auth/signup" },
      { label: "Transactions", href: "/auth/signup" },
      { label: "Categories", href: "/auth/signup" },
      { label: "Recurring", href: "/auth/signup" },
    ],
  },
  {
    heading: "Limits",
    links: [
      { label: "Thresholds", href: "/auth/signup" },
      { label: "Alerts", href: "/auth/signup" },
      { label: "By program", href: "/auth/signup" },
      { label: "ABLE & assets", href: "/auth/signup" },
    ],
  },
  {
    heading: "Calendar",
    links: [
      { label: "Deadlines", href: "/auth/signup" },
      { label: "Do I report this?", href: "/auth/signup" },
      { label: "Renewals", href: "/auth/signup" },
    ],
  },
  {
    heading: "Paperwork",
    links: [
      { label: "Forms", href: "/auth/signup" },
      { label: "Guided fill", href: "/auth/signup" },
      { label: "Vault", href: "/auth/signup" },
      { label: "Exports", href: "/auth/signup" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Resources", href: "/resources" },
      { label: "Sign in", href: "/auth/signin" },
      { label: "Get started", href: "/auth/signup" },
      { label: "Support", href: "mailto:support@mybenefitspa.com" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "/legal/privacy" },
      { label: "Terms", href: "/legal/terms" },
      { label: "Security", href: "/legal/security" },
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden bg-white text-[var(--color-cs-text)]">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-50 border-b border-[var(--color-cs-border)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
          <Link href="/landing" className="flex items-center" aria-label="MyBenefitsPA home">
            <Image
              src="/mybenefitspa-logo.png"
              alt="MyBenefitsPA"
              width={180}
              height={142}
              priority
              className="h-8 w-auto"
            />
          </Link>
          <nav className="hidden items-center gap-7 text-[14px] font-semibold text-[var(--color-cs-text-secondary)] md:flex">
            <a href="#modules" className="hover:text-[var(--color-cs-text)]">Suite</a>
            <a href="#features" className="hover:text-[var(--color-cs-text)]">Features</a>
            <a href="#automation" className="hover:text-[var(--color-cs-text)]">Advisor</a>
            <a href="#connected" className="hover:text-[var(--color-cs-text)]">Connected</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/auth/signin"
              className="hidden text-[14px] font-semibold text-[var(--color-cs-text-secondary)] hover:text-[var(--color-cs-text)] sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center rounded-full bg-[var(--color-cs-navy)] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#1b2b4a]"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="relative mx-auto max-w-5xl px-5 pt-16 text-center sm:px-6 sm:pt-24">
        <h1 className="mx-auto max-w-4xl text-[44px] font-extrabold leading-[1.02] tracking-tight text-[var(--color-cs-text)] sm:text-6xl md:text-7xl">
          Built around the benefits you keep
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-[var(--color-cs-text-secondary)] sm:text-lg">
          One place for your money, your limits, your reporting deadlines, and your benefit
          paperwork — so adaptable it feels built just for your programs. See why SSI, SNAP,
          Medicaid, and ABLE recipients run their benefits on MyBenefitsPA.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/auth/signup"
            className="inline-flex items-center rounded-full bg-[var(--color-cs-navy)] px-7 py-3.5 text-[16px] font-semibold text-white transition-colors hover:bg-[#1b2b4a]"
          >
            Start free
          </Link>
          <Link
            href="/resources"
            className="inline-flex items-center rounded-full border border-[var(--color-cs-border)] bg-white px-7 py-3.5 text-[16px] font-semibold text-[var(--color-cs-text)] transition-colors hover:bg-[var(--color-cs-nav-hover)]"
          >
            See a tour
          </Link>
        </div>
      </section>

      {/* Hero product shot on a warm "desk" backdrop. */}
      <section className="relative px-5 pb-8 pt-14 sm:px-6">
        <div className="absolute inset-x-0 bottom-0 top-24 -z-0 bg-gradient-to-b from-transparent via-[var(--color-cs-surface)] to-[var(--color-cs-surface)]" />
        <div className="relative mx-auto max-w-5xl">
          <div className="rounded-[2rem] bg-gradient-to-b from-[#e7d8bf] to-[#cdb389] p-2.5 shadow-[0_50px_90px_-40px_rgba(15,27,51,0.5)] sm:p-3">
            <Shot
              src="/screenshots/dashboard.png"
              alt="The MyBenefitsPA dashboard: each balance shown against its limit, with a what-if income slider"
              priority
            />
          </div>
        </div>
      </section>

      {/* Trust row */}
      <section className="bg-[var(--color-cs-surface)] pb-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-4 px-6 text-[14px] text-[var(--color-cs-text-secondary)] sm:flex-row sm:gap-8">
          <span className="inline-flex items-center gap-2">
            <IconLock size={18} stroke={1.8} className="text-[var(--color-cs-brand)]" /> Read-only bank access
          </span>
          <span className="inline-flex items-center gap-2">
            <IconShieldLock size={18} stroke={1.8} className="text-[var(--color-cs-brand)]" /> Encrypted, money never moves
          </span>
          <span className="inline-flex items-center gap-2">
            <IconShieldCheck size={18} stroke={1.8} className="text-[var(--color-cs-brand)]" /> Informational, not a determination
          </span>
        </div>
      </section>

      {/* ---------- Module showcase ---------- */}
      <section id="modules" className="bg-[var(--color-cs-surface)] py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <h2 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-[var(--color-cs-text)] sm:text-4xl">
            Why SSI, SNAP, Medicaid &amp; ABLE recipients use MyBenefitsPA
          </h2>
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-[var(--color-cs-text-secondary)]">
            So tailored it feels built just for you. Turn on only the parts your situation needs —
            every one clicks into the same connected place.
          </p>
          <Link
            href="/auth/signup"
            className="mt-6 inline-flex items-center rounded-full bg-[var(--color-cs-navy)] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#1b2b4a]"
          >
            Explore the suite
          </Link>
        </div>

        <div className="mx-auto mt-10 max-w-6xl">
          <div className="flex snap-x gap-4 overflow-x-auto px-5 pb-4 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {MODULES.map((m) => (
              <ModuleCard key={m.label} {...m} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Feature grid ---------- */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-[var(--color-cs-brand)]">
            One connected suite
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-cs-text)] sm:text-4xl">
            Everything that keeps you eligible, in one place
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-[var(--color-cs-text-secondary)]">
            Staying under the limits takes a dozen little jobs. MyBenefitsPA brings them together so
            nothing slips through.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="cs-card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-cs-info-bg)] text-[var(--color-cs-brand)]">
                <f.icon size={22} stroke={1.8} />
              </span>
              <h3 className="mt-4 text-[16px] font-bold text-[var(--color-cs-text)]">{f.title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--color-cs-text-secondary)]">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Dark automation / advisor section ---------- */}
      <section id="automation" className="bg-[var(--color-cs-navy)] py-20 text-white sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-[#93a2ff]">
              <IconSparkles size={15} stroke={2} /> Your advisor
            </p>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Ask about your own numbers
            </h2>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-white/70">
              The advisor can see your real picture — this month&apos;s income (earned vs unearned,
              with exclusions applied), balances, and limit status — so it answers from your actual
              figures and tells you, concretely, how to stay eligible.
            </p>
            <Link
              href="/auth/signup"
              className="mt-7 inline-flex items-center rounded-full bg-white px-6 py-3 text-[15px] font-semibold text-[var(--color-cs-navy)] hover:bg-white/90"
            >
              Try the advisor
            </Link>
          </div>

          {/* Mock advisor + alert cards */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#93a2ff]">
                <IconSparkles size={14} stroke={2} /> Ask the advisor
              </p>
              <div className="mt-4 flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-[var(--color-cs-brand)] px-3.5 py-2 text-[13px]">
                  Am I close to any of my limits this month?
                </div>
              </div>
              <div className="mt-3 max-w-[88%] rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.06] px-3.5 py-2.5 text-[13px] leading-relaxed text-white/85">
                You&apos;re at <strong className="text-white">$1,840</strong> of the{" "}
                <strong className="text-white">$1,910</strong> SSI earned-income line — about 96%. To
                stay under, you could log an Impairment-Related Work Expense or move savings into your
                ABLE account.
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-[var(--color-cs-warning-bg)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-cs-warning)]">
                    SSI · 96%
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/80">
                    ABLE shelter
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#93a2ff]">
                  <IconBell size={14} stroke={2} /> Alert
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-cs-accent-green)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-cs-accent-green)]" /> Watching
                </span>
              </div>
              <div className="mt-3 space-y-2 text-[13px]">
                {[
                  "Earned income crosses 90% of the SGA line",
                  "Email + push, with time to act before month-end",
                  "Open the program page for how to fix it",
                ].map((step, i) => (
                  <div key={step} className="flex items-center gap-3 rounded-xl bg-white/[0.05] px-3 py-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-white/70">
                      {i + 1}
                    </span>
                    <span className="text-white/85">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Dark connected section ---------- */}
      <section id="connected" className="bg-[#0b1426] py-20 text-white sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div className="lg:order-2">
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-[#93a2ff]">
              Connected, not scattered
            </p>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              Every deposit counts the right way
            </h2>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-white/70">
              Link your bank once. Income, benefits, and expenses sort themselves so each counts
              correctly toward every program&apos;s test — and the same numbers drive your limits,
              alerts, calendar, and forms. No spreadsheets, no double entry, no dead ends.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-[13px] font-semibold">
              {["Link", "Categorize", "Stay under"].map((t, i) => (
                <span
                  key={t}
                  className={`rounded-full px-3.5 py-1.5 ${
                    i === 0
                      ? "bg-white text-[var(--color-cs-navy)]"
                      : "border border-white/15 text-white/70"
                  }`}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="lg:order-1">
            <div className="rounded-3xl bg-gradient-to-b from-white/15 to-white/[0.03] p-2.5">
              <Shot
                src="/screenshots/money.png"
                alt="The Money screen: connected accounts and categorized transactions"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Closing CTA ---------- */}
      <section className="bg-[var(--color-cs-brand)] py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Your benefits, protected. Start today.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/85">
            Free to set up. Link your bank, see where you stand, and stay on top of what to report.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold text-[var(--color-cs-brand)] hover:bg-[var(--color-cs-surface)]"
            >
              Create an account
              <IconArrowRight size={20} stroke={2.2} />
            </Link>
            <Link
              href="/resources"
              className="inline-flex items-center gap-2 rounded-full border border-white/70 px-7 py-3.5 text-base font-semibold text-white hover:bg-white/10"
            >
              Browse resources
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="bg-[var(--color-cs-surface)]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_3fr]">
            <div>
              <Image
                src="/mybenefitspa-logo.png"
                alt="MyBenefitsPA"
                width={180}
                height={142}
                className="h-8 w-auto"
              />
              <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-[var(--color-cs-text-secondary)]">
                Money, limits, deadlines, and paperwork — one calm place, one source of truth for your
                benefits.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
              {FOOTER_GROUPS.map((g) => (
                <div key={g.heading}>
                  <p className="text-[13px] font-bold text-[var(--color-cs-text)]">{g.heading}</p>
                  <ul className="mt-3 space-y-2">
                    {g.links.map((l) => (
                      <li key={l.label}>
                        <Link
                          href={l.href}
                          className="text-[13px] text-[var(--color-cs-text-secondary)] hover:text-[var(--color-cs-brand)]"
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 border-t border-[var(--color-cs-border)] pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12px] text-[var(--color-cs-text-muted)]">
                © {new Date().getFullYear()} MyBenefitsPA. All rights reserved.
              </p>
              <p className="text-[12px] text-[var(--color-cs-text-muted)]">
                Informational tool only — not legal, tax, or benefits advice.
              </p>
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-[var(--color-cs-text-muted)]">
              Program limits change; always confirm with SSA, your state agency, or a qualified
              benefits counselor before acting.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
