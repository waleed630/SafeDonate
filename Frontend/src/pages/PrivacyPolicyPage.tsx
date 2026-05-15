import { Link } from 'react-router-dom';
import { LegalDocumentLayout } from '../components/legal/LegalDocumentLayout';

const TOC = [
  { id: 'collect', label: 'Information We Collect' },
  { id: 'use-data', label: 'How We Use Your Information' },
  { id: 'sharing', label: 'Data Sharing and Disclosure' },
  { id: 'payments-info', label: 'Payment Information' },
  { id: 'ai-data', label: 'AI Processing of Campaign Data' },
  { id: 'storage', label: 'Data Storage and Security' },
  { id: 'rights', label: 'Your Rights' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'third-parties', label: 'Third Party Services' },
  { id: 'children', label: "Children's Privacy" },
  { id: 'changes', label: 'Changes to Policy' },
  { id: 'contact', label: 'Contact Us' },
] as const;

export function PrivacyPolicyPage() {
  return (
    <LegalDocumentLayout title="Privacy Policy" lastUpdated="May 2026" toc={[...TOC]}>
      <section id="collect">
        <h2>Information We Collect</h2>
        <p>We collect information necessary to operate SafeDonate for users in Pakistan, South Asia, and globally:</p>
        <ul>
          <li>
            <strong>Account data:</strong> name, email, password hash, role (donor, fundraiser, admin), optional profile photo and
            contact preferences.
          </li>
          <li>
            <strong>Campaign and donation data:</strong> descriptions, totals, timelines, receipts metadata, messaging associated
            with campaigns.
          </li>
          <li>
            <strong>Technical data:</strong> IP address, device type, logs, approximate location inferred from networking data,
            and cookies or similar identifiers.
          </li>
        </ul>
      </section>

      <section id="use-data">
        <h2>How We Use Your Information</h2>
        <ul>
          <li>To provide authentication, personalization, messaging, donations, receipts, and support.</li>
          <li>To detect fraud and abuse and to comply with lawful requests.</li>
          <li>To improve reliability, usability, analytics, and (where opted in) marketing consistent with consent.</li>
        </ul>
      </section>

      <section id="sharing">
        <h2>Data Sharing and Disclosure</h2>
        <p>
          We share data only with processors and partners who help us operate the Platform (such as hosting, payments, messaging,
          and analytics vendors) subject to contractual safeguards and applicable law in Pakistan — including commitments aligned
          with the <strong>Pakistan Personal Data Protection Act / PDPA</strong>, where enacted and enforced. We may disclose data
          if required by court order or competent Pakistani authorities, or to protect our users and the Platform.
        </p>
      </section>

      <section id="payments-info">
        <h2>Payment Information</h2>
        <p>
          Card and wallet details are collected and tokenized primarily by regulated payment processors. We retain limited billing
          metadata (such as masked identifiers, timestamps, amounts, currency, and statuses) sufficient for reconciliation,
          auditing, donor history, and legal compliance — not full card numbers in our primary application database.
        </p>
      </section>

      <section id="ai-data">
        <h2>AI Processing of Campaign Data</h2>
        <p>
          Text, attachments, metadata, or behavioural indicators may be processed by automated or AI-assisted systems to classify
          risk, surface anomalies, prioritize manual review, and improve safeguards. Automated outcomes can be audited and
          overruled by staff. Automated processing adheres to the purpose limitation and lawful basis frameworks applicable under
          Pakistan&apos;s evolving data protection norms, including transparency around significant automated decisions where
          required.
        </p>
      </section>

      <section id="storage">
        <h2>Data Storage and Security</h2>
        <p>
          Records may be stored using providers such as MongoDB Atlas along with redundancy and backups. Access is scoped and
          logged where feasible. Absolute security cannot be promised; incident response procedures will be exercised if required.
        </p>
      </section>

      <section id="rights">
        <h2>Your Rights</h2>
        <p>
          Subject to exemptions and verification, you may request access, correction, deletion, portability, objection, or restriction
          in line with Pakistani law — including forthcoming <strong>PDPA</strong> rights — and analogous principles for cross-border users.
          Contact us via support@safedonate.pk or{' '}
          <Link to="/contact" className="text-emerald-600 hover:text-emerald-800 font-medium">
            Contact Us
          </Link>
          . We may authenticate requests before honoring them.
        </p>
      </section>

      <section id="cookies">
        <h2>Cookies</h2>
        <p>
          We employ cookies/local storage for authentication (including secure session artefacts), UX preferences, and analytics.
          You can regulate cookies through browser settings — note that restricting essential cookies may break login or transactional
          features.
        </p>
      </section>

      <section id="third-parties">
        <h2>Third Party Services</h2>
        <ul>
          <li>
            <strong>Firebase:</strong> May process device tokens and analytics for push messaging and telemetry.
          </li>
          <li>
            <strong>Stripe:</strong> Processes payment instrument data pursuant to Stripe&apos;s Privacy Policy.
          </li>
          <li>
            <strong>MongoDB:</strong> Structured storage of profiles, donations, messaging, audits, AI flags, etc.
          </li>
        </ul>
      </section>

      <section id="children">
        <h2>Children&apos;s Privacy</h2>
        <p>
          The Platform targets adults capable of donating or organizing fundraisers. Persons under parental supervision may use the
          service only with lawful consent. Accounts or content manifestly attributable to unattended minors may be flagged for
          review.
        </p>
      </section>

      <section id="changes">
        <h2>Changes to Policy</h2>
        <p>
          We revise this Privacy Policy as features and laws evolve. Material updates will revise the last-updated date and may use
          in-app postings or notices.
        </p>
      </section>

      <section id="contact">
        <h2>Contact Us</h2>
        <p>
          Email{' '}
          <a href="mailto:support@safedonate.pk" className="text-emerald-600 hover:text-emerald-800 font-medium">
            support@safedonate.pk
          </a>{' '}
          or use the{' '}
          <Link to="/contact" className="text-emerald-600 hover:text-emerald-800 font-medium">
            contact form
          </Link>{' '}
          — Lahore, Pakistan; typical response within 24 hours during business readiness.
        </p>
      </section>
    </LegalDocumentLayout>
  );
}
