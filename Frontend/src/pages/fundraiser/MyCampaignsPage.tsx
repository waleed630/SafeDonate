import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { ProgressBar } from '../../components/ui/ProgressBar';

interface Campaign {
  _id: string;
  title: string;
  category: string;
  raisedAmount: number;
  progress?: number;
  images?: string[];
  categoryBadge?: string;
  adminPaused?: boolean;
}

export function MyCampaignsPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completingId, setCompletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'fundraiser') {
      setLoading(false);
      return;
    }

    const fetchMyCampaigns = async () => {
      try {
        setLoading(true);
        const response = await api.get('/campaigns/my');
        setCampaigns(response.data.campaigns || []);
        setError('');
      } catch (err: any) {
        console.error('Failed to fetch my campaigns:', err);
        setError(err.response?.data?.message || 'Could not load campaigns');
      } finally {
        setLoading(false);
      }
    };

    fetchMyCampaigns();
  }, [user?.id, user?.email, user?.role]);

  const handleComplete = async (campaignId: string) => {
    if (
      !window.confirm(
        'Mark this campaign as complete? After you continue, you must confirm one more time to remove it from the platform.',
      )
    ) {
      return;
    }
    window.alert(
      'Your campaign will be marked complete and permanently removed when you click OK. Your completed campaign count will update; supporters (completed) only increase if this campaign had reached its funding goal.',
    );
    try {
      setCompletingId(campaignId);
      setError('');
      await api.post(`/campaigns/${campaignId}/complete`);
      setCampaigns((prev) => prev.filter((c) => c._id !== campaignId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not complete campaign');
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My Campaigns</h1>
          <p className="text-slate-500 mt-1">Manage and track your campaigns</p>
        </div>
        <Link
          to="/fundraiser/create-campaign"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
        >
          <i className="fa-solid fa-plus" /> Create Campaign
        </Link>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
          Loading your campaigns...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700 shadow-sm">
          {error}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
          You have no campaigns yet. Create one to see it here.
        </div>
      ) : (
        <div className="space-y-6">
          {campaigns.map((c) => (
            <div key={c._id} className="bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-64 h-48 md:h-auto flex-shrink-0">
                  <img
                    src={c.images?.[0] || 'https://via.placeholder.com/640x480?text=No+Image'}
                    alt={c.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${c.categoryBadge ?? 'bg-slate-100 text-slate-700'} mb-2`}>
                      {c.category}
                    </span>
                    {c.adminPaused && (
                      <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                        <span className="font-semibold">
                          <i className="fa-solid fa-circle-pause mr-1" />
                          Donations paused
                        </span>
                        <span className="block text-red-800/90 mt-0.5">
                          Supporters cannot give and no new donations can be processed until the platform resumes this campaign.
                        </span>
                      </div>
                    )}
                    <h3 className="text-lg font-bold text-slate-800">{c.title}</h3>
                    <p className="text-emerald-600 font-semibold mt-1">${c.raisedAmount.toLocaleString()} raised</p>
                    <div className="mt-2 w-full max-w-xs">
                      <ProgressBar value={c.progress ?? 0} size="sm" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/fundraiser/campaigns/${c._id}/edit`}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/fundraiser/campaigns/${c._id}/analytics`}
                      className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700"
                    >
                      Analytics
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleComplete(c._id)}
                      disabled={completingId === c._id}
                      className="px-4 py-2 rounded-lg border border-emerald-600 text-emerald-700 font-medium hover:bg-emerald-50 disabled:opacity-50"
                    >
                      {completingId === c._id ? 'Completing…' : 'Mark complete'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
