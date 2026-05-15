import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

export function AdminDashboardPage() {
  const { user } = useAuth();
  const [pendingCampaigns, setPendingCampaigns] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeCampaignsCount, setActiveCampaignsCount] = useState(0);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [reportsCount, setReportsCount] = useState(0);
  const [recentDonations, setRecentDonations] = useState<any[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [recentDonationsError, setRecentDonationsError] = useState<string | null>(null);
  const [isLoadingRecentDonations, setIsLoadingRecentDonations] = useState(true);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const fetchPendingCampaigns = useCallback(async () => {
    setIsLoadingPending(true);
    setPendingError(null);
    try {
      const response = await api.get('/verification/pending');
      const campaigns = response.data?.campaigns || [];
      setPendingCampaigns(campaigns.slice(0, 3));
      setPendingCount(response.data?.count ?? campaigns.length);
    } catch (error: any) {
      console.error('Failed to load pending campaigns for admin dashboard:', error);
      setPendingError(error?.response?.data?.message || error?.message || 'Unable to load pending campaigns');
      setPendingCampaigns([]);
      setPendingCount(0);
    } finally {
      setIsLoadingPending(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin') return;

    const fetchDashboardStats = async () => {
      try {
        const response = await api.get('/campaigns/admin/stats');
        setActiveCampaignsCount(response.data?.activeCampaignsCount ?? 0);
        setTotalUsersCount(response.data?.totalUsersCount ?? 0);
        setReportsCount(response.data?.reportsCount ?? 0);
      } catch (error: any) {
        console.error('Failed to load admin dashboard stats:', error);
        setActiveCampaignsCount(0);
        setTotalUsersCount(0);
        setReportsCount(0);
      }
    };

    const fetchRecentDonations = async () => {
      setIsLoadingRecentDonations(true);
      setRecentDonationsError(null);
      try {
        const response = await api.get('/donations/recent');
        setRecentDonations(response.data?.donations || []);
      } catch (error: any) {
        console.error('Failed to load recent donations for admin dashboard:', error);
        setRecentDonationsError(error?.response?.data?.message || error?.message || 'Unable to load recent donations');
        setRecentDonations([]);
      } finally {
        setIsLoadingRecentDonations(false);
      }
    };

    fetchPendingCampaigns();
    fetchDashboardStats();
    fetchRecentDonations();
  }, [user?.id, user?.role, fetchPendingCampaigns]);

  const handleApprove = async (campaignId: string) => {
    if (!window.confirm('Approve this campaign? It will become visible to donors.')) return;
    setPendingActionId(campaignId);
    try {
      await api.post(`/campaigns/admin/${campaignId}/approve`);
      await fetchPendingCampaigns();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to approve campaign');
    } finally {
      setPendingActionId(null);
    }
  };

  const handleReject = async (campaignId: string) => {
    const reason = window.prompt('Reason for rejection (required):');
    if (reason == null) return;
    if (!reason.trim()) {
      alert('A rejection reason is required.');
      return;
    }
    setPendingActionId(campaignId);
    try {
      await api.post(`/campaigns/admin/${campaignId}/reject`, { reason: reason.trim() });
      await fetchPendingCampaigns();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to reject campaign');
    } finally {
      setPendingActionId(null);
    }
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Admin Panel</h1>
        <p className="text-slate-500 mt-2">Manage campaigns and platform oversight</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Link to="/admin/users" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Manage Users</Link>
          <span className="text-slate-300">•</span>
          <Link to="/admin/campaigns" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Manage Campaigns</Link>
          <span className="text-slate-300">•</span>
          <Link to="/admin/payments" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Manage Payments</Link>
          <span className="text-slate-300">•</span>
          <Link to="/admin/ngo-requests" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">NGO Verification</Link>
          <span className="text-slate-300">•</span>
          <Link to="/admin/fraud" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Fraud Monitoring</Link>
          <span className="text-slate-300">•</span>
          <Link to="/admin/analytics" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Analytics</Link>
          <span className="text-slate-300">•</span>
          <Link to="/admin/categories" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Categories</Link>
          <span className="text-slate-300">•</span>
          <Link to="/admin/tags" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Tags</Link>
          <span className="text-slate-300">•</span>
          <Link to="/admin/contact-messages" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            Contact messages
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <i className="fa-solid fa-clock-rotate-left text-xl" />
            </div>
            <span className="text-sm font-medium text-slate-500">Pending Review</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <i className="fa-solid fa-check-circle text-xl" />
            </div>
            <span className="text-sm font-medium text-slate-500">Active Campaigns</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{activeCampaignsCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <i className="fa-solid fa-user-group text-xl" />
            </div>
            <span className="text-sm font-medium text-slate-500">Total Users</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{totalUsersCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <i className="fa-solid fa-flag text-xl" />
            </div>
            <span className="text-sm font-medium text-slate-500">Reports</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{reportsCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Pending Campaigns */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Campaigns Pending Review</h2>
            <p className="text-sm text-slate-500 mt-1">Verify and approve new campaigns</p>
          </div>
          <div className="min-h-[180px] divide-y divide-slate-100">
            {isLoadingPending ? (
              <div className="p-6 text-slate-500">Loading pending campaigns...</div>
            ) : pendingError ? (
              <div className="p-6 text-rose-600">{pendingError}</div>
            ) : pendingCampaigns.length === 0 ? (
              <div className="p-6 text-slate-500">No campaigns pending review.</div>
            ) : (
              pendingCampaigns.map((campaign) => (
                <div key={campaign._id || campaign.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <img
                      src={campaign.images?.[0] || campaign.image || 'https://via.placeholder.com/80'}
                      alt={campaign.title || 'Pending campaign'}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{campaign.title || 'Untitled campaign'}</p>
                      <p className="text-sm text-slate-500">by {campaign.fundraiser?.username || campaign.fundraiser?.email || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      type="button"
                      disabled={!!pendingActionId}
                      onClick={() => handleApprove(campaign._id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-medium hover:bg-emerald-200 transition-colors disabled:opacity-50"
                    >
                      {pendingActionId === campaign._id ? '…' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      disabled={!!pendingActionId}
                      onClick={() => handleReject(campaign._id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 text-sm font-medium hover:bg-rose-200 transition-colors disabled:opacity-50"
                    >
                      {pendingActionId === campaign._id ? '…' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Donations */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Recent Donations</h2>
            <p className="text-sm text-slate-500 mt-1">Latest platform activity</p>
          </div>
          <div className="divide-y divide-slate-100">
            {isLoadingRecentDonations ? (
              <div className="p-6 text-slate-500">Loading recent donations...</div>
            ) : recentDonationsError ? (
              <div className="p-6 text-rose-600">{recentDonationsError}</div>
            ) : recentDonations.length === 0 ? (
              <div className="p-6 text-slate-500">No donations available yet.</div>
            ) : (
              recentDonations.map((d) => (
                <div key={d.id} className="p-4 sm:p-6 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={d.donorAvatar}
                      alt={d.donorName}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{d.donorName}</p>
                      <p className="text-sm text-slate-500">donated ${d.amount}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {d.timestamp && !Number.isNaN(Date.parse(d.timestamp))
                          ? new Date(d.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'Unknown date'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
