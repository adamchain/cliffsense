import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { IconArrowRight, IconLock, IconShieldCheck, IconReceipt2 } from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "MyBenefitsPA — Stay under the limits that keep your benefits",
  description:
    "MyBenefitsPA links to your bank, compares balances and deposits to benefit-program limits, and helps you report changes on time — with calm, plain-language guidance.",
};

/* ----------------------------------------------------------------------------
 * Landing page — clean and product-led. No decorative blobs or marketing
 * chrome; the real app screenshots carry the page. Server component, no JS.
 * ------------------------------------------------------------------------- */

/** A real desktop screenshot in a clean, lightly-framed card. */
function Shot({
  src,
  alt,
  priority = false,
  sizes = "(min-width: 1024px) 560px, 100vw",
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-cs-border)] bg-white shadow-[0_24px_60px_-30px_rgba(15,27,51,0.35)]">
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

/** A real mobile screenshot in a simple rounded frame. */
function PhoneShot({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="mx-auto w-full max-w-[230px] overflow-hidden rounded-[1.75rem] border border-[var(--color-cs-border)] bg-white shadow-[0_24px_60px_-30px_rgba(15,27,51,0.35)]">
      <Image src={src} alt={alt} width={432} height={934} sizes="230px" className="block h-auto w-full" />
    </div>
  );
}

