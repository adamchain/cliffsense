import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  IconArrowRight,
  IconBell,
  IconBuildingBank,
  IconChartLine,
  IconClockHour4,
  IconHeartHandshake,
  IconLock,
  IconMail,
  IconPhone,
  IconShieldCheck,
  IconWallet,
} from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "MyBenefitsPA — Stay under the limits that keep your benefits",
  description:
    "MyBenefitsPA links to your bank, compares balances and deposits to benefit-program thresholds, and emails you before you approach a limit.",
};

/* ----------------------------------------------------------------------------
 * Landing page — layout adapted from the "Soller" marketing template, restyled
 * with the MyBenefitsPA palette (brand blue + navy in place of purple, with
 * green/orange accent circles) and benefits-program copy. Server component;
 * the testimonial row uses native scroll-snap so no client JS is required.
 * ------------------------------------------------------------------------- */

function PillButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "ghost-dark";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-semibold transition-colors";
  const styles = {
    primary:
      "bg-[var(--color-cs-brand)] text-white shadow-sm hover:bg-[var(--color-cs-brand-hover)]",
    ghost:
      "border-2 border-[var(--color-cs-brand)] text-[var(--color-cs-brand)] hover:bg-[var(--color-cs-info-bg)]",
    "ghost-dark":
      "border-2 border-white/70 text-white hover:bg-white/10",
  }[variant];
  return (
    <Link href={href} className={`${base} ${styles}`}>
      {children}
      <IconArrowRight size={20} stroke={2.2} />
    </Link>
  );
}

