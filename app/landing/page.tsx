import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";
import type { Metadata } from "next";
import {
  IconBell,
  IconCalendarEvent,
  IconFileText,
  IconFolder,
  IconLock,
  IconShieldCheck,
  IconShieldLock,
  IconUsers,
  IconArrowsShuffle,
} from "@tabler/icons-react";
import { auth } from "@/auth";
import { HeroVideo } from "@/components/landing/hero-video";
import { MarketingFooter, MarketingHeader } from "@/components/landing/marketing-chrome";
import { InlineLoginForm } from "@/components/auth/inline-login-form";
import { LandingContinueCard } from "@/components/auth/landing-continue-card";
import { continueDestination } from "@/lib/auth/continue-destination";

export const metadata: Metadata = {
  title: "MyBenefitsPA — Act Before an Avoidable Lapse Becomes a Loss of Care",
  description:
    "MyBenefitsPA helps beneficiaries and authorized caregivers recognize approaching risks, organize required evidence, track critical deadlines, and preserve a clear record of what was submitted — working alongside Pennsylvania and federal benefit systems.",
};

type Icon = ComponentType<{ size?: number; stroke?: number; className?: string }>;

function Shot({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-[var(--color-cs-border)] bg-white shadow-[var(--shadow-cs-float)]">
      <Image
        src={src}
        alt={alt}
        width={2880}
        height={1800}
        priority={priority}
        sizes="(min-width: 1024px) 1024px, 100vw"
        className="block h-auto w-full"
      />
    </div>
  );
}

const NEED_ITEMS = [
  "Recognize when a financial, employment, household, or medical change may affect several programs.",
  "Understand notices and determine what action is required.",
  "Gather complete and acceptable evidence.",
  "Meet separate renewal, reporting, premium, reassessment, and appeal deadlines.",
  "Prove what was submitted and when.",
  "Follow up when information remains incomplete, unmatched, or unreviewed.",
  "Transfer responsibility safely when another caregiver must step in.",
];

const STEP1 = [
  {
    title: "Personalized Benefit Profile",
    body: "Create a program-by-program record for each beneficiary, including benefit types, renewal cycles, household relationships, authorized representatives, and caregiver responsibilities.",
  },
  {
    title: "Secure Evidence Vault",
    body: "Organize notices, bank statements, pay stubs, award letters, tax records, leases, medical documentation, waiver records, and submission confirmations in one indexed location.",
  },
  {
    title: "Authorized Caregiver Access",
    body: "Allow parents, adult children, siblings, guardians, trustees, fiduciaries, and other authorized representatives to participate through defined roles and permissions.",
  },
];

const STEP2 = [
  {
    title: "Deadline and Notice Tracking",
    body: "Track renewals, interviews, premiums, semiannual reports, work-reporting periods, medical reviews, waiver reassessments, and appeal deadlines separately.",
  },
  {
    title: "Financial and Work-Activity Monitoring",
    body: "With the beneficiary's consent, monitor wages, work activity, balances, deposits, and other changes that may require review under one or more benefit programs.",
  },
  {
    title: "Program-by-Program Impact Review",
    body: "Evaluate the same raise, extra paycheck, Social Security adjustment, gift, inheritance, marriage, move, or employment change separately under the rules of each affected program.",
  },
];

const STEP3 = [
  {
    title: "Notice-to-Action Guidance",
    body: "Convert notices and approaching deadlines into clear action steps identifying the affected program, required proof, responsible person, due date, and available follow-up.",
  },
  {
    title: "Submission and Evidence History",
    body: "Preserve what was required, what was submitted, when it was submitted, how it was transmitted, and what confirmation was received.",
  },
  {
    title: "Correction, Cure, and Appeal Support",
    body: "Identify when a threatened benefit may still be preserved through additional documentation, correction, reconsideration, reinstatement, continued-benefit rights, an appeal, or another potential eligibility pathway.",
  },
  {
    title: "Caregiver Coordination",
    body: "Assign responsibilities, maintain a shared record, and preserve essential knowledge when responsibility passes from one caregiver or fiduciary to another.",
  },
];

