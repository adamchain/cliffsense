import type { Metadata } from "next";
import { auth } from "@/auth";
import { MarketingFooter, MarketingHeader } from "@/components/landing/marketing-chrome";
import { continueDestination } from "@/lib/auth/continue-destination";

export const metadata: Metadata = {
  title: "About Us — MyBenefitsPA",
  description:
    "Preserving access. Strengthening caregiver capacity. Reducing avoidable benefit loss. Learn why MyBenefitsPA is being built for Pennsylvania beneficiaries and authorized caregivers.",
};

const PROBLEM_GAPS = [
  "What is approaching.",
  "What must be reported.",
  "What evidence is required.",
  "Who is responsible.",
  "What was submitted.",
  "Whether the submission was accepted.",
  "What follow-up remains.",
  "What corrective or alternative action may still be available.",
];

const CAPABILITIES = [
  {
    title: "Convert Rules Into Timely Actions",
    body: "Translate program-specific requirements into understandable tasks, deadlines, evidence requests, and follow-up steps.",
  },
  {
    title: "Create a Reliable Evidence Record",
    body: "Preserve notices, supporting documents, submission confirmations, work records, financial records, and the history needed for renewals, corrections, reconsiderations, and appeals.",
  },
  {
    title: "Anticipate Financial and Reporting Risks",
    body: "Identify income, asset, work-activity, household, and other changes that may affect several programs differently before an official adverse action occurs.",
  },
  {
    title: "Support Authorized Caregivers",
    body: "Give authorized parents, siblings, guardians, trustees, fiduciaries, and other representatives a structured way to manage benefits for another person.",
  },
  {
    title: "Coordinate Multiple Programs",
    body: "Maintain separate rules, deadlines, and action histories for Medicaid, Medicare Savings Programs, SNAP, SSI, SSDI, DAC benefits, MAWD, waiver services, Medicare Extra Help, and related programs.",
  },
  {
    title: "Identify Corrective and Alternative Pathways",
    body: "Help users recognize when coverage or assistance may be preserved through additional evidence, cure procedures, reconsideration, reinstatement, an appeal, continued-benefit rights, or another potential eligibility category.",
  },
];

const AUDIENCES = [
  "Older adults whose children coordinate Medicare, Medicaid, QMB, Extra Help, or Community HealthChoices.",
  "Parents and guardians of children or adults with intellectual disabilities, autism, or other lifelong support needs.",
  "ODP waiver, HCBS, and self-directed-service households.",
  "SSI recipients managing income, resources, reporting, and redeterminations.",
  "SSDI and DAC beneficiaries who work and must track earnings and work incentives.",
  "MAWD participants managing employment, premiums, and continued Medicaid.",
  "SNAP households managing interviews, recertifications, work rules, and evidence.",
  "Guardians, trustees, fiduciaries, authorized representatives, attorneys, advocates, and special-needs professionals assisting another person.",
];

const TRUST = [
  "Beneficiary consent and documented caregiver authorization.",
  "Role-based access and revocable permissions.",
  "Encryption and appropriate security controls.",
  "Data minimization and limited retention.",
  "Auditable user and caregiver activity.",
  "Clear separation between preliminary alerts and official eligibility decisions.",
  "No sale of beneficiary financial or benefit information.",
  "No advertising-tracking pixels on authenticated user pages.",
  "De-identified analytics where information is used to evaluate program outcomes.",
];

