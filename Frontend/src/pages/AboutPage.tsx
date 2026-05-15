import { Link } from 'react-router-dom';

const features = [
  {
    icon: 'fa-robot',
    color: 'bg-violet-100 text-violet-600',
    title: 'AI Campaign Verification',
    desc: 'Signals and checks to flag inconsistencies and support human review before campaigns go live.',
  },
  {
    icon: 'fa-bolt',
    color: 'bg-amber-100 text-amber-600',
    title: 'Real-time Donation Tracking',
    desc: 'See progress toward goals and recent activity so donors stay informed as giving happens.',
  },
  {
    icon: 'fa-lock',
    color: 'bg-emerald-100 text-emerald-600',
    title: 'Secure Payments',
    desc: 'Industry-standard payment flows for safer transactions and clearer receipts.',
  },
  {
    icon: 'fa-comments',
    color: 'bg-sky-100 text-sky-600',
    title: 'In-app Messaging',
    desc: 'Built-in conversations between supporters and organizers — fewer lost threads on social apps.',
  },
  {
    icon: 'fa-clipboard-check',
    color: 'bg-teal-100 text-teal-600',
    title: 'NGO Verification',
    desc: 'Additional checks for non-profit and NGO-style campaigns to strengthen donor confidence.',
  },
] as const;

const values = [
  { title: 'Transparency', icon: 'fa-eye', desc: 'Clear goals, progress, and communication around every campaign.' },
  { title: 'Trust', icon: 'fa-handshake', desc: 'Verification, monitoring, and fair processes for everyone on the platform.' },
  { title: 'Community', icon: 'fa-people-group', desc: 'Serving Pakistan and South Asia with tools designed for local realities.' },
  { title: 'Innovation', icon: 'fa-lightbulb', desc: 'Responsible use of AI and modern tech to reduce fraud and friction.' },
] as const;

export function AboutPage() {
  return (
    <div className="overflow-x-hidden">
      <section className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 text-white px-4 sm:px-6 md:px-10 py-16 sm:py-24">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2260%22%20height%3D%2260%22%3E%3Ccircle%20cx%3D%221%22%20cy%3D%221%22%20r%3D%221%22%20fill%3D%22rgba(255%2C255%2C255%2C0.06)%22%2F%3E%3C%2Fsvg%3E')] opacity-90" aria-hidden />
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-emerald-200 text-sm font-medium tracking-wide uppercase mb-4">Pakistan · South Asia</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-serif leading-tight mb-6">
            Crowdfunding built on clarity — for donors and fundraisers who deserve better.
          </h1>
          <p className="text-lg sm:text-xl text-emerald-50/95 max-w-2xl mx-auto leading-relaxed">
            SafeDonate is transparent crowdfunding built for Pakistan and South Asia — where trust, timely updates, and
            accessible giving matter as much as the cause itself.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link
              to="/campaigns"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-white text-emerald-800 font-semibold shadow-lg hover:bg-emerald-50 transition-colors"
            >
              Discover campaigns <i className="fa-solid fa-arrow-right text-sm" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border-2 border-white/70 text-white font-semibold hover:bg-white/10 transition-colors"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-14 sm:py-18 space-y-16">
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Our Story</h2>
          <p className="text-slate-600 leading-relaxed text-lg mb-4">
            In Pakistan, people give generously — but crowdfunding often breaks down around trust and communication:
            scepticism toward unknown organizers, fragmented updates on WhatsApp or Facebook, and friction with international
            or unfamiliar payment rails.
          </p>
          <p className="text-slate-600 leading-relaxed">
            SafeDonate exists to tighten that gap: a focused platform where campaigns can be reviewed, donors can track impact,
            and conversations stay tied to each cause — grounded in regional context and respectful of how people actually give
            in South Asia.
          </p>
        </section>

        <section>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Our Mission</h2>
          <p className="text-slate-600 leading-relaxed text-lg mb-4">
            We empower local communities with tools that prioritize <strong className="text-slate-800">transparency</strong>,{' '}
            <strong className="text-slate-800">trust</strong>, and dignity for both donors and fundraisers.
          </p>
          <p className="text-slate-600 leading-relaxed">
            Whether for medical emergencies, education, community projects, or verified NGOs — our mission is to make it easier
            to give with confidence and to organise support without drowning in mistrust or poor follow‑through.
          </p>
        </section>

        <section>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">Key Features</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <i className={`fa-solid ${f.icon} text-xl`} />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">Our Values</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {values.map((v) => (
              <div
                key={v.title}
                className="flex gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6 sm:p-7"
              >
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <i className={`fa-solid ${v.icon}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">{v.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Developer & supervisory team</h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm max-w-xl">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                WL
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Muhammad Waleed Bin Latif</h3>
                <p className="text-emerald-700 font-medium mt-1">BSCS — Final Year Student</p>
                <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                  Lahore Garrison University · Project supervised by{' '}
                  <span className="font-semibold text-slate-800">Ms. Zainab Zafar</span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
