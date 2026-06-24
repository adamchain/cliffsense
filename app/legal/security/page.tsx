import type { Metadata } from "next";
import { Bullets, DocHeader, Section, Table } from "../_components";

export const metadata: Metadata = {
  title: "Security and Safeguards Policy — MyBenefitsPA",
  description:
    "Administrative, technical, and physical safeguards used by MyBenefitsPA to protect the Platform and user data.",
};

export default function SecurityPage() {
  return (
    <article>
      <DocHeader
        title="Security and Safeguards Policy"
        intro={
          <>
            Designed for: personal banking information accessed through Plaid or similar integrations;
            personal information; SSN and identity data; disability, medical, and public-benefit
            records; Medicaid, SSI, SSDI, SNAP, MAWD, Medicare Savings Programs, QMB, waiver programs,
            and related eligibility/renewal monitoring.
          </>
        }
      />

      <Section title="1. Security Commitment and Scope">
        <p>
          This Security and Safeguards Policy describes the administrative, technical, and physical
          safeguards used by MyBenefitsPA to protect confidentiality, integrity, availability, and
          resilience of the Platform and user data. It applies to production systems, administrative
          systems, financial-data integrations, support systems, document storage, AI workflows, audit
          logs, vendors, employees, contractors, and advisors with system access.
        </p>
        <p>
          The security program is designed for a high-sensitivity data environment involving banking
          data, SSNs, disability and medical documents, public-benefit records, caregiver/advisor
          access, and AI-assisted analysis. It is aligned with recognized security frameworks,
          including the NIST Cybersecurity Framework, selected NIST SP 800-53 and 800-171 controls, CIS
          Controls, OWASP Application Security Verification Standard, OWASP API Security Top 10, SOC 2
          trust-services principles, and GLBA/FTC Safeguards concepts where applicable.
        </p>
      </Section>

      <Section title="2. Governance and Accountability">
        <Bullets
          items={[
            "MyBenefitsPA designates an executive security owner or qualified security lead responsible for the written information security program, risk assessments, policies, vendor security, incident response, and management reporting.",
            "Security policies are reviewed at least annually and after material changes in architecture, vendors, data flows, legal requirements, incidents, or threat conditions.",
            "Risk assessments are documented, prioritized, assigned to owners, and tracked to remediation.",
            "Security exceptions require documented business justification, compensating controls, expiration dates, and approval by the security lead.",
            "Employees and contractors receive onboarding and annual security, privacy, phishing, data-handling, and incident-reporting training.",
          ]}
        />
      </Section>

      <Section title="3. Data Classification and Minimum Necessary Access">
        <Table
          headers={["Class", "Examples", "Control Expectation"]}
          rows={[
            [
              "Restricted",
              "SSN, bank tokens, account balances, transaction history, medical/disability documents, benefit notices, PHI where applicable, advisor authority documents.",
              "Encryption at rest and in transit, MFA, RBAC, audit logging, data minimization, strict vendor controls, production-access approval.",
            ],
            [
              "Confidential",
              "Internal support notes, non-public business data, security logs, incident records, vendor contracts.",
              "Access controls, logging, contractual confidentiality, secure storage.",
            ],
            [
              "Internal",
              "Policies, training materials, non-public procedures.",
              "Internal-only access, version control, reasonable safeguards.",
            ],
            [
              "Public",
              "Approved website content and published policies.",
              "Publication approval and change control.",
            ],
          ]}
        />
        <p>
          Access is granted under least privilege and minimum necessary principles. Production access is
          limited to authorized personnel with a documented business need, MFA, logging, and periodic
          review.
        </p>
      </Section>

      <Section title="4. Encryption, Key Management, and Secrets">
        <Bullets
          items={[
            "Data in transit uses TLS 1.3 where supported and TLS 1.2 as the minimum. HTTPS is enforced and HSTS is enabled for public Platform endpoints.",
            "Restricted data at rest is encrypted using AES-256 or equivalent cloud-managed encryption. Backups, object storage, database volumes, snapshots, and powered-off storage are encrypted.",
            "Encryption keys are managed through a dedicated key management service with access controls, separation of duties, rotation, audit logs, and emergency-revocation procedures.",
            "Plaid access tokens, API keys, OAuth secrets, database credentials, signing keys, webhook secrets, and other secrets are stored only in approved secrets-management systems or encrypted fields. Secrets are never committed to source code, ticket systems, logs, or chat systems.",
            "Cryptographic erasure is used where appropriate for deletion of encrypted archives and backups.",
          ]}
        />
      </Section>

      <Section title="5. Identity, Authentication, and Access Control">
        <Bullets
          items={[
            "Multi-factor authentication is required for employees, contractors, privileged users, production access, administrator consoles, source-code repositories, cloud consoles, and advisor accounts with broad access.",
            "MFA is required or strongly enforced for user accounts containing Sensitive Data, with step-up authentication for high-risk actions such as connecting a bank account, downloading sensitive records, adding an advisor, changing MFA, exporting data, or deleting an account.",
            "Role-based access control, just-in-time access, session timeouts, device trust, and automatic lockouts are used to reduce account-takeover risk.",
            "Access permissions are reviewed at least quarterly and promptly removed upon termination, role change, loss of authority, or suspected compromise.",
            "Administrative actions, data exports, advisor invitations, benefit-profile changes, bank integrations, token events, and privacy-rights requests are logged.",
          ]}
        />
      </Section>

      <Section title="6. Financial-Data Integration Security">
        <p>
          Plaid and similar integrations are treated as Restricted data systems. MyBenefitsPA uses
          provider-managed authentication flows and does not store financial-institution usernames or
          passwords. Integration design follows data minimization, tokenization, least privilege, and
          revocation-by-design principles.
        </p>
        <Table
          headers={["Control", "Protocol"]}
          rows={[
            [
              "Scope minimization",
              "Request only integration products, account types, and data fields necessary for the selected Platform feature.",
            ],
            [
              "Token protection",
              "Encrypt access tokens; restrict token access to approved services; log token use; revoke tokens at disconnection or account deletion.",
            ],
            [
              "Webhook validation",
              "Verify webhook source and signatures/secrets where supported; reject malformed or replayed events.",
            ],
            [
              "Data refresh",
              "Refresh on a defined schedule or event trigger; prevent excessive polling; monitor provider errors and stale connections.",
            ],
            [
              "User control",
              "Provide disconnect controls and explain that historical data may remain under the retention policy.",
            ],
            [
              "Transaction handling",
              "Classify transactions using auditable rules; allow user correction; preserve correction history where needed for benefit monitoring.",
            ],
          ]}
        />
      </Section>

      <Section title="7. Cloud, Network, and Infrastructure Security">
        <Bullets
          items={[
            "Production systems are hosted with cloud providers that maintain appropriate security certifications such as SOC 2 Type II, ISO 27001, or equivalent assurance.",
            "Production environments are segmented from development, testing, analytics, and corporate systems. Network access is restricted by security groups, private networking, firewalls, and service-to-service authorization.",
            "Administrative access uses secure remote access, MFA, device controls, and logging. Public administrative interfaces are avoided where practicable.",
            "Infrastructure-as-code is reviewed, version controlled, scanned for misconfiguration, and deployed through approved pipelines.",
            "Backups are encrypted, access-controlled, monitored, and restoration-tested at least annually.",
          ]}
        />
      </Section>

      <Section title="8. Secure Development Lifecycle">
        <Bullets
          items={[
            "Engineering teams follow secure coding standards, code review, branch protection, and change-management procedures.",
            "Static application security testing, dependency scanning, secrets scanning, container/image scanning, software composition analysis, and infrastructure scanning are integrated into development and release pipelines.",
            "Dynamic application security testing and manual security review are performed for material releases and high-risk features.",
            "Threat modeling is performed for high-risk workflows, including Plaid connections, advisor access, document upload, AI processing, account recovery, data export, and deletion.",
            "The company maintains or can generate a software bill of materials for key production components and monitors critical dependency advisories.",
          ]}
        />
      </Section>

      <Section title="9. Vulnerability Management">
        <Table
          headers={["Activity", "Minimum Frequency or Target"]}
          rows={[
            ["Dependency and secrets scanning", "Continuous in code repositories and CI/CD pipelines."],
            ["External vulnerability scanning", "At least monthly and after material infrastructure changes."],
            ["Internal vulnerability scanning", "At least quarterly for production-relevant environments."],
            ["Penetration testing", "At least annually and after major architecture changes affecting Restricted data."],
            ["Critical vulnerability remediation", "Target 72 hours to 7 days, based on exploitability and compensating controls."],
            ["High vulnerability remediation", "Target 15 to 30 days, based on exploitability and risk."],
            ["Medium vulnerability remediation", "Target 60 to 90 days, unless risk assessment requires faster action."],
          ]}
        />
      </Section>

      <Section title="10. Logging, Monitoring, and Detection">
        <p>
          MyBenefitsPA collects security-relevant logs from applications, APIs, cloud services,
          databases, authentication systems, administrative consoles, financial-data integrations, data
          exports, and high-risk user actions. Logs are access-controlled, tamper-resistant where
          practicable, time-synchronized, and retained according to the Data Retention and Deletion
          Policy.
        </p>
        <Bullets
          items={[
            "Security monitoring uses alerting for account takeover indicators, unusual access, failed authentication spikes, privilege escalation, excessive export, token errors, suspicious API calls, malware indicators, and data-exfiltration signals.",
            "Production logs are reviewed through automated detection and escalated according to severity.",
            "Logs avoid storing secrets, full SSNs, full account numbers, plaintext tokens, or full document contents unless unavoidable for a documented security purpose.",
          ]}
        />
      </Section>

      <Section title="11. Incident Response and Breach Notification">
        <p>
          MyBenefitsPA maintains an incident response plan covering preparation, identification, triage,
          containment, eradication, recovery, post-incident review, evidence preservation,
          communications, and breach-notification analysis. Incidents involving financial data, SSNs,
          health/disability data, PHI where applicable, or public-benefits records receive heightened
          review.
        </p>
        <Table
          headers={["Phase", "Required Action"]}
          rows={[
            ["Triage", "Classify event severity, affected systems, data categories, users, integrations, and legal regimes."],
            ["Containment", "Disable compromised credentials/tokens, isolate systems, block malicious access, preserve logs."],
            ["Investigation", "Determine root cause, scope, data access/acquisition, and whether notification duties are triggered."],
            ["Notification", "Notify users, regulators, HHS, state attorneys general, business partners, or media where required by applicable law and contract."],
            ["Remediation", "Patch systems, rotate secrets, update controls, document corrective actions, train personnel as needed."],
          ]}
        />
      </Section>

      <Section title="12. Vendor and Processor Security">
        <p>
          Vendors that access, process, store, transmit, secure, or support Restricted or Confidential
          data undergo risk-based security and privacy diligence before onboarding and periodic
          reassessment. Contracts include confidentiality, security controls, breach notice,
          subprocessor limitations, data-return/deletion duties, audit or assurance rights, and
          privacy-processing terms where applicable. Business associate agreements are used where HIPAA
          requires them.
        </p>
      </Section>

      <Section title="13. GLBA, HIPAA, and Benefits-Data Safeguards Where Applicable">
        <p>
          Where GLBA, the FTC Safeguards Rule, HIPAA, state consumer-health-data laws, public-benefits
          confidentiality laws, or contractual security standards apply, MyBenefitsPA maps applicable
          requirements to its written safeguards program, vendor contracts, privacy notices, breach
          workflows, access controls, and audit documentation. The company avoids public claims of
          &ldquo;HIPAA compliant,&rdquo; &ldquo;bank-grade,&rdquo; &ldquo;state-of-the-art,&rdquo; or
          similar standards unless the claim is current, documented, and approved by counsel and the
          security lead.
        </p>
      </Section>

      <Section title="14. Business Continuity and Disaster Recovery">
        <Bullets
          items={[
            "Critical systems have defined recovery time objectives and recovery point objectives appropriate to the service.",
            "Backups are encrypted and restoration-tested at least annually.",
            "Disaster recovery procedures address cloud-region failure, data corruption, ransomware, provider outage, critical vendor failure, and staff unavailability.",
            "Incident and disaster exercises are conducted periodically and lessons learned are tracked to closure.",
          ]}
        />
      </Section>

      <Section title="15. Physical, Endpoint, and Remote-Work Security">
        <p>
          MyBenefitsPA relies on cloud-provider physical security controls for production
          infrastructure. Employee and contractor devices used for company work must use disk
          encryption, screen lock, supported operating systems, endpoint protection or EDR where
          appropriate, secure configuration, and remote-wipe capability. Restricted data may not be
          stored on unmanaged personal devices or removable media unless explicitly approved and
          encrypted.
        </p>
      </Section>

      <Section title="16. Contact">
        <p>
          Security vulnerabilities or incidents should be reported to security@mybenefitspa.com. Privacy
          requests should be sent to privacy@mybenefitspa.com. General support is available at
          support@mybenefitspa.com.
        </p>
      </Section>
    </article>
  );
}
