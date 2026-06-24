import type { Metadata } from "next";
import { Bullets, DocHeader, Section, Table } from "../_components";

export const metadata: Metadata = {
  title: "Terms and Conditions — MyBenefitsPA",
  description:
    "Terms governing access to and use of the MyBenefitsPA platform, integrations, and related services.",
};

export default function TermsPage() {
  return (
    <article>
      <DocHeader
        title="Terms and Conditions"
        intro={
          <>
            Designed for: personal banking information accessed through Plaid or similar integrations;
            personal information; SSN and identity data; disability, medical, and public-benefit
            records; Medicaid, SSI, SSDI, SNAP, MAWD, Medicare Savings Programs, QMB, waiver programs,
            and related eligibility/renewal monitoring.
          </>
        }
      />

      <Section title="1. Acceptance of Terms">
        <p>
          These Terms and Conditions govern access to and use of the MyBenefitsPA website, application,
          platform, alerts, AI-assisted features, document storage, advisor/caregiver tools,
          financial-data integrations, and related services. By creating an account, connecting a
          financial account, uploading documents, inviting an advisor, or otherwise using the Platform,
          the user agrees to these Terms.
        </p>
        <p>
          If the user is acting for a Beneficiary, the user represents that the user has lawful
          authority to accept these Terms, provide the Beneficiary&apos;s information, connect financial
          accounts, upload documents, and authorize advisor or caregiver access.
        </p>
      </Section>

      <Section title="2. Description of Services">
        <p>
          MyBenefitsPA provides a technology platform for organizing and monitoring information relevant
          to public benefits and financial eligibility. Features may include Plaid-connected
          financial-data retrieval, income and asset monitoring, renewal reminders, document storage,
          AI-assisted summaries, compliance alerts, advisor access, and user-requested reports.
        </p>
        <p>
          Supported benefit categories may include Medicaid, SSI, SSDI, SNAP, MAWD, Medicare Savings
          Programs, QMB, waiver programs, and other public-benefits programs configured by the Platform.
          Feature availability may vary by state, program, user account, integration provider, and data
          quality.
        </p>
      </Section>

      <Section title="3. Important Disclaimers">
        <Bullets
          items={[
            "MyBenefitsPA is not a federal, state, or local government agency and is not affiliated with SSA, CMS, Medicaid, SNAP, MAWD, any state Medicaid agency, any county assistance office, or any financial institution.",
            "MyBenefitsPA does not provide legal, medical, tax, accounting, fiduciary, investment, representative-payee, guardianship, public-benefits legal, or government-agency advice.",
            "Platform outputs are informational and operational support tools only. They are not official eligibility determinations, agency notices, benefit approvals, benefit denials, renewal approvals, legal opinions, or financial advice.",
            "MyBenefitsPA does not guarantee eligibility, continued eligibility, benefit approval, renewal success, avoidance of overpayment, avoidance of benefit reduction or termination, or accuracy of agency action.",
            "Users remain responsible for reading official agency notices, reporting changes, preserving records, filing renewals, submitting forms, responding to deadlines, and consulting qualified professionals when needed.",
          ]}
        />
      </Section>

      <Section title="4. Eligibility and Accounts">
        <p>
          The Platform is intended for users age 18 or older in the United States. Users must provide
          accurate, current, and complete account information and keep it updated. Users are responsible
          for safeguarding account credentials, using strong authentication, and promptly notifying
          MyBenefitsPA of suspected unauthorized access.
        </p>
        <p>
          MyBenefitsPA may require multi-factor authentication for accounts that access sensitive
          information, advisor accounts, administrative roles, and high-risk login events. MyBenefitsPA
          may suspend or restrict access to protect users, the Platform, or affected Beneficiaries.
        </p>
      </Section>

      <Section title="5. Beneficiary, Advisor, and Caregiver Authority">
        <Table
          headers={["Role", "Required Warranty", "Permitted Scope"]}
          rows={[
            [
              "Beneficiary",
              "The Beneficiary may provide and authorize processing of the Beneficiary's own data.",
              "Access own account, documents, integrations, alerts, and settings.",
            ],
            [
              "Parent/guardian/agent",
              "The user has lawful authority through guardianship, power of attorney, representative-payee status, trust authority, court order, or other valid authorization.",
              "Access and manage only the data and features within that authority.",
            ],
            [
              "Advisor/caregiver",
              "The user has been invited or otherwise authorized and will comply with all access limits and confidentiality duties.",
              "View or act only within the role, data categories, and permitted actions granted.",
            ],
          ]}
        />
        <p>
          Users must not upload another person&apos;s information, connect another person&apos;s
          financial account, or invite an advisor unless they have lawful authority. MyBenefitsPA may
          request documentation and may suspend access if authority is disputed, revoked, expired,
          incomplete, or reasonably suspected to be misused.
        </p>
      </Section>

      <Section title="6. Financial-Data Integrations">
        <p>
          The Platform may integrate with Plaid or similar financial-data providers. By connecting a
          financial account, the user authorizes MyBenefitsPA and the provider to access, retrieve,
          transmit, process, and store authorized financial information for Platform services. The
          user&apos;s use of the provider is subject to the provider&apos;s own terms and privacy
          policy.
        </p>
        <Bullets
          items={[
            "MyBenefitsPA does not collect or store financial-institution login credentials.",
            "Financial data may include account metadata, balances, transactions, account ownership information where authorized, and connection status.",
            "Data may be refreshed periodically so that alerts and monitoring remain current.",
            "Users may disconnect accounts. Disconnection stops future retrieval but historical data may be retained under the Data Retention and Deletion Policy.",
            "Users must connect only accounts they own or are legally authorized to access.",
          ]}
        />
      </Section>

      <Section title="7. User Responsibilities for Benefit Monitoring">
        <p>
          Users must verify benefit rules and thresholds applicable to the user&apos;s state,
          household, program category, disability status, income source, asset type, reporting period,
          and agency notices. Rules may change, may be interpreted differently by agencies, and may
          depend on facts not available to the Platform.
        </p>
        <Bullets
          items={[
            "The user must review Platform alerts promptly and independently confirm deadlines and reporting duties.",
            "The user must maintain complete and accurate financial, household, medical, residency, and benefits information.",
            "The user must not rely on MyBenefitsPA as the sole source for official benefit eligibility, renewal, appeal, or reporting decisions.",
            "The user must notify MyBenefitsPA of integration errors, missing accounts, incorrect transaction classifications, missing documents, outdated program settings, or disputed advisor access.",
          ]}
        />
      </Section>

      <Section title="8. AI-Assisted Features">
        <p>
          AI-assisted features may summarize documents, classify transactions, identify recurring
          deposits, draft checklists, generate reminders, or provide informational explanations. AI
          outputs may be incomplete, outdated, inaccurate, or based on user data that is missing or
          incorrectly classified. Users must review, verify, and correct outputs before relying on them.
        </p>
        <p>
          MyBenefitsPA does not authorize users to submit AI-generated materials to an agency or court
          without human review. Users are solely responsible for final decisions, filings, submissions,
          reports, appeals, and communications.
        </p>
      </Section>

      <Section title="9. Privacy, Security, and Retention">
        <p>
          The Privacy Policy, Security and Safeguards Policy, and Data Retention and Deletion Policy are
          incorporated into these Terms. Users agree that MyBenefitsPA may process personal information,
          Sensitive Data, Financial Data, documents, AI interactions, and usage data as described in
          those policies.
        </p>
        <p>
          No security program can guarantee absolute security. Users must maintain secure devices, avoid
          credential sharing, use MFA where available or required, and report suspected unauthorized
          access promptly.
        </p>
      </Section>

      <Section title="10. User Content and License">
        <p>
          Users retain ownership of documents, records, data, and other content uploaded to the
          Platform. Users grant MyBenefitsPA a limited, non-exclusive, worldwide license to host,
          store, copy, transmit, analyze, classify, summarize, display, and process User Content solely
          to provide, secure, support, improve, and comply with the Platform services and legal
          obligations.
        </p>
        <p>
          Users represent that User Content is accurate to the best of their knowledge, that they have
          rights and authority to provide it, and that providing it does not violate law, contract,
          fiduciary duty, confidentiality duty, or another person&apos;s rights.
        </p>
      </Section>

      <Section title="11. Acceptable Use">
        <Bullets
          items={[
            "Do not use the Platform for unlawful, fraudulent, abusive, harmful, or unauthorized purposes.",
            "Do not attempt to access another user's account, Beneficiary profile, financial account, advisor account, or MyBenefitsPA system without authorization.",
            "Do not upload malware, interfere with security controls, scrape the Platform, reverse engineer non-public systems, or bypass usage limits.",
            "Do not impersonate a Beneficiary, advisor, government official, agency, financial institution, or legal representative.",
            "Do not use Platform outputs to mislead agencies, conceal assets or income, commit fraud, or make false benefit submissions.",
          ]}
        />
      </Section>

      <Section title="12. Fees and Paid Services">
        <p>
          If paid services are offered, pricing, renewal, cancellation, refund, and billing terms will
          be disclosed at purchase or in a separate order form. MyBenefitsPA may change fees
          prospectively with reasonable notice where required. Third-party charges, government fees,
          professional fees, and financial-institution charges are not included unless expressly stated.
        </p>
      </Section>

      <Section title="13. Suspension and Termination">
        <p>
          MyBenefitsPA may suspend or terminate accounts, restrict features, disconnect integrations, or
          revoke advisor access if MyBenefitsPA reasonably believes that the account is insecure,
          authority is disputed, data is being misused, the Terms are violated, legal compliance
          requires action, or continued access may harm a user, Beneficiary, the Platform, or a third
          party.
        </p>
        <p>
          Upon termination, access ends immediately. Data will be handled under the Data Retention and
          Deletion Policy. Certain records may remain in encrypted archives, audit logs, backups, legal
          holds, security records, and compliance systems as permitted by law.
        </p>
      </Section>

      <Section title="14. Third-Party Services">
        <p>
          The Platform may rely on third-party providers, including Plaid, cloud hosting providers,
          communications providers, security tools, analytics tools, payment processors, AI service
          providers, and support platforms. MyBenefitsPA is not responsible for third-party services
          outside MyBenefitsPA&apos;s reasonable control. Third-party terms and privacy policies may
          apply.
        </p>
      </Section>

      <Section title="15. Intellectual Property">
        <p>
          MyBenefitsPA and its licensors own all rights in the Platform, software, workflows, designs,
          models, templates, rules engines, documentation, logos, trademarks, content, and technology,
          excluding User Content. Users receive a limited, revocable, non-exclusive, non-transferable
          license to use the Platform according to these Terms.
        </p>
      </Section>

      <Section title="16. Disclaimers and Limitation of Liability">
        <p>
          To the maximum extent permitted by applicable law, the Platform is provided &ldquo;as
          is&rdquo; and &ldquo;as available,&rdquo; without warranties of any kind, whether express,
          implied, statutory, or otherwise, including merchantability, fitness for a particular purpose,
          non-infringement, accuracy, availability, benefit eligibility, or uninterrupted operation.
        </p>
        <p>
          To the maximum extent permitted by applicable law, MyBenefitsPA will not be liable for
          indirect, incidental, consequential, special, exemplary, punitive, or enhanced damages; lost
          profits; lost benefits; benefit denials; benefit reductions; overpayment claims; lost data;
          goodwill; business interruption; or third-party conduct, even if advised of the possibility of
          such damages. Nothing in these Terms limits liability that cannot legally be limited.
        </p>
      </Section>

      <Section title="17. Indemnification">
        <p>
          To the extent permitted by law, users agree to defend, indemnify, and hold harmless
          MyBenefitsPA from claims, damages, losses, liabilities, costs, and expenses arising from the
          user&apos;s misuse of the Platform, violation of these Terms, unauthorized access to another
          person&apos;s data, inaccurate authority representations, unlawful benefit submissions, or
          violation of another person&apos;s rights.
        </p>
      </Section>

      <Section title="18. Governing Law, Venue, and Consumer Rights">
        <p>
          These Terms are governed by Delaware law, without regard to conflict-of-law rules. Subject to
          any non-waivable consumer, privacy, arbitration, venue, or statutory rights, legal proceedings
          arising from these Terms will be brought in state or federal courts located in Delaware. This
          Delaware provision does not waive rights that users may have under the privacy,
          consumer-protection, benefits, health-data, or breach-notification laws of their state of
          residence.
        </p>
      </Section>

      <Section title="19. Changes and Contact">
        <p>
          MyBenefitsPA may update these Terms from time to time. Material changes will be communicated
          by posting an updated version and, where required, additional notice. Continued use after the
          effective date means acceptance of the updated Terms.
        </p>
        <p>
          General terms questions: support@mybenefitspa.com. Privacy questions:
          privacy@mybenefitspa.com. Security reports: security@mybenefitspa.com. Website:
          www.mybenefitspa.com.
        </p>
      </Section>
    </article>
  );
}
