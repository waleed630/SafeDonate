import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LegalDocumentLayout } from '../components/legal/LegalDocumentLayout';

const TOC = [
  { id: 'acceptance', label: 'Acceptance of Terms' },
  { id: 'platform-use', label: 'Use of Platform' },
  { id: 'accounts', label: 'User Accounts and Roles' },
  { id: 'campaigns', label: 'Campaign Creation Guidelines' },
  { id: 'donations', label: 'Donation Policy' },
  { id: 'payments', label: 'Payment Processing' },
  { id: 'ai-verification', label: 'AI Verification System' },
  { id: 'prohibited', label: 'Prohibited Activities' },
  { id: 'ip', label: 'Intellectual Property' },
  { id: 'liability', label: 'Limitation of Liability' },
  { id: 'privacy-ref', label: 'Privacy' },
  { id: 'changes', label: 'Changes to Terms' },
  { id: 'contact-info', label: 'Contact Information' },
] as const;

export function TermsOfServicePage() {
  const [agreedTerms, setAgreedTerms] = useState(false);

  return (
    <LegalDocumentLayout title="Terms of Service" lastUpdated="May 2026" toc={[...TOC]}>
      <section id="acceptance">
        <h2>Acceptance of Terms</h2>
        <p>
          By accessing or using SafeDonate (&quot;the Platform&quot;) operated in Pakistan and available to users across South Asia
          and beyond, you agree to be bound by these Terms of Service and our{' '}
          <Link to="/privacy" className="text-emerald-600 hover:text-emerald-800 font-medium">
            Privacy Policy
          </Link>
          . If you do not agree, you must not use the Platform. You must be at least 18 years old (or the age of majority in your
          jurisdiction) to create an account or donate, unless a parent or guardian provides consent where allowed by law.
        </p>
      </section>

      <section id="platform-use">
        <h2>Use of Platform</h2>
        <p>
          SafeDonate provides an online environment to create and support crowdfunding campaigns related to lawful charitable,
          personal, community, and verified organizational purposes. You agree to use the Platform only in compliance with
          applicable laws in Pakistan (including applicable consumer, electronic transactions, and taxation rules where relevant)
          and any other jurisdiction from which you access the service.
        </p>
      </section>

      <section id="accounts">
        <h2>User Accounts and Roles</h2>
        <p>
          Accounts may be designated as donor, fundraiser (organizer), or administrator. You are responsible for maintaining the
          confidentiality of your credentials and for all activity under your account. You must provide accurate information and
          promptly update it. We may suspend or terminate accounts involved in fraud, misrepresentation, repeated policy
          breaches, or directives from competent authorities.
        </p>
      </section>

      <section id="campaigns">
        <h2>Campaign Creation Guidelines</h2>
        <ul>
          <li>Campaigns must describe a genuine need or purpose; misleading or duplicate campaigns are prohibited.</li>
          <li>Fundraisers warrant that they are authorized to raise funds for the stated beneficiary or cause.</li>
          <li>
            Content must not infringe third-party rights or promote illegal activities, hatred, violence, or discrimination
            prohibited under Pakistani law.
          </li>
          <li>Administrative or AI-assisted review may delay or block publication until verification is complete.</li>
        </ul>
      </section>

      <section id="donations">
        <h2>Donation Policy</h2>
        <p>
          Donations are voluntary transfers to support published campaigns. Completed donations are generally final; refunds may
          apply only where required by law, by the payment provider’s rules, where a campaign is canceled in accordance with our
          policies, or under exceptional circumstances assessed by SafeDonate. Donors are encouraged to review campaigns carefully
          before giving.
        </p>
      </section>

      <section id="payments">
        <h2>Payment Processing</h2>
        <p>
          Payments may be processed via integrated third-party providers (such as Stripe). By donating, you authorize us and our
          processors to charge the selected payment method. Currency, fees, settlement timing, and disputes may be governed by the
          processor’s terms. SafeDonate does not guarantee uninterrupted payment services and is not a bank or money services
          business.
        </p>
      </section>

      <section id="ai-verification">
        <h2>AI Verification System</h2>
        <p>
          The Platform may use automated and AI-assisted signals to assist in reviewing campaign text, documents, and behavioural
          indicators. Such systems support — but do not replace — human moderation. No automated review guarantees truthfulness;
          users remain responsible for the accuracy of what they publish.
        </p>
      </section>

      <section id="prohibited">
        <h2>Prohibited Activities</h2>
        <ul>
          <li>Fraud, phishing, money laundering, or concealing the true beneficiary.</li>
          <li>Spam, scraping, or interfering with Platform security or performance.</li>
          <li>Circumventing fees, verification, or moderation processes.</li>
          <li>
            Harassment or abuse of staff, volunteers, donors, or organizers through messaging or public campaign content.
          </li>
        </ul>
      </section>

      <section id="ip">
        <h2>Intellectual Property</h2>
        <p>
          SafeDonate retains rights in its logos, software, and branding. You grant us a limited licence to host, display, and
          distribute content you upload in connection with operating the Platform. You must not copy or reverse engineer the
          Platform except as permitted by law.
        </p>
      </section>

      <section id="liability">
        <h2>Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by applicable law in Pakistan, SafeDonate and its operators, contributors, and licensors
          disclaim liability for indirect, incidental, consequential, or punitive damages, and for losses arising from reliance
          on user-generated content or third-party payment processing. The Platform is provided &quot;as is&quot; without
          warranties of merchantability or fitness for a particular purpose.
        </p>
      </section>

      <section id="privacy-ref">
        <h2>Privacy</h2>
        <p>
          Our collection and use of personal data is described in our{' '}
          <Link to="/privacy" className="text-emerald-600 hover:text-emerald-800 font-medium">
            Privacy Policy
          </Link>
          , which forms part of these Terms.
        </p>
      </section>

      <section id="changes">
        <h2>Changes to Terms</h2>
        <p>
          We may update these Terms periodically. Material changes will be indicated by updating the &quot;Last updated&quot; date
          and, where appropriate, through notice on the Platform. Continued use after changes constitutes acceptance of the
          revised Terms.
        </p>
      </section>

      <section id="contact-info">
        <h2>Contact Information</h2>
        <p>
          For questions about these Terms, contact SafeDonate via the details on our{' '}
          <Link to="/contact" className="text-emerald-600 hover:text-emerald-800 font-medium">
            Contact Us
          </Link>{' '}
          page (email: support@safedonate.pk).
        </p>
      </section>

      <section
        id="registration-ack"
        className="rounded-2xl border border-slate-200 bg-emerald-50/50 p-6 sm:p-8 not-prose"
      >
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Registration acknowledgement</h2>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedTerms}
            onChange={(e) => setAgreedTerms(e.target.checked)}
            className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-sm text-slate-700 leading-relaxed">
            <span className="font-medium text-slate-900">I have read and agree</span> to the SafeDonate Terms of Service and Privacy
            Policy. To create an account, continue to{' '}
            <Link
              to="/register"
              className="text-emerald-700 font-semibold hover:text-emerald-800 underline underline-offset-2"
            >
              registration
            </Link>
            .
          </span>
        </label>
        <p className="text-xs text-slate-500 mt-4">
          Registering still requires accepting the same terms on the sign-up flow. This checkbox helps confirm you have reviewed
          this page.
        </p>
      </section>
    </LegalDocumentLayout>
  );
}
