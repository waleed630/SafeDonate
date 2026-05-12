import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

interface NgoCampaignRow {
  _id: string;
  title: string;
  organization_name?: string;
  organization_registration_number?: string;
  status?: string;
  campaign_type?: string;
  ngo_verification?: {
    verified?: boolean;
    level?: string;
    registry_type?: string;
  };
  fundraiser?: { username?: string; email?: string };
}

export function NgoVerificationRequestsPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<NgoCampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    aliases: '',
    registration_number: '',
    registry_type: 'SECP',
    category: '',
    website: '',
  });

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get('/ngo/admin/requests');
      setCampaigns(res.data?.campaigns || []);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to load NGO requests';
      setErr(msg);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') load();
  }, [user?.role]);

  const approve = async (id: string) => {
    if (!window.confirm('Mark this NGO campaign as manually verified (admin level)?')) return;
    setBusyId(id);
    try {
      await api.post(`/ngo/admin/campaigns/${id}/approve`);
      await load();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Approve failed');
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id: string) => {
    const reason = window.prompt('Reason for rejecting NGO verification:');
    if (reason == null) return;
    if (!reason.trim()) {
      alert('Reason is required.');
      return;
    }
    setBusyId(id);
    try {
      await api.post(`/ngo/admin/campaigns/${id}/reject`, { reason: reason.trim() });
      await load();
    } catch (e: unknown) {
      alert((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Reject failed');
    } finally {
      setBusyId(null);
    }
  };

  const addToRegistry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/ngo/admin/registry/add', {
        name: addForm.name.trim(),
        aliases: addForm.aliases,
        registration_number: addForm.registration_number.trim(),
        registry_type: addForm.registry_type,
        category: addForm.category.trim(),
        website: addForm.website.trim(),
      });
      setShowAddModal(false);
      setAddForm({
        name: '',
        aliases: '',
        registration_number: '',
        registry_type: 'SECP',
        category: '',
        website: '',
      });
      alert('Organization added to verified registry.');
    } catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not add NGO');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="py-10 px-6 max-w-3xl mx-auto">
        <p className="text-slate-600">Admins only.</p>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/admin/dashboard" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium mb-2 inline-block">
            ← Admin dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">NGO Verification Requests</h1>
          <p className="text-slate-500 mt-2">
            NGO campaigns that did not match the local registry (or need manual confirmation). Approve, reject, or add organizations permanently.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-sm"
        >
          Add NGO to registry
        </button>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : err ? (
        <p className="text-rose-600">{err}</p>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-600">
          No NGO campaigns are waiting for registry review.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Campaign</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Organization</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700">Fundraiser</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{c.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Status: {c.status}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <p>{c.organization_name || '—'}</p>
                    <p className="text-xs text-slate-500">{c.organization_registration_number || 'No reg. #'}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.fundraiser?.username || c.fundraiser?.email || '—'}</td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      disabled={busyId === c._id}
                      onClick={() => approve(c._id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-medium hover:bg-emerald-200 disabled:opacity-50"
                    >
                      Approve NGO
                    </button>
                    <button
                      type="button"
                      disabled={busyId === c._id}
                      onClick={() => reject(c._id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-800 font-medium hover:bg-rose-200 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add organization to verified registry</h2>
            <form onSubmit={addToRegistry} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Legal name *</label>
                <input
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Aliases (comma-separated)</label>
                <input
                  value={addForm.aliases}
                  onChange={(e) => setAddForm({ ...addForm, aliases: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Registration number *</label>
                <input
                  required
                  value={addForm.registration_number}
                  onChange={(e) => setAddForm({ ...addForm, registration_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Registry type *</label>
                <select
                  value={addForm.registry_type}
                  onChange={(e) => setAddForm({ ...addForm, registry_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                >
                  <option value="SECP">SECP</option>
                  <option value="PCP">PCP</option>
                  <option value="Provincial">Provincial</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                <input
                  value={addForm.category}
                  onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Website</label>
                <input
                  value={addForm.website}
                  onChange={(e) => setAddForm({ ...addForm, website: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