const TOOLS: { icon: Icon; title: string; body: string }[] = [
  {
    icon: IconCalendarEvent,
    title: "Renewal and Evidence Readiness",
    body: "Maintain a complete program calendar, prepare the required evidence before it is due, and preserve proof of submission and follow-up.",
  },
  {
    icon: IconBell,
    title: "Financial-Change and Benefit-Risk Alerts",
    body: "Identify wages, deposits, balances, gifts, inheritances, work activity, and other changes that may require review before they result in an overpayment, reduction, or closure.",
  },
  {
    icon: IconArrowsShuffle,
    title: "Cross-Program Coordination",
    body: "See how one event may affect Medicaid, QMB, SNAP, SSI, SSDI, DAC benefits, MAWD, Medicare Extra Help, waiver services, and other programs differently.",
  },
  {
    icon: IconUsers,
    title: "Caregiver Continuity",
    body: "Create a durable record that authorized parents, siblings, guardians, trustees, fiduciaries, and future caregivers can use without rebuilding years of benefit history.",
  },
  {
    icon: IconFileText,
    title: "Notice, Correction, and Appeal Readiness",
    body: "Preserve notices, deadlines, evidence, and submission records needed to correct an administrative problem, request reconsideration, protect continued-benefit rights, or pursue an appeal.",
  },
  {
    icon: IconFolder,
    title: "Secure Evidence Vault",
    body: "Keep notices, documents, explanations, and confirmations needed to demonstrate what was required and what you submitted.",
  },
];