function FeatureItem({
  icon: Icon,
  title,
  body,
  onDark = false,
}: {
  icon: typeof IconBell;
  title: string;
  body: string;
  onDark?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span
        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
          onDark ? "bg-white/10 text-white" : "bg-[var(--color-cs-info-bg)] text-[var(--color-cs-brand)]"
        }`}
      >
        <Icon size={30} stroke={1.8} />
      </span>
      <h3 className={`text-xl font-bold ${onDark ? "text-white" : "text-[var(--color-cs-text)]"}`}>
        {title}
      </h3>
      <p className={`text-[15px] leading-relaxed ${onDark ? "text-white/75" : "text-[var(--color-cs-text-secondary)]"}`}>
        {body}
      </p>
    </div>
  );
}

/* A stylized in-browser dashboard mockup (wireframe-style placeholder). */
function DashboardMock() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border-4 border-white bg-white shadow-2xl">
      {/* top bar */}
      <div className="flex items-center gap-2 border-b border-[var(--color-cs-border)] bg-white px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#e11d48]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
        <div className="mx-auto rounded bg-[var(--color-cs-surface)] px-10 py-1 text-[11px] text-[var(--color-cs-text-muted)]">
          app.mybenefitspa.com
        </div>
      </div>
      {/* body */}
      <div className="flex h-[360px] bg-[var(--color-cs-info-bg)]">
        {/* sidebar */}
        <div className="hidden w-1/5 flex-col gap-3 bg-[#cfe0f7] p-4 sm:flex">
          <div className="h-4 w-4/5 rounded bg-white/80" />
          <div className="h-3 w-3/5 rounded bg-white/60" />
          <div className="h-3 w-2/3 rounded bg-white/60" />
          <div className="h-3 w-1/2 rounded bg-white/60" />
        </div>
        {/* main */}
        <div className="flex-1 p-5">
          <div className="mb-4 h-5 w-2/5 rounded bg-[#9bc1f0]" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
              <div className="h-3 w-1/2 rounded bg-[var(--color-cs-success-bg)]" />
              <div className="h-8 w-2/3 rounded bg-[var(--color-cs-success)]/30" />
              <div className="h-2 w-full rounded bg-[var(--color-cs-border)]" />
            </div>
            <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
              <div className="h-3 w-1/2 rounded bg-[var(--color-cs-warning-bg)]" />
              <div className="h-8 w-2/3 rounded bg-[var(--color-cs-warning)]/30" />
              <div className="h-2 w-full rounded bg-[var(--color-cs-border)]" />
            </div>
            <div className="col-span-2 flex items-end gap-2 rounded-xl bg-white p-4 shadow-sm">
              {[40, 65, 50, 80, 55, 72, 48].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-[var(--color-cs-brand)]/70"
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* A stylized phone mockup. */
function PhoneMock() {
  return (
    <div className="relative mx-auto w-[260px] overflow-hidden rounded-[2rem] border-[6px] border-white bg-[var(--color-cs-info-bg)] shadow-2xl">
      <div className="h-[520px] p-5">
        <div className="mb-5 flex items-center justify-between">
          <div className="h-4 w-24 rounded bg-[#9bc1f0]" />
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[var(--color-cs-brand)] shadow-sm">
            <IconBell size={18} />
          </span>
        </div>
        <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
          <div className="h-3 w-1/3 rounded bg-[var(--color-cs-success-bg)]" />
          <div className="flex items-end gap-1.5">
            {[30, 48, 36, 60, 44, 70, 52].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-[var(--color-cs-brand)]/70"
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {[
            "bg-[var(--color-cs-success)]",
            "bg-[var(--color-cs-warning)]",
            "bg-[var(--color-cs-brand)]",
          ].map((dot, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
              <span className={`h-3 w-3 rounded-full ${dot}`} />
              <div className="h-3 flex-1 rounded bg-[var(--color-cs-border)]" />
            </div>
          ))}
        </div>
      </div>
      {/* bottom nav */}
      <div className="flex items-center justify-around border-t border-white bg-white/80 py-3 text-[var(--color-cs-brand)]">
        <IconChartLine size={20} />
        <IconWallet size={20} />
        <IconBell size={20} />
      </div>
    </div>
  );
}

const TESTIMONIALS = [
  {
    icon: IconShieldCheck,
    quote:
      "I used to dread checking my account balance before the end of the month. Now I get a heads-up days early and can plan with my counselor instead of panicking.",
    name: "Dana R.",
    role: "SSI recipient",
  },
  {
    icon: IconHeartHandshake,
    quote:
      "As a representative payee for my brother, this is the first tool that actually shows me how close he is to the resource limit — in plain language.",
    name: "Marcus T.",
    role: "Representative payee",
  },
  {
    icon: IconBuildingBank,
    quote:
      "Linking the bank took two minutes. Seeing deposits compared to the thresholds, all in one place, took the guesswork out completely.",
    name: "Priya N.",
    role: "Medicaid waiver participant",
  },
  {
    icon: IconClockHour4,
    quote:
      "The email reminder arrived the week before a back-pay deposit would have pushed us over. We had time to act. That alone was worth it.",
    name: "Ellen & Joe",
    role: "Caregivers",
  },
];

/* Decorative circle. */
function Blob({ className }: { className: string }) {
  return <span aria-hidden className={`pointer-events-none absolute rounded-full ${className}`} />;
}

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden bg-white text-[var(--color-cs-text)]">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-50 border-b border-[var(--color-cs-border)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/landing" className="flex items-center" aria-label="MyBenefitsPA home">
            <Image
              src="/mybenefitspa-logo.png"
              alt="MyBenefitsPA"
              width={180}
              height={142}
              priority
              className="h-9 w-auto"
            />
          </Link>
          <nav className="hidden items-center gap-8 text-[15px] font-medium text-[var(--color-cs-text)] md:flex">
            <a href="#how-it-works" className="hover:text-[var(--color-cs-brand)]">How it works</a>
            <a href="#features" className="hover:text-[var(--color-cs-brand)]">Features</a>
            <a href="#stories" className="hover:text-[var(--color-cs-brand)]">Stories</a>
            <Link href="/resources" className="hover:text-[var(--color-cs-brand)]">Resources</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="hidden rounded-full px-4 py-2 text-[15px] font-medium text-[var(--color-cs-brand)] hover:bg-[var(--color-cs-info-bg)] sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-cs-brand)] px-5 py-2.5 text-[15px] font-semibold text-white shadow-sm hover:bg-[var(--color-cs-brand-hover)]"
            >
              Get started
              <IconArrowRight size={18} stroke={2.2} />
            </Link>
          </div>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="relative isolate overflow-hidden">
        {/* decorative shapes (right side, behind content) */}
        <Blob className="right-[-120px] top-[-80px] h-[520px] w-[520px] bg-[var(--color-cs-info-bg)]" />
        <Blob className="left-[44%] top-10 h-28 w-28 bg-[var(--color-cs-accent-orange)]/80" />
        <Blob className="right-24 top-56 h-16 w-16 bg-[var(--color-cs-accent-green)]/70" />
        <Blob className="right-[42%] bottom-10 hidden h-12 w-12 bg-[var(--color-cs-brand)]/30 lg:block" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-cs-accent-orange)]">
              Peace of mind for SSI, SSDI &amp; Medicaid
            </p>
            <h1 className="mt-4 text-5xl font-extrabold leading-[1.08] tracking-tight text-[var(--color-cs-navy)] sm:text-6xl">
              Stay under the limits that keep your benefits.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--color-cs-text-secondary)]">
              MyBenefitsPA links to your bank, compares your balances and deposits to common program
              thresholds, and emails you <em>before</em> you approach a limit — so you can plan ahead with
              your counselor or trustee.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <PillButton href="/auth/signup">Get started free</PillButton>
              <PillButton href="#how-it-works" variant="ghost">See how it works</PillButton>
            </div>

            {/* testimonial card */}
            <div className="mt-12 flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-cs-info-bg)] text-[var(--color-cs-brand)]">
                <IconShieldCheck size={28} />
              </span>
              <div className="max-w-md">
                <p className="text-[15px] italic text-[var(--color-cs-text)]">
                  &ldquo;Finally, a calm way to see where I stand — no spreadsheets, no surprises.&rdquo;
                </p>
                <p className="text-sm text-[var(--color-cs-text-muted)]">Dana R. · SSI recipient</p>
              </div>
            </div>
          </div>

          {/* hero visual */}
          <div className="relative">
            <DashboardMock />
          </div>
        </div>
      </section>

      {/* ---------- How it works (centered showcase) ---------- */}
      <section id="how-it-works" className="relative isolate overflow-hidden py-24">
        <Blob className="left-[-160px] top-24 h-[460px] w-[460px] bg-[var(--color-cs-info-bg)]" />
        <Blob className="right-[-120px] top-40 h-72 w-72 bg-[var(--color-cs-accent-orange)]/15" />
        <Blob className="left-24 top-16 h-20 w-20 bg-[var(--color-cs-accent-green)]/30" />

        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-cs-accent-orange)]">
            Always in the clear
          </p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-[var(--color-cs-navy)] sm:text-5xl">
            See exactly where you stand
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[var(--color-cs-text-secondary)]">
            Connect once and MyBenefitsPA does the watching. Your dashboard shows each balance next to the
            limit that matters, so a number is never a mystery.
          </p>
        </div>
        <div className="mx-auto mt-14 max-w-5xl px-6">
          <DashboardMock />
        </div>
      </section>

      {/* ---------- Feature section A (navy) ---------- */}
      <section id="features" className="relative isolate overflow-hidden bg-[var(--color-cs-navy)] py-24">
        <Blob className="right-10 top-10 h-56 w-56 bg-white/5" />
        <Blob className="left-[-80px] bottom-[-60px] h-80 w-80 bg-[var(--color-cs-brand)]/30" />
        <Blob className="right-1/3 bottom-20 h-24 w-24 bg-[var(--color-cs-accent-orange)]/40" />

        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <PhoneMock />
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-cs-accent-orange)]">
              Built around your programs
            </p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Watching the things that count
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">
              Resource and income limits aren&apos;t one-size-fits-all. MyBenefitsPA tracks the ones tied to
              your benefits and keeps the math out of sight.
            </p>
            <div className="mt-10 grid gap-x-10 gap-y-10 sm:grid-cols-2">
              <FeatureItem
                onDark
                icon={IconBuildingBank}
                title="Bank-linked"
                body="Securely connect accounts through Plaid — balances and deposits update automatically."
              />
              <FeatureItem
                onDark
                icon={IconChartLine}
                title="Threshold tracking"
                body="See each balance measured against the resource and income limits for your programs."
              />
              <FeatureItem
                onDark
                icon={IconBell}
                title="Early warnings"
                body="Get a nudge as you near a limit — with enough lead time to actually do something."
              />
              <FeatureItem
                onDark
                icon={IconShieldCheck}
                title="Private &amp; secure"
                body="Read-only access, encrypted in transit. We never move money or share your data."
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Feature section B (light + orange accent panel) ---------- */}
      <section className="relative isolate overflow-hidden py-24">
        <span
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[var(--color-cs-warning-bg)]/60"
        />
        <Blob className="left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 bg-[var(--color-cs-accent-orange)]/10" />

        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-cs-accent-orange)]">
              Calm, timely reminders
            </p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-[var(--color-cs-navy)] sm:text-5xl">
              Plan ahead, not in a panic
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--color-cs-text-secondary)]">
              A back-pay deposit or a good month shouldn&apos;t cost you your coverage. MyBenefitsPA gives you
              room to make a plan.
            </p>
            <div className="mt-10 grid gap-x-10 gap-y-10 sm:grid-cols-2">
              <FeatureItem
                icon={IconMail}
                title="Email alerts"
                body="Plain-language reminders land in your inbox before a balance gets close to a limit."
              />
              <FeatureItem
                icon={IconWallet}
                title="Custom limits"
                body="Use built-in program thresholds or set your own to match your situation."
              />
              <FeatureItem
                icon={IconChartLine}
                title="Trend view"
                body="Watch balances over time so a rising number never catches you off guard."
              />
              <FeatureItem
                icon={IconClockHour4}
                title="Lead time"
                body="Catch a problem days or weeks early — time to call a counselor or trustee."
              />
            </div>
          </div>
          <div className="relative">
            <PhoneMock />
          </div>
        </div>
      </section>

      {/* ---------- Testimonials (navy slider) ---------- */}
      <section id="stories" className="relative isolate overflow-hidden bg-[var(--color-cs-navy)] py-24">
        <Blob className="right-[-100px] top-[-120px] h-96 w-96 bg-[var(--color-cs-brand)]/30" />
        <Blob className="left-10 bottom-10 h-40 w-40 bg-[var(--color-cs-accent-orange)]/30" />

        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-cs-accent-orange)]">
                Stories from the people we serve
              </p>
              <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                Built for real lives, not edge cases
              </h2>
            </div>
            <PillButton href="/auth/signup" variant="ghost-dark">Join them</PillButton>
          </div>

          <div className="mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.name}
                className="flex w-[300px] shrink-0 snap-start flex-col rounded-2xl border border-[var(--color-cs-border)] bg-white p-8 shadow-xl sm:w-[340px]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-cs-info-bg)] text-[var(--color-cs-brand)]">
                  <t.icon size={26} />
                </span>
                <blockquote className="mt-5 flex-1 text-[15px] leading-relaxed text-[var(--color-cs-text)]">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-[var(--color-cs-border)] pt-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-cs-surface)] text-[var(--color-cs-text-secondary)]">
                    <IconHeartHandshake size={20} />
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-[var(--color-cs-text)]">{t.name}</p>
                    <p className="text-sm text-[var(--color-cs-text-muted)]">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Closing CTA ---------- */}
      <section className="relative isolate overflow-hidden bg-[var(--color-cs-brand)] py-24">
        <Blob className="right-[-120px] top-[-120px] h-96 w-96 bg-white/10" />
        <Blob className="left-10 bottom-[-80px] h-72 w-72 bg-[var(--color-cs-navy)]/40" />
        <Blob className="right-1/4 bottom-16 h-20 w-20 bg-[var(--color-cs-accent-orange)]/60" />

        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Your benefits, protected. Start today.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-white/85">
            Free to set up. Link your bank, see where you stand, and let MyBenefitsPA keep watch.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold text-[var(--color-cs-brand)] shadow-sm hover:bg-[var(--color-cs-surface)]"
            >
              Create your account
              <IconArrowRight size={20} stroke={2.2} />
            </Link>
            <PillButton href="/resources" variant="ghost-dark">Browse resources</PillButton>
          </div>
          <p className="mt-6 inline-flex items-center gap-2 text-sm text-white/70">
            <IconLock size={16} /> Read-only bank access · No money ever moves
          </p>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/mybenefitspa-logo.png"
              alt="MyBenefitsPA"
              width={180}
              height={142}
              className="h-8 w-auto"
            />
          </div>
          <p className="text-sm text-[var(--color-cs-text-muted)]">
            © {new Date().getFullYear()} MyBenefitsPA. All rights reserved.
          </p>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--color-cs-text-secondary)]">
            <Link href="/resources" className="hover:text-[var(--color-cs-brand)]">Resources</Link>
            <Link href="/legal/privacy" className="hover:text-[var(--color-cs-brand)]">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-[var(--color-cs-brand)]">Terms</Link>
            <Link href="/legal/security" className="hover:text-[var(--color-cs-brand)]">Security</Link>
            <Link href="/legal/data-retention" className="hover:text-[var(--color-cs-brand)]">Data Retention</Link>
            <a
              href="mailto:support@mybenefitspa.com"
              className="inline-flex items-center gap-1.5 hover:text-[var(--color-cs-brand)]"
            >
              <IconPhone size={15} /> Support
            </a>
          </nav>
        </div>
        <div className="border-t border-[var(--color-cs-border)]">
          <p className="mx-auto max-w-7xl px-6 py-5 text-[11px] leading-relaxed text-[var(--color-cs-text-muted)]">
            Informational tool only. Not legal, tax, or benefits advice. Program thresholds change; always
            confirm with SSA, your state agency, or a qualified benefits counselor before acting.
          </p>
        </div>
      </footer>
    </div>
  );
}
