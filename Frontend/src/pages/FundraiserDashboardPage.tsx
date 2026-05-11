import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

interface Campaign {
  _id: string;
  title: string;
  category: string;
  description: string;
  goalAmount: number;
  raisedAmount: number;
  images?: string[];
  verified: boolean;
  adminPaused?: boolean;
  verifiedAt?: string;
  verifiedBy?: {
    username?: string;
    email?: string;
  };
  fundraiser?: {
    username?: string;
    email?: string;
  };
}

/** First word on one line, remaining words on the next line (no mid-word breaks). */
function TwoLineWords({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  const t = text.trim();
  const i = t.indexOf(' ');
  if (i === -1) {
    return <span className={`block leading-snug ${className}`}>{t}</span>;
  }
  return (
    <span className={`inline-block min-w-0 max-w-full leading-snug ${className}`}>
      <span className="block">{t.slice(0, i)}</span>
      <span className="block break-words">{t.slice(i + 1).trim()}</span>
    </span>
  );
}

export function FundraiserDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [analytics, setAnalytics] = useState({
    totalCampaigns: 0,
    totalRaised: 0,
    totalDonors: 0,
    avgProgress: 0,
    completedCampaignsCount: 0,
    completedCampaignDonorsTotal: 0,
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [goalAlerts, setGoalAlerts] = useState<{ _id: string; title: string; message: string }[]>([]);
  const [completingId, setCompletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'fundraiser') {
      setLoading(false);
      setAnalyticsLoading(false);
      return;
    }

    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const response = await api.get('/campaigns/my');
        const userCampaigns = response.data.campaigns || [];
        // Show only first 2 campaigns on dashboard
        setCampaigns(userCampaigns.slice(0, 2));
        setError('');
      } catch (err: any) {
        console.error('Failed to fetch campaigns:', err);
        setError(err.response?.data?.message || 'Failed to load campaigns');
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchAnalytics = async () => {
      try {
        setAnalyticsLoading(true);
        const response = await api.get('/analytics/fundraiser');
        if (response.data.success) {
          setAnalytics(response.data.overview);
        }
      } catch (err: any) {
        console.error('Failed to fetch analytics:', err);
        // Keep default values if analytics fails
      } finally {
        setAnalyticsLoading(false);
      }
    };

    const fetchGoalAlerts = async () => {
      try {
        const res = await api.get('/notifications');
        const list = res.data?.notifications || [];
        const goals = list.filter(
          (n: { type?: string; read?: boolean }) => n.type === 'campaign_goal' && !n.read,
        );
        setGoalAlerts(
          goals.map((n: { _id: string; title: string; message: string }) => ({
            _id: n._id,
            title: n.title,
            message: n.message,
          })),
        );
      } catch {
        setGoalAlerts([]);
      }
    };

    fetchCampaigns();
    fetchAnalytics();
    fetchUnreadMessages();
    fetchGoalAlerts();
    // Re-load when session user changes (e.g. after login) so lists are not stuck empty
  }, [user?.id, user?.email, user?.role]);

  // Fetch unread message count
  const fetchUnreadMessages = async () => {
    try {
      const response = await api.get('/messages');
      if (response.data.success && response.data.conversations) {
        const unread = response.data.conversations.reduce((sum: number, conv: any) => sum + (conv.unread || 0), 0);
        console.log("📬 Unread message count:", unread);
        setUnreadMessageCount(unread);
      }
    } catch (err: any) {
      console.error('Error fetching unread messages:', err);
    }
  };

  // Listen for real-time message updates
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = () => {
      console.log("📨 New message received, updating unread count...");
      fetchUnreadMessages();
    };

    socket.on('receiveMessage', handleNewMessage);

    return () => {
      socket.off('receiveMessage', handleNewMessage);
    };
  }, [socket]);

  const dismissGoalAlerts = async () => {
    if (!goalAlerts.length) return;
    try {
      await api.post('/notifications/read', {
        notificationIds: goalAlerts.map((g) => g._id),
      });
      setGoalAlerts([]);
    } catch (e) {
      console.error('Failed to mark notifications read', e);
    }
  };

  const handleCompleteCampaign = async (campaignId: string) => {
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
      await api.post(`/campaigns/${campaignId}/complete`);
      setCampaigns((prev) => prev.filter((c) => c._id !== campaignId));
      const res = await api.get('/analytics/fundraiser');
      if (res.data.success) setAnalytics(res.data.overview);
    } catch (err: any) {
      console.error('Failed to complete campaign:', err);
      alert(err.response?.data?.message || 'Failed to complete campaign');
    } finally {
      setCompletingId(null);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(campaignId);
      await api.delete(`/campaigns/${campaignId}`);
      setCampaigns(campaigns.filter(c => c._id !== campaignId));
    } catch (err: any) {
      console.error('Failed to delete campaign:', err);
      alert(err.response?.data?.message || 'Failed to delete campaign');
    } finally {
      setDeletingId(null);
    }
  };
  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Fundraiser Dashboard</h1>
          <p className="text-slate-500 mt-2">Manage your campaigns and track progress</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link to="/fundraiser/my-campaigns" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">My Campaigns</Link>
            <span className="text-slate-300">•</span>
            <Link to="/fundraiser/messages" className="relative text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-2">
              Messages
              {unreadMessageCount > 0 && (
                <span className="absolute -top-2 -right-4 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                  {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                </span>
              )}
            </Link>
            <span className="text-slate-300">•</span>
            <Link to="/fundraiser/notifications" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Notifications</Link>
            <span className="text-slate-300">•</span>
            <Link to="/fundraiser/profile" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Profile</Link>
          </div>
        </div>
        <Link
          to="/fundraiser/create-campaign"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
        >
          <i className="fa-solid fa-plus" />
          Create Campaign
        </Link>
      </div>

      {goalAlerts.length > 0 && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 sm:px-5 sm:py-4 min-w-0 max-w-full">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 min-w-0 max-w-full">
            <div className="min-w-0 flex-1">
              <p className="flex items-start gap-2 text-sm font-semibold text-emerald-900 min-w-0">
                <i className="fa-solid fa-bullseye text-base shrink-0 mt-0.5" />
                <TwoLineWords text="Funding goal reached" />
              </p>
              <ul className="mt-2 space-y-2 text-sm text-emerald-900/90 list-none pl-0 min-w-0">
                {goalAlerts.map((a) => (
                  <li key={a._id} className="min-w-0">
                    <TwoLineWords text={a.message} />
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={dismissGoalAlerts}
              className="shrink-0 self-start sm:self-auto px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm min-w-0 h-full">
          <div className="flex items-center gap-3 mb-2 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <i className="fa-solid fa-rocket text-lg" />
            </div>
            <TwoLineWords text="Active campaigns" className="text-sm font-medium text-slate-500" />
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums leading-tight text-slate-800 break-words">
            {analyticsLoading ? '—' : analytics.totalCampaigns}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm min-w-0 h-full">
          <div className="flex items-center gap-3 mb-2 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <i className="fa-solid fa-coins text-lg" />
            </div>
            <TwoLineWords text="Total raised" className="text-sm font-medium text-slate-500" />
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums leading-tight text-slate-800 break-words">
            {analyticsLoading ? '—' : `$${analytics.totalRaised.toLocaleString()}`}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm min-w-0 h-full">
          <div className="flex items-center gap-3 mb-2 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <i className="fa-solid fa-users text-lg" />
            </div>
            <span className="block text-sm font-medium leading-snug text-slate-500">Supporters</span>
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums leading-tight text-slate-800 break-words">
            {analyticsLoading ? '—' : analytics.totalDonors}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm min-w-0 h-full">
          <div className="flex items-center gap-3 mb-2 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <i className="fa-solid fa-chart-line text-lg" />
            </div>
            <TwoLineWords text="Avg. progress" className="text-sm font-medium text-slate-500" />
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums leading-tight text-slate-800 break-words">
            {analyticsLoading ? '—' : `${analytics.avgProgress}%`}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm min-w-0 h-full">
          <div className="flex items-center gap-3 mb-2 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 shrink-0">
              <i className="fa-solid fa-flag-checkered text-lg" />
            </div>
            <TwoLineWords text="Completed campaigns" className="text-sm font-medium text-slate-500" />
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums leading-tight text-slate-800 break-words">
            {analyticsLoading ? '—' : analytics.completedCampaignsCount ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm min-w-0 h-full">
          <div className="flex items-center gap-3 mb-2 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
              <i className="fa-solid fa-user-check text-lg" />
            </div>
            <TwoLineWords text="Supporters (completed)" className="text-sm font-medium text-slate-500" />
          </div>
          <p className="mt-3 text-2xl font-bold tabular-nums leading-tight text-slate-800 break-words">
            {analyticsLoading ? '—' : analytics.completedCampaignDonorsTotal ?? 0}
          </p>
        </div>
      </div>

      {/* My Campaigns */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6">Your campaigns</h2>
        {loading && <p className="text-slate-500 text-sm">Loading campaigns</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && campaigns.length === 0 && (
          <p className="text-slate-500">No campaigns yet. <Link to="/fundraiser/create-campaign" className="text-emerald-600 hover:text-emerald-700 font-medium">Create your first campaign</Link></p>
        )}
        {!loading && campaigns.length > 0 && (
          <div className="space-y-6">
            {campaigns.map((campaign) => {
              const percent = campaign.goalAmount ? Math.round((campaign.raisedAmount / campaign.goalAmount) * 100) : 0;
              const categoryBadgeClass = {
                'Medical': 'bg-emerald-100 text-emerald-700',
                'Education': 'bg-blue-100 text-blue-700',
                'Animals': 'bg-amber-100 text-amber-700',
                'Disaster': 'bg-rose-100 text-rose-700',
                'Creative': 'bg-purple-100 text-purple-700',
                'Environment': 'bg-teal-100 text-teal-700',
                'Other': 'bg-gray-100 text-gray-700',
              }[campaign.category] || 'bg-gray-100 text-gray-700';

              return (
                <div key={campaign._id} className="bg-white rounded-xl overflow-x-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow min-w-0">
                  <div className="flex flex-col md:flex-row min-w-0">
                    <div className="md:w-72 h-52 md:min-h-[210px] flex-shrink-0">
                      <img 
                        src={campaign.images?.[0] || 'https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=800'} 
                        alt={campaign.title} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 min-w-0 p-4 sm:p-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="min-w-0 flex-1 max-w-full">
                        <div className="mb-2">
                          <span className={`inline-block rounded-md px-2 py-0.5 text-xs ${categoryBadgeClass}`}>
                            <TwoLineWords text={campaign.category} className="font-bold" />
                          </span>
                        </div>
                        <div className="mb-2 flex min-w-0 items-start gap-2">
                          <h3 className="min-w-0 flex-1 text-base leading-snug text-slate-800 sm:text-lg">
                            <TwoLineWords text={campaign.title} className="font-bold" />
                          </h3>
                          {campaign.verified ? (
                            <div className="relative group shrink-0">
                              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center cursor-help">
                                <i className="fa-solid fa-check text-emerald-600 text-sm" />
                              </div>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                <div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                                  <p className="font-semibold">✅ Verified by Admin</p>
                                  {campaign.verifiedAt && (
                                    <p className="text-slate-300 text-xs mt-1">
                                      {new Date(campaign.verifiedAt).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                                {/* Arrow pointer */}
                                <div className="absolute bottom--1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                              </div>
                            </div>
                          ) : (
                            <div className="relative group shrink-0">
                              <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center cursor-help">
                                <i className="fa-solid fa-clock text-amber-600 text-sm" />
                              </div>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                <div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                                  <p className="font-semibold">⏳ Pending Verification</p>
                                  <p className="text-slate-300 text-xs mt-1">Awaiting admin review</p>
                                </div>
                                {/* Arrow pointer */}
                                <div className="absolute bottom--1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                              </div>
                            </div>
                          )}
                        </div>
                        {campaign.adminPaused && (
                          <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                            <p className="flex items-start gap-1.5 font-medium">
                              <i className="fa-solid fa-circle-pause mt-0.5 shrink-0" />
                              <TwoLineWords
                                text="Paused — no new donations until SafeDonate resumes this campaign"
                                className="font-medium"
                              />
                            </p>
                          </div>
                        )}
                        <div className="mt-2 text-sm text-slate-500">
                          <p className="font-semibold text-emerald-600">
                            <TwoLineWords text={`$${campaign.raisedAmount.toLocaleString()} raised`} />
                          </p>
                          <p className="mt-1 text-slate-500">
                            <TwoLineWords text={`${percent}% of goal`} />
                          </p>
                        </div>
                        <div className="mt-2.5 h-2 w-full max-w-full sm:max-w-md bg-slate-100 rounded-full overflow-hidden min-w-0">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(percent, 100)}%` }} />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:gap-2.5 w-full min-w-0 md:w-auto shrink-0">
                        <Link
                          to={`/fundraiser/campaigns/${campaign._id}/edit`}
                          className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                        >
                          Edit
                        </Link>
                        <button 
                          type="button" 
                          onClick={() => navigate(`/campaigns/${campaign._id}`)}
                          className="px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCompleteCampaign(campaign._id)}
                          disabled={completingId === campaign._id}
                          className="px-3.5 py-2 rounded-lg border border-emerald-600 text-emerald-700 text-sm font-medium hover:bg-emerald-50 transition-colors disabled:opacity-50"
                        >
                          {completingId === campaign._id ? 'Completing' : 'Mark complete'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCampaign(campaign._id)}
                          disabled={deletingId === campaign._id}
                          className="px-3.5 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                          <i className="fa-solid fa-trash text-sm" />
                          {deletingId === campaign._id ? 'Deleting' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