/** Alternating text + screenshot row. */
function Feature({
  eyebrow,
  title,
  body,
  src,
  alt,
  reverse = false,
}: {
  eyebrow: string;
  title: string;
  body: ReactNode;
  src: string;
  alt: string;
  reverse?: boolean;
}) {
  return (
    <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-2 lg:gap-16">
      <div className={reverse ? "lg:order-2" : ""}>
        <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-[var(--color-cs-brand)]">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-cs-text)] sm:text-4xl">
          {title}
        </h2>
        <p className="mt-4 text-[17px] leading-relaxed text-[var(--color-cs-text-secondary)]">{body}</p>
      </div>
      <div className={reverse ? "lg:order-1" : ""}>
        <Shot src={src} alt={alt} />
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden bg-white text-[var(--color-cs-text)]">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-50 border-b border-[var(--color-cs-border)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
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
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/auth/signin"
              className="hidden rounded-full px-4 py-2 text-[15px] font-semibold text-[var(--color-cs-brand)] hover:bg-[var(--color-cs-info-bg)] sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-cs-brand)] px-5 py-2.5 text-[15px] font-semibold text-white hover:bg-[var(--color-cs-brand-hover)]"
            >
              Get started
              <IconArrowRight size={18} stroke={2.2} />
            </Link>
          </div>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="mx-auto max-w-6xl px-6 pt-16 text-center sm:pt-20">
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-[var(--color-cs-text)] sm:text-5xl md:text-6xl">
          Stay under the limits that keep your benefits.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--color-cs-text-secondary)]">
          MyBenefitsPA links your bank, lines up your balances and deposits against the income and
          resource limits for your programs, and helps you report changes on time — in plain language.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-cs-brand)] px-6 py-3.5 text-base font-semibold text-white hover:bg-[var(--color-cs-brand-hover)]"
          >
            Get started free
            <IconArrowRight size={20} stroke={2.2} />
          </Link>
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-cs-border)] px-6 py-3.5 text-base font-semibold text-[var(--color-cs-text)] hover:bg-[var(--color-cs-nav-hover)]"
          >
            Sign in
          </Link>
        </div>

        <div className="mx-auto mt-12 max-w-5xl">
          <Shot
            src="/screenshots/dashboard.png"
            alt="MyBenefitsPA dashboard: each balance shown against its limit, with a what-if income slider"
            priority
            sizes="(min-width: 1024px) 1024px, 100vw"
          />
        </div>
      </section>

      {/* ---------- Trust strip ---------- */}
      <section className="mx-auto mt-10 max-w-5xl px-6">
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] px-6 py-5 text-[14px] text-[var(--color-cs-text-secondary)] sm:flex-row sm:gap-8">
          <span className="inline-flex items-center gap-2">
            <IconLock size={18} stroke={1.8} className="text-[var(--color-cs-brand)]" /> Read-only bank access
          </span>
          <span className="inline-flex items-center gap-2">
            <IconShieldCheck size={18} stroke={1.8} className="text-[var(--color-cs-brand)]" /> Encrypted, money never moves
          </span>
          <span className="inline-flex items-center gap-2">
            <IconReceipt2 size={18} stroke={1.8} className="text-[var(--color-cs-brand)]" /> Informational — not a determination
          </span>
        </div>
      </section>

      {/* ---------- Feature rows ---------- */}
      <div className="space-y-24 py-24 sm:space-y-28">
        <Feature
          eyebrow="Your money"
          title="Every deposit, categorized for your limits"
          body="Link accounts through Plaid and see income, benefits, and expenses in one place. Confirm a category and it counts the right way toward each program's income test — pending transactions and receipts included."
          src="/screenshots/money.png"
          alt="The Money screen: connected accounts and categorized transactions with receipts"
        />

        <Feature
          reverse
          eyebrow="Reporting"
          title="Know what to report, and by when"
          body={
            <>
              Every program&apos;s reporting clock in one place — scheduled paperwork you must file and change
              reports for life events. Pick what changed and see, per program, whether you{" "}
              <span className="font-semibold text-[var(--color-cs-text)]">report it</span> or{" "}
              <span className="font-semibold text-[var(--color-cs-text)]">don&apos;t need to</span>, with the
              deadline.
            </>
          }
          src="/screenshots/calendar.png"
          alt="The reporting calendar with a 'Do I need to report this?' panel by program"
        />

        <Feature
          eyebrow="Paperwork"
          title="Every benefit form, ready to fill"
          body="The reporting and recertification forms for your enrolled programs — SSDI, SSI, SNAP, Medicaid, ABLE and more. Fill the in-app ones (pre-filled from your profile), then download or open the official form to submit."
          src="/screenshots/reports.png"
          alt="Reports & Docs: SSDI and ABLE reporting and recertification forms"
        />

        <Feature
          reverse
          eyebrow="Guided forms"
          title="Fill a form by answering a few questions"
          body="Skip the dense PDF. The guided flow asks one plain-language question at a time and fills the form for you — switch to the full form anytime, and grab the official version when you're done."
          src="/screenshots/guided-form.png"
          alt="A guided, chat-style flow filling out the SSA-820 Work Activity Report"
        />
      </div>

      {/* ---------- Mobile showcase ---------- */}
      <section className="border-y border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] py-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-[var(--color-cs-brand)]">
            On the go
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[var(--color-cs-text)] sm:text-4xl">
            The whole thing fits in your pocket
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[17px] leading-relaxed text-[var(--color-cs-text-secondary)]">
            Ask the advisor, check your money, and keep receipts and documents — anywhere.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div>
              <PhoneShot
                src="/screenshots/advisor-mobile.png"
                alt="The AI advisor on a phone, answering a reporting question"
              />
              <p className="mt-4 text-[15px] font-semibold text-[var(--color-cs-text)]">Ask the advisor</p>
              <p className="mt-1 text-[14px] text-[var(--color-cs-text-secondary)]">
                Plain-language answers from your real numbers.
              </p>
            </div>
            <div>
              <PhoneShot
                src="/screenshots/money-mobile.png"
                alt="The Money screen on a phone with connected accounts and transactions"
              />
              <p className="mt-4 text-[15px] font-semibold text-[var(--color-cs-text)]">Track your money</p>
              <p className="mt-1 text-[14px] text-[var(--color-cs-text-secondary)]">
                Accounts and categorized activity in one tap.
              </p>
            </div>
            <div>
              <PhoneShot
                src="/screenshots/vault-mobile.png"
                alt="A receipt stored in the vault on a phone"
              />
              <p className="mt-4 text-[15px] font-semibold text-[var(--color-cs-text)]">Keep your paperwork</p>
              <p className="mt-1 text-[14px] text-[var(--color-cs-text-secondary)]">
                Receipts and documents, safe in the vault.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Closing CTA ---------- */}
      <section className="bg-[var(--color-cs-brand)] py-20">
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
              Create your account
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
      <footer className="bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <Image
            src="/mybenefitspa-logo.png"
            alt="MyBenefitsPA"
            width={180}
            height={142}
            className="h-8 w-auto"
          />
          <p className="text-sm text-[var(--color-cs-text-muted)]">
            © {new Date().getFullYear()} MyBenefitsPA. All rights reserved.
          </p>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--color-cs-text-secondary)]">
            <Link href="/resources" className="hover:text-[var(--color-cs-brand)]">Resources</Link>
            <Link href="/legal/privacy" className="hover:text-[var(--color-cs-brand)]">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-[var(--color-cs-brand)]">Terms</Link>
            <Link href="/legal/security" className="hover:text-[var(--color-cs-brand)]">Security</Link>
            <a href="mailto:support@mybenefitspa.com" className="hover:text-[var(--color-cs-brand)]">Support</a>
          </nav>
        </div>
        <div className="border-t border-[var(--color-cs-border)]">
          <p className="mx-auto max-w-6xl px-6 py-5 text-[11px] leading-relaxed text-[var(--color-cs-text-muted)]">
            Informational tool only. Not legal, tax, or benefits advice. Program limits change; always
            confirm with SSA, your state agency, or a qualified benefits counselor before acting.
          </p>
        </div>
      </footer>
    </div>
  );
}
