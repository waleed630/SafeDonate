import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const SUBJECT_OPTIONS = [
  'General Inquiry',
  'Report a Campaign',
  'NGO Verification Request',
  'Technical Support',
  'Partnership',
] as const;

const SOCIAL = [
  { label: 'Facebook', icon: 'fa-brands fa-facebook-f', href: '#' },
  { label: 'Twitter', icon: 'fa-brands fa-twitter', href: '#' },
  { label: 'Instagram', icon: 'fa-brands fa-instagram', href: '#' },
  { label: 'LinkedIn', icon: 'fa-brands fa-linkedin-in', href: '#' },
] as const;

export function ContactPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState<string>(SUBJECT_OPTIONS[0]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (!message.trim()) {
      setError('Please enter your message.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/contact', {
        name: fullName.trim(),
        email: email.trim(),
        subject,
        message: message.trim(),
      });
      setSuccess(true);
      setFullName('');
      setEmail('');
      setSubject(SUBJECT_OPTIONS[0]);
      setMessage('');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setError(ax?.response?.data?.message || 'Something went wrong. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-10 sm:py-14 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto">
      <p className="text-sm text-slate-500 mb-2">
        <Link to="/" className="text-emerald-600 hover:text-emerald-700">
          Home
        </Link>
        <span className="mx-2">/</span>
        Contact Us
      </p>
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Contact Us</h1>
      <p className="text-slate-600 text-lg mb-10 max-w-2xl">
        Questions about SafeDonate, a campaign, or partnerships? Send us a note — our team responds to every inquiry.
      </p>

      <div className="grid lg:grid-cols-[1fr,minmax(280px,340px)] gap-10 lg:gap-12 xl:gap-14">
        <div
          className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm"
          role="group"
          aria-labelledby="contact-form-heading"
        >
          <h2 id="contact-form-heading" className="text-xl font-semibold text-slate-900 mb-6">
            Send a message
          </h2>

          {success && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              Thank you for reaching out! We&apos;ll get back to you within 24 hours.
            </div>
          )}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="contact-full-name" className="block text-sm font-medium text-slate-700 mb-1.5">
                Full name
              </label>
              <input
                id="contact-full-name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="contact-subject" className="block text-sm font-medium text-slate-700 mb-1.5">
                Subject
              </label>
              <select
                id="contact-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {SUBJECT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="contact-message" className="block text-sm font-medium text-slate-700 mb-1.5">
                Message
              </label>
              <textarea
                id="contact-message"
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full resize-y min-h-[140px] rounded-xl border border-slate-200 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="How can we help?"
              />
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 disabled:pointer-events-none transition-colors"
            >
              {submitting ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  Submit <i className="fa-solid fa-paper-plane text-sm" />
                </>
              )}
            </button>
          </div>
        </div>

        <aside className="space-y-8 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 sm:p-7">
            <h2 className="text-lg font-semibold text-slate-900 mb-5">Contact information</h2>
            <ul className="space-y-5 text-slate-600">
              <li className="flex gap-4">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <i className="fa-solid fa-envelope" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
                  <a href="mailto:support@safedonate.pk" className="break-all font-medium text-emerald-700 hover:text-emerald-800">
                    support@safedonate.pk
                  </a>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <i className="fa-solid fa-location-dot" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Location</p>
                  <p className="font-medium text-slate-800">Lahore, Pakistan</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <i className="fa-solid fa-clock" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Response time</p>
                  <p className="font-medium text-slate-800">Within 24 hours</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Social media</h3>
            <div className="flex flex-wrap gap-3">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                >
                  <i className={`${s.icon} text-lg`} />
                </a>
              ))}
            </div>
          </div>

          <div className="text-sm text-slate-500 px-1">
            <Link to="/privacy" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Privacy Policy
            </Link>
            <span className="mx-2">·</span>
            <Link to="/terms" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Terms of Service
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
