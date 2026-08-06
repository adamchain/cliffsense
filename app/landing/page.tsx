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
  title: "MyBenefitsPA — Pennsylvania's Benefits Continuity and Renewal Compliance Platform",
  description:
    "MyBenefitsPA helps individuals, families, and caregivers organize the documents, deadlines, income, assets, work activity, and reporting requirements needed to maintain Medicaid and other public benefits. It works alongside Pennsylvania's existing eligibility systems to improve renewal compliance and prevent avoidable coverage loss.",
};

/* ----------------------------------------------------------------------------
 * Landing page — Apple-aligned marketing surface using the same cs- tokens as
 * the authenticated app (system blue, #f2f2f7 canvas, rounded 0.875rem buttons,
 * soft cards). Server component.
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
    <div className="overflow-hidden rounded-[22px] border border-[var(--color-cs-border)] bg-white shadow-[var(--shadow-cs-float)]">
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

/** One "module" card — tall panel with Apple system accent colors. */
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
      className={`relative flex h-[340px] w-[260px] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-[22px] p-5 text-white ${gradient} ${
        featured ? "ring-2 ring-[var(--color-cs-brand)] ring-offset-2 ring-offset-[var(--color-cs-surface)]" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-bold tracking-tight">{label}</span>
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
    gradient: "bg-gradient-to-br from-[#007aff] to-[#0055cc]",
    pills: ["Accounts", "Income", "Expenses"],
  },
  {
    icon: IconTarget,
    label: "Limits",
    gradient: "bg-gradient-to-br from-[#1c1c1e] to-[#3a3a3c]",
    pills: ["SSI", "SNAP", "Medicaid", "ABLE"],
    featured: true,
  },
  {
    icon: IconBell,
    label: "Alerts",
    gradient: "bg-gradient-to-br from-[#ff9500] to-[#ffb340]",
    pills: ["Predictive", "Breach", "Email"],
  },
  {
    icon: IconCalendarEvent,
    label: "Calendar",
    gradient: "bg-gradient-to-br from-[#34c759] to-[#30d158]",
    pills: ["Deadlines", "SAR", "Renewals"],
  },
  {
    icon: IconFileText,
    label: "Paperwork",
    gradient: "bg-gradient-to-br from-[#5856d6] to-[#7a78e0]",
    pills: ["SSA-821", "Guided", "Auto-fill"],
  },
  {
    icon: IconMessageCircle,
    label: "Advisor",
    gradient: "bg-gradient-to-br from-[#007aff] to-[#0f1b33]",
    pills: ["Your numbers", "How to fix"],
  },
  {
    icon: IconFolder,
    label: "Vault",
    gradient: "bg-gradient-to-br from-[#8e8e93] to-[#aeaeb2]",
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

const FOUNDERS: { name: string; role: string; paragraphs: string[] }[] = [
  {
    name: "Frank M. Rapoport, Esq.",
    role: "Co-founder",
    paragraphs: [
      "Frank brings more than four decades of experience in government, law, public-private initiatives, public health leadership and business development. His career includes service with the U.S. Department of Justice, management roles at national law firms, and extensive work helping public agencies and private organizations navigate complex government programs and bring innovative solutions to market.",
    ],
  },
  {
    name: "Adam Chain",
    role: "Co-founder",
    paragraphs: [
      "Adam Chain is a software developer and systems builder based in Philadelphia, known for his ability to rapidly execute in unfamiliar domains and deliver production-ready tools for complex operational environments.",
      "He studied economics at Penn State University before beginning his career in investment banking, where he focused on tender option bond programs in the municipal market — a niche that gave him early exposure to structured finance, regulatory constraints, and large-scale data workflows. He later transitioned into operating roles at startups in the automotive and logistics sectors, gaining hands-on experience with marketplace dynamics, fleet operations, and real-time dispatch systems.",
      "Since 2023, Adam has worked as an independent contract developer for companies across oil and gas, real estate, call-center systems, and social-benefits delivery. This range has shaped his reputation for quickly absorbing domain knowledge, mapping operational bottlenecks, and shipping reliable software without long ramp-up cycles.",
      "He is currently building Suitenote, a business operating system designed to unify workflows for small and mid-sized service companies, and MyCompassPA.com, a platform focused on improving access to social-benefits information and tools for Pennsylvania residents.",
    ],
  },
];

const OUTCOMES = [
  "Earlier intervention",
  "Fewer missed deadlines",
  "Better documentation",
  "Stronger appeals",
  "Greater continuity of essential benefits",
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
      { label: "About us", href: "#about" },
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
    <div className="overflow-x-hidden bg-[var(--color-cs-surface)] text-[var(--color-cs-text)]">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-50 border-b border-[var(--color-cs-border)] bg-[rgba(248,248,250,0.82)] backdrop-blur-[22px] backdrop-saturate-150">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-6">
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
          <nav className="hidden items-center gap-7 text-[13px] font-semibold text-[var(--color-cs-text-secondary)] md:flex">
            <a href="#modules" className="hover:text-[var(--color-cs-text)]">Suite</a>
            <a href="#features" className="hover:text-[var(--color-cs-text)]">Features</a>
            <a href="#about" className="hover:text-[var(--color-cs-text)]">About</a>
            <a href="#automation" className="hover:text-[var(--color-cs-text)]">Advisor</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/auth/signin"
              className="hidden text-[13px] font-semibold text-[var(--color-cs-text-secondary)] hover:text-[var(--color-cs-text)] sm:inline-flex"
            >
              Sign in
            </Link>
            <Link href="/auth/signup" className="cs-btn cs-btn-primary !px-4 !py-2 !text-[13px]">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="relative mx-auto max-w-5xl px-5 pt-14 text-center sm:px-6 sm:pt-20">
        <p className="cs-eyebrow text-[var(--color-cs-brand)]">
          Pennsylvania&apos;s Benefits Continuity &amp; Renewal Compliance Platform
        </p>
        <h1 className="mx-auto mt-3 max-w-4xl text-[40px] font-bold leading-[1.05] tracking-[-0.6px] text-[var(--color-cs-text)] sm:text-[56px] md:text-[64px]">
          Keep Benefits in Place.<br />Stay Ready for Every Renewal.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-[var(--color-cs-text-secondary)] sm:text-lg">
          MyBenefitsPA helps individuals, families, and caregivers organize the documents,
          deadlines, income, assets, work activity, and reporting requirements needed to maintain
          Medicaid and other public benefits. It works alongside Pennsylvania&apos;s existing
          eligibility systems — improving renewal compliance, preventing avoidable coverage loss,
          and supporting better administrative outcomes without replacing the Commonwealth&apos;s
          benefits portals or infrastructure.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/auth/signup" className="cs-btn cs-btn-primary !px-7 !py-3.5 !text-[16px]">
            Start free
          </Link>
          <Link href="/resources" className="cs-btn cs-btn-secondary !px-7 !py-3.5 !text-[16px]">
            See a tour
          </Link>
        </div>
      </section>

      {/* Hero product shot */}
      <section className="relative px-5 pb-8 pt-12 sm:px-6">
        <div className="relative mx-auto max-w-5xl">
          <div className="rounded-[28px] border border-[var(--color-cs-border)] bg-white p-2 shadow-[var(--shadow-cs-float)] sm:p-2.5">
            <Shot
              src="/screenshots/dashboard.png"
              alt="The MyBenefitsPA dashboard: each balance shown against its limit, with a what-if income slider"
              priority
            />
          </div>
        </div>
      </section>

      {/* Trust row */}
      <section className="pb-2 pt-2">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-4 px-6 text-[13px] font-medium text-[var(--color-cs-text-secondary)] sm:flex-row sm:gap-8">
          <span className="inline-flex items-center gap-2">
            <IconLock size={17} stroke={1.8} className="text-[var(--color-cs-brand)]" /> Read-only bank access
          </span>
          <span className="inline-flex items-center gap-2">
            <IconShieldLock size={17} stroke={1.8} className="text-[var(--color-cs-brand)]" /> Encrypted, money never moves
          </span>
          <span className="inline-flex items-center gap-2">
            <IconShieldCheck size={17} stroke={1.8} className="text-[var(--color-cs-brand)]" /> Informational, not a determination
          </span>
        </div>
      </section>

      {/* ---------- Module showcase ---------- */}
      <section id="modules" className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <p className="cs-eyebrow">The suite</p>
          <h2 className="mt-2 max-w-3xl text-[28px] font-bold leading-tight tracking-[-0.4px] text-[var(--color-cs-text)] sm:text-[34px]">
            Why SSI, SNAP, Medicaid &amp; ABLE recipients use MyBenefitsPA
          </h2>
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-[var(--color-cs-text-secondary)]">
            So tailored it feels built just for you. Turn on only the parts your situation needs —
            every one clicks into the same connected place.
          </p>
          <Link href="/auth/signup" className="cs-btn cs-btn-primary mt-6 !px-5 !py-2.5 !text-[14px]">
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
      <section id="features" className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
        <div className="max-w-2xl">
          <p className="cs-eyebrow text-[var(--color-cs-brand)]">One connected suite</p>
          <h2 className="mt-2 text-[28px] font-bold tracking-[-0.4px] text-[var(--color-cs-text)] sm:text-[34px]">
            Everything that keeps you eligible, in one place
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-[var(--color-cs-text-secondary)]">
            Staying under the limits takes a dozen little jobs. MyBenefitsPA brings them together so
            nothing slips through.
          </p>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="cs-card p-5 sm:p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--color-cs-info-bg)] text-[var(--color-cs-brand)]">
                <f.icon size={20} stroke={1.8} />
              </span>
              <h3 className="mt-3.5 text-[16px] font-semibold text-[var(--color-cs-text)]">{f.title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--color-cs-text-secondary)]">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- About us ---------- */}
      <section id="about" className="border-y border-[var(--color-cs-border)] bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <p className="cs-eyebrow text-[var(--color-cs-brand)]">About Us</p>
          <h2 className="mt-2 text-[28px] font-bold tracking-[-0.4px] text-[var(--color-cs-text)] sm:text-[34px]">
            Protecting Benefits Before a Crisis Happens
          </h2>

          <div className="mt-6 space-y-5 text-[16px] leading-relaxed text-[var(--color-cs-text-secondary)]">
            <p>
              Public benefits are essential—but keeping them can be extraordinarily difficult. People
              with disabilities and other vulnerable Pennsylvanians routinely lose coverage because
              of missed notices, confusing reporting requirements, unexpected income and asset
              changes, renewal deadlines, and incorrect eligibility determinations—not because they
              no longer qualify or need support.
            </p>
            <p>
              MyBenefitsPA.com is a secure, web-based benefits safety platform built for trustees,
              guardians, caregivers, attorneys, fiduciaries, and social-service professionals. It
              helps users understand and manage how wages, deposits, assets, work activity, and
              special needs trust distributions may affect eligibility for Medicaid, SSI, SSDI, SNAP,
              QMB, MAWD and related programs.
            </p>
            <p>
              Ongoing monitoring of securely connected financial accounts identifies potential
              eligibility risks before they become costly problems. Timely alerts flag approaching
              income or asset limits, reporting obligations, renewal deadlines, and missing
              documentation. A secure document vault organizes renewal forms, work-hour records,
              agency notices, and supporting evidence into exportable audit trails for applications,
              compliance reviews, and appeals. These capabilities directly address the procedural
              failures and reporting burdens that frequently cause otherwise eligible people to lose
              benefits.
            </p>
          </div>

          <div className="mt-12">
            <h3 className="text-[20px] font-bold tracking-tight text-[var(--color-cs-text)]">
              The Outcome
            </h3>
            <p className="mt-3 text-[16px] leading-relaxed text-[var(--color-cs-text-secondary)]">
              MyBenefitsPA is designed to deliver:
            </p>
            <ul className="mt-4 space-y-2.5">
              {OUTCOMES.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px] font-medium text-[var(--color-cs-text)]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-cs-brand)]" />
                  {item}.
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[16px] leading-relaxed text-[var(--color-cs-text-secondary)]">
              Beginning in Pennsylvania, the platform gives families and professionals a practical
              way to move from reactive crisis management to proactive benefits protection.
            </p>
          </div>

          <div className="mt-14">
            <h3 className="text-[20px] font-bold tracking-tight text-[var(--color-cs-text)]">
              Our Founders
            </h3>
            <p className="mt-3 text-[16px] leading-relaxed text-[var(--color-cs-text-secondary)]">
              MyBenefitsPA was founded by Frank M. Rapoport, Esq., and Adam Chain.
            </p>

            <div className="mt-8 space-y-8">
              {FOUNDERS.map((f) => (
                <div key={f.name} className="rounded-[18px] bg-[var(--color-cs-surface)] p-5 sm:p-6">
                  <p className="text-[17px] font-semibold text-[var(--color-cs-text)]">{f.name}</p>
                  <p className="mt-0.5 text-[13px] font-medium text-[var(--color-cs-text-secondary)]">
                    {f.role}
                  </p>
                  <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-[var(--color-cs-text-secondary)]">
                    {f.paragraphs.map((para) => (
                      <p key={para.slice(0, 40)}>{para}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <blockquote className="mt-10 border-l-[3px] border-[var(--color-cs-brand)] pl-5">
              <p className="text-[16px] font-medium leading-relaxed text-[var(--color-cs-text)]">
                Together, the founders are building MyBenefitsPA around a straightforward principle:
                People who remain eligible for essential benefits should not lose them because the
                rules are too complicated, a deadline was missed, or critical information was
                unavailable when it mattered most.
              </p>
            </blockquote>
          </div>
        </div>
      </section>

      {/* ---------- Dark automation / advisor section ---------- */}
      <section id="automation" className="bg-[var(--color-cs-navy)] py-16 text-white sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.5px] text-[#64b5ff]">
              <IconSparkles size={15} stroke={2} /> Your advisor
            </p>
            <h2 className="mt-3 text-[28px] font-bold leading-tight tracking-[-0.4px] sm:text-[34px]">
              Ask about your own numbers
            </h2>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-white/65">
              The advisor can see your real picture — this month&apos;s income (earned vs unearned,
              with exclusions applied), balances, and limit status — so it answers from your actual
              figures and tells you, concretely, how to stay eligible.
            </p>
            <Link
              href="/auth/signup"
              className="cs-btn mt-7 !bg-white !px-6 !py-3 !text-[15px] !text-[var(--color-cs-navy)] hover:!bg-white/90"
            >
              Try the advisor
            </Link>
          </div>

          <div className="space-y-3">
            <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#64b5ff]">
                <IconSparkles size={14} stroke={2} /> Ask the advisor
              </p>
              <div className="mt-4 flex justify-end">
                <div className="max-w-[80%] rounded-[18px] rounded-br-sm bg-[var(--color-cs-brand)] px-3.5 py-2 text-[13px]">
                  Am I close to any of my limits this month?
                </div>
              </div>
              <div className="mt-3 max-w-[88%] rounded-[18px] rounded-bl-sm border border-white/10 bg-white/[0.06] px-3.5 py-2.5 text-[13px] leading-relaxed text-white/85">
                You&apos;re at <strong className="text-white">$1,840</strong> of the{" "}
                <strong className="text-white">$1,910</strong> SSI earned-income line — about 96%. To
                stay under, you could log an Impairment-Related Work Expense or move savings into your
                ABLE account.
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-[var(--color-cs-warning-bg)] px-2 py-0.5 text-[10px] font-bold text-[#ffd60a]">
                    SSI · 96%
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/80">
                    ABLE shelter
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#64b5ff]">
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
                  <div key={step} className="flex items-center gap-3 rounded-[12px] bg-white/[0.05] px-3 py-2">
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

      {/* ---------- Connected section ---------- */}
      <section id="connected" className="bg-[#0b1426] py-16 text-white sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div className="lg:order-2">
            <p className="text-[12px] font-semibold uppercase tracking-[0.5px] text-[#64b5ff]">
              Connected, not scattered
            </p>
            <h2 className="mt-3 text-[28px] font-bold leading-tight tracking-[-0.4px] sm:text-[34px]">
              Every deposit counts the right way
            </h2>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-white/65">
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
            <div className="relative pb-8 pl-6 sm:pb-0 sm:pl-10">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-2 backdrop-blur-sm">
                <Shot
                  src="/screenshots/money.png"
                  alt="The Money screen: connected accounts and categorized transactions"
                />
              </div>
              <div className="absolute -bottom-2 left-0 w-[116px] overflow-hidden rounded-[1.4rem] border-[5px] border-[#0b1426] bg-white shadow-[0_24px_50px_-18px_rgba(0,0,0,0.7)] sm:-bottom-6 sm:w-[150px]">
                <Image
                  src="/screenshots/money-mobile.png"
                  alt="The Money screen on a phone"
                  width={432}
                  height={934}
                  sizes="150px"
                  className="block h-auto w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Closing CTA ---------- */}
      <section className="bg-[var(--color-cs-brand)] py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-[28px] font-bold tracking-[-0.4px] text-white sm:text-[34px]">
            Your benefits, protected. Start today.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/85">
            Free to set up. Link your bank, see where you stand, and stay on top of what to report.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/auth/signup"
              className="cs-btn inline-flex items-center gap-2 !bg-white !px-7 !py-3.5 !text-base !text-[var(--color-cs-brand)] hover:!bg-[var(--color-cs-surface)]"
            >
              Create an account
              <IconArrowRight size={20} stroke={2.2} />
            </Link>
            <Link
              href="/resources"
              className="cs-btn inline-flex items-center gap-2 !border !border-white/70 !bg-transparent !px-7 !py-3.5 !text-base !text-white hover:!bg-white/10"
            >
              Browse resources
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="bg-[var(--color-cs-surface)]">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-6">
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
                  <p className="text-[13px] font-semibold text-[var(--color-cs-text)]">{g.heading}</p>
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

          <div className="mt-12 border-t border-[var(--color-cs-border)] pt-6">
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
