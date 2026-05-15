import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';

export type LegalTocItem = { id: string; label: string };

type LegalDocumentLayoutProps = {
  title: string;
  lastUpdated: string;
  toc: LegalTocItem[];
  children: ReactNode;
};

export function LegalDocumentLayout({ title, lastUpdated, toc, children }: LegalDocumentLayoutProps) {
  return (
    <div className="py-8 sm:py-12 lg:py-14 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto">
      <p className="text-sm text-slate-500 mb-2">
        <Link to="/" className="text-emerald-600 hover:text-emerald-700">
          Home
        </Link>
      </p>
      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">{title}</h1>
      <p className="text-sm text-slate-500 mb-10">Last updated: {lastUpdated}</p>

      <div className="lg:grid lg:grid-cols-[minmax(180px,230px)_minmax(0,1fr)] lg:gap-10 xl:gap-14">
        <aside className="hidden lg:block">
          <nav
            aria-label="Table of contents"
            className="sticky top-28 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm max-h-[calc(100vh-8rem)] overflow-y-auto"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">On this page</p>
            <ul className="space-y-2 text-sm">
              {toc.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="text-slate-600 hover:text-emerald-600 transition-colors leading-snug block"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="min-w-0">
          <div className="lg:hidden rounded-xl border border-slate-200 bg-slate-50 p-4 mb-10">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Sections</p>
            <select
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              onChange={(e) => {
                const id = e.target.value;
                if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              aria-label="Jump to section"
              defaultValue=""
            >
              <option value="" disabled>
                Jump to section…
              </option>
              {toc.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <article className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h2]:scroll-mt-24 [&_section]:scroll-mt-24 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_strong]:text-slate-800">
            {children}
          </article>
        </div>
      </div>
    </div>
  );
}
