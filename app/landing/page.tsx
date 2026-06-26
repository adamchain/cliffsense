import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  IconArrowRight,
  IconAdjustmentsHorizontal,
  IconBell,
  IconBuildingBank,
  IconChartLine,
  IconClockHour4,
  IconFileText,
  IconHeartHandshake,
  IconLock,
  IconMessageChatbot,
  IconPhone,
  IconSearch,
  IconShieldCheck,
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

/* Browser-chrome frame around a real product screenshot. */
function BrowserFrame({
  src,
  alt,
  width,
  height,
  priority = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border-4 border-white bg-white shadow-2xl ring-1 ring-[var(--color-cs-border)]">
      <div className="flex items-center gap-2 border-b border-[var(--color-cs-border)] bg-white px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#e11d48]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
        <div className="mx-auto rounded bg-[var(--color-cs-surface)] px-10 py-1 text-[11px] text-[var(--color-cs-text-muted)]">
          app.mybenefitspa.com
        </div>
      </div>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes="(min-width: 1024px) 640px, 100vw"
        className="block h-auto w-full"
      />
    </div>
  );
}

/* Phone-chrome frame around a real mobile screenshot. */
function PhoneFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative mx-auto w-[268px] overflow-hidden rounded-[2.2rem] border-[7px] border-white bg-white shadow-2xl ring-1 ring-[var(--color-cs-border)]">
      <Image src={src} alt={alt} width={430} height={936} sizes="268px" className="block h-auto w-full" />
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
              MyBenefitsPA links your bank, lines up your balances and deposits against the income and
              resource limits for your programs, and warns you <em>before</em> you get close. Drag a slider
              to test a raise or a big deposit — and see exactly which limits would tighten.
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
            <BrowserFrame
              src="/marketing/dashboard.png"
              alt="MyBenefitsPA dashboard showing each balance against its limit, with what-if sliders"
              width={2876}
              height={1564}
              priority
            />
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
            Forms without the headache
          </p>
          <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-[var(--color-cs-navy)] sm:text-5xl">
            Every benefit form, filled and ready
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[var(--color-cs-text-secondary)]">
            The reporting and recertification forms for SSI, SSDI, SNAP, Medicaid, Section 8 and more — in one
            place. The in-app ones pre-fill from your profile, so you just review, print or download, and use
            the official link to submit.
          </p>
        </div>
        <div className="mx-auto mt-14 max-w-5xl px-6">
          <BrowserFrame
            src="/marketing/reports-docs.png"
            alt="Reports & Docs page listing SSI reporting and recertification forms with Fill out buttons"
            width={2876}
            height={1560}
          />
        </div>
      </section>

      {/* ---------- Feature section A (navy) ---------- */}
      <section id="features" className="relative isolate overflow-hidden bg-[var(--color-cs-navy)] py-24">
        <Blob className="right-10 top-10 h-56 w-56 bg-white/5" />
        <Blob className="left-[-80px] bottom-[-60px] h-80 w-80 bg-[var(--color-cs-brand)]/30" />
        <Blob className="right-1/3 bottom-20 h-24 w-24 bg-[var(--color-cs-accent-orange)]/40" />

        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2">
          <div className="order-2 flex justify-center lg:order-1">
            <PhoneFrame
              src="/marketing/alerts-mobile.png"
              alt="MyBenefitsPA alerts on a phone, warning that income is approaching a program limit"
            />
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
              your benefits — and tells you the moment a balance gets close.
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
                title="Limits &amp; balances"
                body="Each balance shown against its warning line and hard limit, color-coded at a glance."
              />
              <FeatureItem
                onDark
                icon={IconBell}
                title="Early alerts"
                body="A notice the moment a balance approaches a limit — by email and push, with time to act."
              />
              <FeatureItem
                onDark
                icon={IconShieldCheck}
                title="Private &amp; secure"
                body="Read-only access, encrypted in transit and at rest. We never move money or share your data."
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
              Make sense of it
            </p>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-[var(--color-cs-navy)] sm:text-5xl">
              Answers, search, and what-ifs
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--color-cs-text-secondary)]">
              When a number raises a question, just ask. The built-in advisor explains program rules in plain
              language, and everything you&apos;ve got is a search away.
            </p>
            <div className="mt-10 grid gap-x-10 gap-y-10 sm:grid-cols-2">
              <FeatureItem
                icon={IconMessageChatbot}
                title="AI advisor"
                body="Ask why a limit turned yellow or what counts as income — clear answers, not legalese."
              />
              <FeatureItem
                icon={IconSearch}
                title="Global search"
                body="Find any transaction, alert, limit, or form from the top bar. No match? Send it to the advisor."
              />
              <FeatureItem
                icon={IconAdjustmentsHorizontal}
                title="What-if planning"
                body="Drag a slider to model a raise or a bigger balance and see which limits would get close."
              />
              <FeatureItem
                icon={IconFileText}
                title="Fillable forms"
                body="Reporting and recertification forms pre-filled from your data — print or download in a click."
              />
            </div>
          </div>
          <div className="relative">
            <BrowserFrame
              src="/marketing/advisor.png"
              alt="MyBenefitsPA AI advisor answering why an asset threshold turned yellow"
              width={2874}
              height={1568}
            />
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