export default async function AboutPage() {
  const session = await auth();
  const continueTo = session?.user
    ? continueDestination({
        name: session.user.name,
        onboardingStep: session.user.onboardingStep,
        applicationStatus: session.user.applicationStatus,
      })
    : null;

  return (
    <div className="overflow-x-hidden bg-[var(--color-cs-surface)] text-[var(--color-cs-text)]">
      <MarketingHeader continueHref={continueTo?.href} />

      <main>
        {/* Intro */}
        <section className="border-b border-[var(--color-cs-border)] bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-5 sm:px-6">
            <p className="cs-eyebrow text-[var(--color-cs-brand)]">About MyBenefitsPA</p>
            <h1 className="mt-2 text-[32px] font-bold leading-tight tracking-[-0.5px] text-[var(--color-cs-text)] sm:text-[40px]">
              Preserving Access. Strengthening Caregiver Capacity. Reducing Avoidable Benefit Loss.
            </h1>
            <div className="mt-6 space-y-4 text-[16px] leading-relaxed text-[var(--color-cs-text-secondary)]">
              <p>
                MyBenefitsPA is a Pennsylvania-first benefits continuity and renewal compliance
                platform being developed for beneficiaries, families, and authorized caregivers.
              </p>
              <p>
                It is designed to organize the documents, notices, deadlines, income, assets, work
                activity, premiums, reassessments, and reporting obligations involved in maintaining
                Medicaid and other public benefits.
              </p>
              <p>
                MyBenefitsPA does not replace Pennsylvania&apos;s eligibility infrastructure. It
                fills a different need: helping households manage the continuous responsibilities
                that arise between applications, renewals, agency decisions, and other official
                transactions.
              </p>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="border-b border-[var(--color-cs-border)] bg-gradient-to-b from-[#e7f0ff] to-[var(--color-cs-surface)] py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-5 sm:px-6">
            <h2 className="text-[26px] font-bold tracking-[-0.4px] text-[var(--color-cs-text)] sm:text-[32px]">
              The Problem We Are Addressing
            </h2>
            <div className="mt-5 space-y-4 text-[16px] leading-relaxed text-[var(--color-cs-text-secondary)]">
              <p>
                Public-benefit eligibility is rarely managed through one program, one agency, or one
                annual renewal.
              </p>
              <p>
                A single person may receive Medicare, Medicaid, QMB, Medicare Extra Help, Community
                HealthChoices, waiver services, SSI, SSDI, DAC benefits, MAWD, and SNAP. Each program
                may apply different financial rules, reporting requirements, review dates, evidence
                standards, and appeal deadlines.
              </p>
              <p>
                Official systems record case actions and make eligibility decisions. They do not give
                every household a single, durable operating record showing:
              </p>
            </div>
            <ul className="mt-5 space-y-2.5">
              {PROBLEM_GAPS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-[15px] font-medium text-[var(--color-cs-text)]"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-cs-brand)]" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[16px] leading-relaxed text-[var(--color-cs-text-secondary)]">
              Pennsylvania&apos;s own records show that closures associated with missing information,
              expired certification periods, unmet reporting obligations, and financial changes recur
              at substantial scale. MyBenefitsPA is designed around prevention: readiness, deadlines,
              evidence, accountability, and follow-up before an avoidable interruption becomes a loss
              of care.
            </p>
          </div>
        </section>

        {/* Perspective */}
        <section
          id="perspective"
          className="border-b border-[var(--color-cs-border)] bg-white py-16 sm:py-20"
        >
          <div className="mx-auto max-w-3xl px-5 sm:px-6">
            <h2 className="text-[26px] font-bold tracking-[-0.4px] text-[var(--color-cs-text)] sm:text-[32px]">
              Built From Firsthand Experience
            </h2>
            <div className="mt-5 space-y-4 text-[16px] leading-relaxed text-[var(--color-cs-text-secondary)]">
              <p>MyBenefitsPA grew from a personal need.</p>
              <p>
                One of our founders, Frank, is the father of an adult son with special needs. Frank
                experienced firsthand the continuing demands of maintaining multiple public benefits:
                tracking renewal dates, retaining notices, organizing financial records, monitoring
                work and income, and understanding how different programs may respond to the same
                event.
              </p>
              <p>
                He also understood that the system he had developed existed largely in one
                person&apos;s files and memory. Without a durable record and an orderly transition
                process, that responsibility would eventually pass to siblings, fiduciaries, or other
                caregivers who might not have the benefit history or institutional knowledge needed
                to act quickly.
              </p>
              <p>
                Frank set out to help build the tool he wished his family already had: a secure,
                caregiver-capable platform that preserves the household&apos;s benefit record,
                identifies approaching risks, coordinates responsibilities, and shows the next
                available action.
              </p>
            </div>
            <blockquote className="mt-8 border-l-[3px] border-[var(--color-cs-brand)] pl-5">
              <p className="text-[17px] font-medium leading-relaxed text-[var(--color-cs-text)]">
                &ldquo;Keeping essential benefits should not depend on one person remembering every
                deadline, understanding every notice, and knowing where every document is
                stored.&rdquo;
              </p>
            </blockquote>
          </div>
        </section>

        {/* What we're building */}
        <section className="border-b border-[var(--color-cs-border)] bg-gradient-to-b from-[#e8faef] to-[var(--color-cs-surface)] py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-5 sm:px-6">
            <h2 className="text-[26px] font-bold tracking-[-0.4px] text-[var(--color-cs-text)] sm:text-[32px]">
              What MyBenefitsPA Is Being Built to Do
            </h2>
            <div className="mt-8 space-y-5">
              {CAPABILITIES.map((c) => (
                <div
                  key={c.title}
                  className="rounded-[16px] border border-[var(--color-cs-border)] bg-white p-5"
                >
                  <h3 className="text-[16px] font-semibold text-[var(--color-cs-text)]">{c.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-cs-text-secondary)]">
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Audiences */}
        <section className="border-b border-[var(--color-cs-border)] bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-5 sm:px-6">
            <h2 className="text-[26px] font-bold tracking-[-0.4px] text-[var(--color-cs-text)] sm:text-[32px]">
              Designed for Real-World Caregiving
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-[var(--color-cs-text-secondary)]">
              MyBenefitsPA is designed for both beneficiary-directed and caregiver-managed
              households, including:
            </p>
            <ul className="mt-6 space-y-3">
              {AUDIENCES.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-[15px] leading-relaxed text-[var(--color-cs-text)]"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-cs-brand)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Mission */}
        <section className="border-b border-[var(--color-cs-border)] bg-[#0b1426] py-16 text-white sm:py-20">
          <div className="mx-auto max-w-3xl px-5 sm:px-6">
            <p className="text-[12px] font-semibold uppercase tracking-[0.5px] text-[#64b5ff]">
              Our mission
            </p>
            <h2 className="mt-3 text-[26px] font-bold leading-tight tracking-[-0.4px] sm:text-[32px]">
              Reduce avoidable benefit loss
            </h2>
            <div className="mt-5 space-y-4 text-[16px] leading-relaxed text-white/70">
              <p>
                Our mission is to reduce avoidable benefit loss by giving eligible Pennsylvanians and
                their authorized caregivers the records, warnings, accountability, and workflows
                needed to act accurately and on time.
              </p>
              <p>
                We believe access to healthcare, nutrition assistance, disability support, premium
                assistance, and home- and community-based services should not be interrupted merely
                because a household lacked an organized record, missed a fragmented notice, submitted
                incomplete evidence, or could not prove what it had already provided.
              </p>
              <p>
                MyBenefitsPA bridges the operational gap between official benefit systems and the
                people who must manage their requirements every day.
              </p>
            </div>
          </div>
        </section>

        {/* Trust */}
        <section className="bg-gradient-to-b from-[#fff4e6] to-[var(--color-cs-surface)] py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-5 sm:px-6">
            <h2 className="text-[26px] font-bold tracking-[-0.4px] text-[var(--color-cs-text)] sm:text-[32px]">
              Trust and Responsible Use
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-[var(--color-cs-text-secondary)]">
              A benefit-continuity platform must earn and preserve the trust of the people who use
              it. MyBenefitsPA is being designed around:
            </p>
            <ul className="mt-6 space-y-2.5">
              {TRUST.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-[15px] leading-relaxed text-[var(--color-cs-text)]"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-cs-brand)]" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-[13px] leading-relaxed text-[var(--color-cs-text-muted)]">
              Important notice: MyBenefitsPA is not a government agency and does not determine or
              guarantee eligibility, continued coverage, benefit amounts, or the outcome of any
              application, renewal, reconsideration, or appeal. Information provided through
              MyBenefitsPA does not replace official agency instructions or individualized legal,
              tax, financial, medical, or benefits advice.
            </p>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