export default async function LandingPage() {
  const session = await auth();
  const signedIn = Boolean(session?.user);
  const continueTo = signedIn
    ? continueDestination({
        name: session?.user?.name,
        onboardingStep: session?.user?.onboardingStep,
        applicationStatus: session?.user?.applicationStatus,
      })
    : null;

  return (
    <div className="overflow-x-hidden bg-[var(--color-cs-surface)] text-[var(--color-cs-text)]">
      <MarketingHeader continueHref={continueTo?.href} />

      {/* ---------- Hero ---------- */}
      <section id="sign-in" className="relative overflow-hidden">
        <HeroVideo />
        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-28 lg:py-36">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                  Coming soon
                </span>
                <p className="cs-eyebrow text-[#9ecbff]">
                  A Pennsylvania-first benefits continuity &amp; renewal compliance platform
                </p>
              </div>
              <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.6px] text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.45)] sm:text-[46px] md:text-[54px]">
                Act Before an Avoidable Lapse Becomes a Loss of Care
              </h1>
              <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-white/85 [text-shadow:0_1px_10px_rgba(0,0,0,0.4)] sm:text-lg">
                MyBenefitsPA helps beneficiaries and authorized caregivers recognize approaching
                risks, organize required evidence, track critical deadlines, and preserve a clear
                record of what was submitted and what follow-up remains.
              </p>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/75 [text-shadow:0_1px_10px_rgba(0,0,0,0.4)]">
                It works alongside Pennsylvania and federal benefit systems — not in place of them —
                so households can act accurately and on time when Medicaid, Medicare Savings
                Programs, SNAP, SSI, SSDI, MAWD, waiver services, or related benefits are at risk.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-sm bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-cs-navy)] hover:bg-white/90"
                >
                  See How MyBenefitsPA Works
                </a>
                <Link
                  href="/about#perspective"
                  className="inline-flex items-center justify-center rounded-sm border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/15"
                >
                  Read a Father&apos;s Perspective
                </Link>
              </div>
            </div>

            <div className="w-full max-w-[400px] justify-self-center lg:justify-self-end">
              {continueTo ? (
                <LandingContinueCard
                  name={session?.user?.name}
                  href={continueTo.href}
                  ctaLabel={continueTo.ctaLabel}
                />
              ) : (
                <InlineLoginForm />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trust row */}
      <section className="border-b border-[var(--color-cs-border)] bg-white py-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-4 px-6 text-[13px] font-medium text-[var(--color-cs-text-secondary)] sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-3">
          <span className="inline-flex items-center gap-2">
            <IconLock size={17} stroke={1.8} className="text-[var(--color-cs-brand)]" /> Independent
            and user-controlled
          </span>
          <span className="inline-flex items-center gap-2">
            <IconShieldLock size={17} stroke={1.8} className="text-[var(--color-cs-brand)]" /> Built
            for beneficiaries and authorized caregivers
          </span>
          <span className="inline-flex items-center gap-2">
            <IconShieldCheck size={17} stroke={1.8} className="text-[var(--color-cs-brand)]" /> Secure
            evidence and deadline management
          </span>
        </div>
        <p className="mx-auto mt-5 max-w-3xl px-6 text-center text-[12px] leading-relaxed text-[var(--color-cs-text-muted)]">
          Important: MyBenefitsPA is not a government agency and does not determine or guarantee
          eligibility.
        </p>
      </section>

      {/* Father's Perspective teaser */}
      <section
        id="perspective"
        className="border-b border-[var(--color-cs-border)] bg-gradient-to-b from-[#e7f0ff] to-[var(--color-cs-surface)] py-16 sm:py-20"
      >
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <p className="cs-eyebrow text-[var(--color-cs-brand)]">A Father&apos;s Perspective</p>
          <blockquote className="mt-4 border-l-[3px] border-[var(--color-cs-brand)] pl-5">
            <p className="text-[20px] font-medium leading-relaxed tracking-tight text-[var(--color-cs-text)] sm:text-[22px]">
              &ldquo;Keeping essential benefits should not depend on one person remembering every
              deadline, understanding every notice, and knowing where every document is stored.&rdquo;
            </p>
          </blockquote>
          <p className="mt-6 text-[16px] leading-relaxed text-[var(--color-cs-text-secondary)]">
            Frank, one of MyBenefitsPA&apos;s founders, is the father of an adult son with special
            needs. He helped create MyBenefitsPA to give families something official benefit systems
            do not provide: a durable, individualized operating record that identifies what is due,
            what proof is required, what risk is approaching, who is responsible, and what action
            remains available.
          </p>
          <Link
            href="/about#perspective"
            className="mt-5 inline-flex text-[14px] font-semibold text-[var(--color-cs-brand)] hover:underline"
          >
            Read the full story →
          </Link>
        </div>
      </section>

      {/* Why needed */}
      <section id="why" className="border-b border-[var(--color-cs-border)] bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <p className="cs-eyebrow text-[var(--color-cs-brand)]">The gap between transactions</p>
          <h2 className="mt-2 text-[28px] font-bold tracking-[-0.4px] text-[var(--color-cs-text)] sm:text-[34px]">
            Why MyBenefitsPA Is Needed
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-[var(--color-cs-text-secondary)]">
            Pennsylvania&apos;s official systems process applications, renewals, reported changes,
            documents, and eligibility decisions. But households and caregivers are still left to
            manage what happens between those transactions. They must:
          </p>
          <ul className="mt-6 space-y-3">
            {NEED_ITEMS.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-[15px] leading-relaxed text-[var(--color-cs-text)]"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-cs-brand)]" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[16px] leading-relaxed text-[var(--color-cs-text-secondary)]">
            MyBenefitsPA is being developed to address that operational gap.
          </p>
        </div>
      </section>

      {/* Product shot */}
      <section className="bg-gradient-to-b from-[#e7f0ff] to-[var(--color-cs-surface)] px-5 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="cs-eyebrow text-[var(--color-cs-brand)]">Your benefits continuity center</p>
            <h2 className="mt-3 text-[28px] font-bold leading-tight tracking-[-0.4px] text-[var(--color-cs-text)] sm:text-[34px]">
              See what is due, what proof is needed, and what comes next
            </h2>
          </div>
          <div className="mt-8 rounded-[28px] border border-[var(--color-cs-border)] bg-white p-2 shadow-[var(--shadow-cs-float)] sm:p-2.5">
            <Shot
              src="/screenshots/home-desktop.png"
              alt="The MyBenefitsPA home screen: each benefit shown against its limit, with upcoming renewals alongside"
              priority
            />
          </div>
        </div>
      </section>

      {/* How it works — 3 steps */}
      <section id="how-it-works" className="border-y border-[var(--color-cs-border)] bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <p className="cs-eyebrow text-[var(--color-cs-brand)]">How MyBenefitsPA helps</p>
          <h2 className="mt-2 max-w-3xl text-[28px] font-bold tracking-[-0.4px] text-[var(--color-cs-text)] sm:text-[34px]">
            Protect Benefit Continuity in Three Steps
          </h2>

          <div className="mt-12 space-y-14">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--color-cs-brand)]">
                Step 1
              </p>
              <h3 className="mt-1 text-[22px] font-bold tracking-tight text-[var(--color-cs-text)]">
                Build a Complete Benefits Record
              </h3>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {STEP1.map((item) => (
                  <div key={item.title} className="cs-card p-5">
                    <h4 className="text-[15px] font-semibold text-[var(--color-cs-text)]">
                      {item.title}
                    </h4>
                    <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-cs-text-secondary)]">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--color-cs-brand)]">
                Step 2
              </p>
              <h3 className="mt-1 text-[22px] font-bold tracking-tight text-[var(--color-cs-text)]">
                Identify Risks Before Action Is Taken
              </h3>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {STEP2.map((item) => (
                  <div key={item.title} className="cs-card p-5">
                    <h4 className="text-[15px] font-semibold text-[var(--color-cs-text)]">
                      {item.title}
                    </h4>
                    <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-cs-text-secondary)]">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[14px] font-medium text-[var(--color-cs-text-secondary)]">
                A transaction is flagged for review. It is not automatically treated as countable
                income or a countable resource.
              </p>
            </div>

            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--color-cs-brand)]">
                Step 3
              </p>
              <h3 className="mt-1 text-[22px] font-bold tracking-tight text-[var(--color-cs-text)]">
                Act, Document, and Follow Up
              </h3>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {STEP3.map((item) => (
                  <div key={item.title} className="cs-card p-5">
                    <h4 className="text-[15px] font-semibold text-[var(--color-cs-text)]">
                      {item.title}
                    </h4>
                    <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-cs-text-secondary)]">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alongside official systems */}
      <section className="bg-[#0b1426] py-16 text-white sm:py-20">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.5px] text-[#64b5ff]">
            Alongside official systems
          </p>
          <h2 className="mt-3 text-[28px] font-bold leading-tight tracking-[-0.4px] sm:text-[34px]">
            Designed to Work Alongside Official Systems
          </h2>
          <div className="mt-5 space-y-4 text-[16px] leading-relaxed text-white/70">
            <p>
              MyBenefitsPA does not replace COMPASS, myCOMPASS, the Pennsylvania Department of Human
              Services, County Assistance Offices, the Social Security Administration, Medicare,
              managed-care plans, or any other official eligibility or case-management system.
            </p>
            <p>
              Official agencies continue to determine eligibility and issue binding decisions.
              Beneficiaries and caregivers continue to use agency-approved channels to apply, renew,
              report changes, submit evidence, and pursue appeals.
            </p>
            <p>
              MyBenefitsPA prepares the household to complete those responsibilities accurately and
              on time. Direct integration or electronic submission to a government system would occur
              only where it is authorized, technically available, and permitted by the responsible
              agency.
            </p>
          </div>
        </div>
      </section>

      {/* Key tools / Features */}
      <section
        id="features"
        className="bg-gradient-to-b from-[#e8faef] to-[var(--color-cs-surface)] py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="max-w-2xl">
            <p className="cs-eyebrow text-[var(--color-cs-brand)]">Key tools</p>
            <h2 className="mt-2 text-[28px] font-bold tracking-[-0.4px] text-[var(--color-cs-text)] sm:text-[34px]">
              For Beneficiaries and Caregivers
            </h2>
          </div>
          <div id="tools" className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((f) => (
              <div key={f.title} className="cs-card p-5 sm:p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--color-cs-info-bg)] text-[var(--color-cs-brand)]">
                  <f.icon size={20} stroke={1.8} />
                </span>
                <h3 className="mt-3.5 text-[16px] font-semibold text-[var(--color-cs-text)]">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--color-cs-text-secondary)]">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calendar + vault shots */}
      <section className="border-y border-[var(--color-cs-border)] bg-white px-5 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-2">
          <div>
            <p className="cs-eyebrow text-[var(--color-cs-brand)]">Program calendar</p>
            <h2 className="mt-2 text-[24px] font-bold tracking-tight text-[var(--color-cs-text)] sm:text-[28px]">
              Every deadline in one place
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-cs-text-secondary)]">
              Renewals, reporting periods, premiums, reassessments, and appeal deadlines — tracked
              separately so nothing is collapsed into a single generic reminder.
            </p>
            <div className="mt-6 rounded-[22px] border border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] p-2 shadow-[var(--shadow-cs-float)]">
              <Shot
                src="/screenshots/calendar-desktop.png"
                alt="The MyBenefitsPA calendar with upcoming renewals and due dates"
              />
            </div>
          </div>
          <div>
            <p className="cs-eyebrow text-[var(--color-cs-brand)]">Evidence vault</p>
            <h2 className="mt-2 text-[24px] font-bold tracking-tight text-[var(--color-cs-text)] sm:text-[28px]">
              Your evidence and submission record
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-cs-text-secondary)]">
              Keep the notices, documents, explanations, and confirmations needed to demonstrate what
              was required and what you submitted.
            </p>
            <div className="mt-6 rounded-[22px] border border-[var(--color-cs-border)] bg-[var(--color-cs-surface)] p-2 shadow-[var(--shadow-cs-float)]">
              <Shot
                src="/screenshots/vault-desktop.png"
                alt="The MyBenefitsPA vault with labeled folders for benefit evidence"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Get started CTA */}
      <section id="get-started" className="bg-gradient-to-b from-[#fff4e6] to-[var(--color-cs-surface)] py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-5 text-center sm:px-6">
          <p className="cs-eyebrow text-[var(--color-cs-brand)]">Get started</p>
          <h2 className="mt-2 text-[28px] font-bold tracking-[-0.4px] text-[var(--color-cs-text)] sm:text-[34px]">
            Build the Record Behind Your Benefits
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-[var(--color-cs-text-secondary)]">
            A preventable benefit loss may begin with a missed notice, incomplete evidence, an
            unexplained deposit, a reporting deadline, or a document that cannot later be proven to
            have been submitted. MyBenefitsPA is designed to help households recognize those risks
            while action is still possible.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#how-it-works" className="cs-btn cs-btn-primary !px-6 !py-3 !text-[15px]">
              Explore MyBenefitsPA
            </a>
            <a href="#sign-in" className="cs-btn cs-btn-secondary !px-6 !py-3 !text-[15px]">
              {signedIn ? "Continue to your account" : "Join the Early Access List"}
            </a>
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-[12px] leading-relaxed text-[var(--color-cs-text-muted)]">
            Important notice: MyBenefitsPA is not a government agency and does not determine or
            guarantee eligibility, benefit amounts, continued coverage, or the outcome of any agency
            proceeding. MyBenefitsPA does not replace official agency instructions or individualized
            legal, tax, financial, medical, or benefits advice.
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
