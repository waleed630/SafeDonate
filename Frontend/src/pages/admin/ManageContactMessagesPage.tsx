import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

type Msg = {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
};

export function ManageContactMessagesPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/contact');
      setMessages(res.data?.messages ?? []);
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } }; message?: string };
      setError(ax?.response?.data?.message || ax?.message || 'Failed to load messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Contact messages</h1>
          <p className="text-slate-500 mt-1">Submissions from the public contact form.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void load()}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm"
          >
            Refresh
          </button>
          <Link
            to="/admin/dashboard"
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 inline-flex items-center"
          >
            Admin home
          </Link>
        </div>
      </div>

      {loading && <p className="text-slate-500">Loading messages…</p>}
      {!loading && error && <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">{error}</div>}
      {!loading && !error && messages.length === 0 && (
        <p className="text-slate-500 py-12 text-center rounded-2xl border border-slate-100 bg-white">No contact messages yet.</p>
      )}

      {!loading && !error && messages.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm text-left min-w-[640px]">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Subject</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {messages.map((m) => (
                <tr key={m._id} className="align-top hover:bg-slate-50/80">
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {m.createdAt ? new Date(m.createdAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{m.name}</td>
                  <td className="px-4 py-3">
                    <a href={`mailto:${m.email}`} className="text-emerald-600 hover:text-emerald-700 break-all">
                      {m.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-700 max-w-xs">{m.subject}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 capitalize">
                      {m.status || 'unread'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-6 space-y-6 border-t border-slate-100">
            <h2 className="font-semibold text-slate-900">Messages</h2>
            <ul className="space-y-4">
              {messages.map((m) => (
                <li key={`body-${m._id}`} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <p className="text-xs text-slate-500 mb-1">
                    {m.name} · {m.subject} · {new Date(m.createdAt).toLocaleString()}
                  </p>
                  <p className="text-slate-800 whitespace-pre-wrap">{m.message}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
