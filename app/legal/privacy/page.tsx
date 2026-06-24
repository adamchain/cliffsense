import type { Metadata } from "next";
import { Bullets, DocHeader, Section, Table } from "../_components";

export const metadata: Metadata = {
  title: "Privacy Policy — MyBenefitsPA",
  description:
    "How MyBenefitsPA collects, uses, discloses, protects, retains, and deletes personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <article>
      <DocHeader
        title="Privacy Policy"
        intro={
          <>
            Designed for: personal banking information accessed through Plaid or similar integrations;
            personal information; SSN and identity data; disability, medical, and public-benefit
            records; Medicaid, SSI, SSDI, SNAP, MAWD, Medicare Savings Programs, QMB, waiver programs,
            and related eligibility/renewal monitoring.
          </>
        }
      />

      <Section title="1. Introduction and Scope">
        <p>
          This Privacy Policy explains how MyBenefitsPA Inc. collects, uses, discloses, protects,
          retains, and deletes personal information in connection with the MyBenefitsPA website,
          applications, software-as-a-service platform, alerts, document storage, advisor/caregiver
          features, AI-assisted guidance, and financial-data integrations.
        </p>
        <p>
          The Platform is intended to help users and authorized advisors organize and monitor
          information relevant to public-benefit eligibility, renewal deadlines, income and asset
          thresholds, and supporting documentation. MyBenefitsPA is not a government agency, is not
          affiliated with SSA, CMS, Medicaid, SNAP, MAWD, any state Medicaid agency, any county
          assistance office, or any financial institution, and does not guarantee benefit eligibility,
          approval, renewal, or avoidance of overpayment.
        </p>
        <p>
          This Policy is designed to address federal and state privacy and data-security requirements
          where applicable, including consumer privacy laws such as the Delaware Personal Data Privacy
          Act, federal privacy and unfair-practices standards enforced by the FTC, financial-data
          safeguards where applicable, HIPAA obligations where MyBenefitsPA acts as a covered entity or
          business associate, and state consumer-health-data requirements where applicable.
        </p>
      </Section>

      <Section title="2. Key Definitions">
        <Table
          headers={["Term", "Meaning"]}
          rows={[
            [
              "Beneficiary",
              "The person whose benefits, income, assets, documents, eligibility information, or deadlines are being monitored.",
            ],
            [
              "Advisor or Caregiver",
              "A person authorized by a Beneficiary or legal authority document to assist with benefit monitoring, recordkeeping, or renewals.",
            ],
            [
              "Financial Data",
              "Bank account information, balances, transactions, institution name, account identifiers, income deposits, asset data, and related metadata obtained from Plaid or another authorized integration.",
            ],
            [
              "Sensitive Data",
              "Information such as SSN, precise geolocation, financial account data, disability documentation, diagnosis or health-related information, government benefits records, and other data classified as sensitive under applicable law.",
            ],
            [
              "PHI",
              "Protected Health Information as defined by HIPAA, but only when MyBenefitsPA is legally acting as a covered entity or business associate. Health or disability information uploaded directly by a consumer may be sensitive health information even if it is not HIPAA PHI.",
            ],
            [
              "Consumer Health Data",
              "Personal information linked or reasonably linkable to a consumer and concerning health, disability, diagnosis, treatment, benefits eligibility, or related status, where applicable state laws define or regulate such information.",
            ],
          ]}
        />
      </Section>

      <Section title="3. Information We Collect">
        <Table
          headers={["Category", "Examples", "Primary Purpose"]}
          rows={[
            [
              "Account and contact data",
              "Name, email address, phone number, mailing address, account type, hashed password, authentication settings.",
              "Create accounts, authenticate users, send account notices, support services.",
            ],
            [
              "Identity and beneficiary profile data",
              "Date of birth, SSN or other government identifiers, disability status documentation, household data, residency, representative-payee or guardianship status.",
              "Configure eligibility monitoring, verify identity, support benefits records, enable authorized access.",
            ],
            [
              "Public-benefits data",
              "Medicaid, SSI, SSDI, SNAP, MAWD, QMB, Medicare Savings Program, waiver, renewal, notice, income, resource, and case-status information.",
              "Generate reminders, monitor thresholds, support renewals and appeals, maintain user records.",
            ],
            [
              "Financial data from integrations",
              "Account type, institution, account mask, balances, transactions, income deposits, transfers, transaction categories, and connection status.",
              "Monitor income/assets, detect threshold risk, prepare benefit reports, generate alerts.",
            ],
            [
              "Documents and files",
              "Agency notices, bank statements, medical/disability documentation, powers of attorney, guardianship orders, representative-payee documents, correspondence, renewal packets.",
              "Store, organize, analyze, and retrieve documents for benefit monitoring and user support.",
            ],
            [
              "Advisor authorization data",
              "Authority documents, relationship to beneficiary, access scope, invitation records, consent status, revocation history.",
              "Confirm and document authority to view or manage beneficiary records.",
            ],
            [
              "AI and support interactions",
              "Prompts, chat history, uploaded context, summaries, support tickets, email communications.",
              "Provide assistance, improve service quality, maintain case context, troubleshoot issues.",
            ],
            [
              "Technical, device, and usage data",
              "IP address, browser, device, operating system, session identifiers, cookies, audit logs, clicks, error reports, performance logs.",
              "Security, fraud prevention, analytics, service improvement, legal compliance.",
            ],
          ]}
        />
      </Section>

      <Section title="4. Plaid and Financial-Data Authorization">
        <p>
          When a user connects a financial account through Plaid or another financial-data provider,
          the user authorizes MyBenefitsPA and the provider to access and process only the financial
          data selected and necessary for the user-requested services. MyBenefitsPA does not request,
          receive, or store the user&apos;s financial-institution username or password. Connections use
          tokenized access and provider-managed authentication flows.
        </p>
        <Bullets
          items={[
            "The Platform may retrieve account metadata, balances, transaction history, income deposit information, ownership/identity information where separately authorized, account status, and connection health information.",
            "The Platform will request the minimum integration products and scopes reasonably necessary to provide the feature selected by the user.",
            "The Platform may refresh financial data periodically to provide alerts and compliance monitoring, subject to user settings, provider limitations, and applicable law.",
            "A user may disconnect a financial account through the Platform or the provider flow. Disconnection stops future data retrieval but does not automatically delete historical records needed for retention, audit, dispute, legal-hold, or user-requested benefit monitoring purposes.",
            "Access tokens are encrypted, access-restricted, logged, rotated or reissued when appropriate, and revoked when an account is disconnected or deleted, except where preservation is required for security investigation or legal reasons.",
          ]}
        />
      </Section>

      <Section title="5. Consent for Sensitive Data">
        <p>
          MyBenefitsPA processes Sensitive Data only where the user has requested the relevant service,
          where processing is necessary to provide that service, where another lawful basis applies, or
          where affirmative consent is required and obtained. Consent is recorded in a consent ledger
          that may include the consenting person, date and time, device or IP metadata, data
          categories, service purpose, advisor scope, version of the notice presented, and revocation
          status.
        </p>
        <p>
          Users may revoke consent or disconnect integrations through account settings or by contacting
          privacy@mybenefitspa.com. Revocation may limit or terminate Platform functionality.
          Revocation does not require MyBenefitsPA to delete records retained for legal, security,
          dispute, audit, regulatory, or documented benefits-monitoring purposes.
        </p>
      </Section>

      <Section title="6. How We Use Information">
        <Bullets
          items={[
            "Provide and maintain account access, authentication, alerts, reports, document storage, and support.",
            "Monitor benefit-related income, asset, renewal, and reporting thresholds chosen by the user.",
            "Generate reminders and informational guidance relating to Medicaid, SSI, SSDI, SNAP, MAWD, QMB, waiver, and related programs.",
            "Analyze uploaded documents and user-entered information to organize records and support user-requested summaries.",
            "Enable authorized advisor and caregiver access according to documented authority and account settings.",
            "Detect, investigate, and prevent security incidents, fraud, misuse, unauthorized access, and service errors.",
            "Comply with legal obligations, valid legal process, regulatory inquiries, audits, litigation holds, and user-rights requests.",
            "Improve services through aggregated or de-identified analytics, provided such data is not reasonably linkable to a specific user.",
          ]}
        />
      </Section>

      <Section title="7. AI, Automated Processing, and Profiling">
        <p>
          The Platform may use automated logic and AI-assisted systems to classify transactions,
          identify recurring income, flag possible benefit-threshold issues, summarize documents,
          prepare reminders, and generate informational guidance. These outputs are not legal, medical,
          tax, financial, benefits, fiduciary, or government-agency determinations. Users and advisors
          must verify all outputs against official notices, agency rules, program manuals, and
          qualified professional advice where appropriate.
        </p>
        <p>
          Where applicable law gives users the right to opt out of profiling or automated
          decision-making producing legal or similarly significant effects, MyBenefitsPA will honor
          that right. MyBenefitsPA does not make final eligibility decisions, approve benefits, deny
          benefits, or submit government determinations.
        </p>
      </Section>

      <Section title="8. Sharing and Disclosure">
        <Table
          headers={["Recipient", "Disclosure Purpose", "Safeguards"]}
          rows={[
            [
              "Service providers and processors",
              "Cloud hosting, security monitoring, customer support, document processing, analytics, communications, payment processing, and financial-data integration.",
              "Written agreements, confidentiality, security obligations, access limits, breach notice, deletion/return requirements.",
            ],
            [
              "Plaid or financial-data providers",
              "Authenticate bank connections, retrieve authorized data, maintain account-link status.",
              "Provider terms, tokenized access, restricted products/scopes, logging, revocation.",
            ],
            [
              "Authorized advisors/caregivers",
              "Permit access to beneficiary records as requested by user or supported by legal authority.",
              "Consent records, role-based access, audit logs, revocation workflow, access scope controls.",
            ],
            [
              "Government, courts, regulators, or law enforcement",
              "Respond to valid legal process or protect rights, safety, security, or legal compliance.",
              "Legal review, disclosure minimization, notice to user where permitted.",
            ],
            [
              "Corporate transaction parties",
              "Due diligence, merger, acquisition, financing, reorganization, or asset transfer.",
              "Confidentiality, data-room controls, privacy commitments, user notice where required.",
            ],
          ]}
        />
        <p>
          MyBenefitsPA does not sell personal information. MyBenefitsPA does not use Sensitive Data for
          targeted advertising. If any future feature involves targeted advertising, sale, or profiling
          subject to opt-out rights, MyBenefitsPA will provide required notices and controls before
          enabling that feature.
        </p>
      </Section>

      <Section title="9. Advisor and Caregiver Access">
        <p>
          Advisor or caregiver access is limited to individuals invited by the Beneficiary, authorized
          account holder, guardian, agent under power of attorney, representative payee, trustee, or
          other person with lawful authority. Advisors must provide accurate authority information and
          must not access data unless they have a current lawful basis to do so.
        </p>
        <Bullets
          items={[
            "The Platform may require upload or verification of authority documents before advisor access is granted or expanded.",
            "Access may be limited by role, beneficiary, data category, program, document folder, and permitted action.",
            "MyBenefitsPA may suspend advisor access if authority is disputed, expired, revoked, incomplete, or reasonably suspected to be misused.",
            "Beneficiaries or authorized account holders may revoke advisor access, subject to legal holds and account-control rules.",
          ]}
        />
      </Section>

      <Section title="10. Cookies, Tracking, and Universal Opt-Out Signals">
        <p>
          The Platform may use cookies, local storage, session identifiers, and similar technologies
          for authentication, security, preference management, fraud prevention, analytics, and
          performance measurement. Essential security and authentication cookies are necessary to
          operate the Platform. Non-essential analytics or marketing cookies, if used, will be subject
          to required notice and choice.
        </p>
        <p>
          Where required by law, MyBenefitsPA recognizes Universal Opt-Out Mechanisms, including Global
          Privacy Control, for applicable opt-out rights. Because the Platform is not designed for
          targeted advertising using Sensitive Data, Global Privacy Control will be treated
          conservatively as an opt-out from sale, sharing for targeted advertising, and applicable
          profiling uses.
        </p>
      </Section>

      <Section title="11. User Privacy Rights">
        <p>
          Depending on state of residence and applicable law, users may have rights to access, confirm
          processing, receive a copy, correct, delete, obtain portability, opt out of sale, opt out of
          targeted advertising, opt out of certain profiling, withdraw consent, limit use of sensitive
          information, appeal a denied request, and use an authorized agent. MyBenefitsPA will not
          discriminate against a user for exercising legally protected privacy rights.
        </p>
        <Bullets
          items={[
            "Requests may be submitted to privacy@mybenefitspa.com. MyBenefitsPA will verify the requester's identity and authority before disclosing or deleting information.",
            "If a request is denied, MyBenefitsPA will provide the reason and, where required, instructions for appeal. Appeals will be reviewed by a person not involved in the original denial where practicable.",
            "Deletion requests may be limited by legal holds, security logs, fraud-prevention needs, dispute records, tax/accounting obligations, benefits-record retention needs, and other lawful exceptions.",
            "Authorized-agent requests require proof of authorization and may require direct confirmation from the user or legal representative.",
          ]}
        />
      </Section>

      <Section title="12. HIPAA, Consumer Health Data, and Benefits Confidentiality">
        <p>
          MyBenefitsPA will comply with HIPAA only to the extent it is legally acting as a covered
          entity or business associate. When MyBenefitsPA receives PHI under a business associate
          agreement, HIPAA rights and obligations apply according to that agreement and applicable law.
          When a consumer directly uploads medical or disability documents, the information may be
          sensitive health or disability data even if HIPAA does not apply. MyBenefitsPA protects that
          data under this Policy, the Security Policy, applicable consumer-health-data laws, and
          contractual commitments.
        </p>
        <p>
          Public-benefits records may be subject to program-specific confidentiality rules.
          MyBenefitsPA does not access agency portals, submit forms, contact agencies, or represent
          users before agencies unless a separate authorized feature or written agreement permits that
          activity.
        </p>
      </Section>

      <Section title="13. Security, Retention, and Deletion">
        <p>
          MyBenefitsPA uses administrative, technical, and physical safeguards described in its Security
          and Safeguards Policy, including encryption in transit, encryption at rest, role-based
          access, MFA, logging, vendor controls, monitoring, and incident response. Retention and
          deletion are governed by the Data Retention and Deletion Policy.
        </p>
      </Section>

      <Section title="14. Children and Age Limits">
        <p>
          The Platform is intended for adults age 18 and older. The Platform is not directed to children
          under 13. A parent, guardian, or legally authorized representative may provide information
          about a minor or dependent beneficiary only where legally authorized and only as necessary
          for the services.
        </p>
      </Section>

      <Section title="15. Changes and Contact">
        <p>
          MyBenefitsPA may update this Policy from time to time. Material changes will be communicated
          by posting an updated policy and, where required, email or in-Platform notice.
        </p>
        <p>
          Privacy requests: privacy@mybenefitspa.com. Security reports: security@mybenefitspa.com.
          General support: support@mybenefitspa.com. Website: www.mybenefitspa.com.
        </p>
      </Section>
    </article>
  );
}
