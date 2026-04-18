import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
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

export function FundraiserDashboardPage() {
  const navigate = useNavigate();
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
    avgProgress: 0
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
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

    fetchCampaigns();
    fetchAnalytics();
    fetchUnreadMessages();
  }, []);

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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <i className="fa-solid fa-rocket text-xl" />
            </div>
            <span className="text-sm font-medium text-slate-500">Active Campaigns</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {analyticsLoading ? '...' : analytics.totalCampaigns}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <i className="fa-solid fa-coins text-xl" />
            </div>
            <span className="text-sm font-medium text-slate-500">Total Raised</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {analyticsLoading ? '...' : `$${analytics.totalRaised.toLocaleString()}`}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <i className="fa-solid fa-users text-xl" />
            </div>
            <span className="text-sm font-medium text-slate-500">Supporters</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {analyticsLoading ? '...' : analytics.totalDonors}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <i className="fa-solid fa-chart-line text-xl" />
            </div>
            <span className="text-sm font-medium text-slate-500">Avg. Progress</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">
            {analyticsLoading ? '...' : `${analytics.avgProgress}%`}
          </p>
        </div>
      </div>

      {/* My Campaigns */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-6">Your Campaigns</h2>
        {loading && <p className="text-slate-500">Loading campaigns...</p>}
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
                <div key={campaign._id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-64 h-48 md:h-auto flex-shrink-0">
                      <img 
                        src={campaign.images?.[0] || 'https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=800'} 
                        alt={campaign.title} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 p-4 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${categoryBadgeClass} mb-2`}>{campaign.category}</span>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-slate-800">{campaign.title}</h3>
                          {campaign.verified ? (
                            <div className="relative group">
                              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center cursor-help">
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
                            <div className="relative group">
                              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center cursor-help">
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
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                          <span className="text-emerald-600 font-semibold">${campaign.raisedAmount.toLocaleString()} raised</span>
                          <span>{percent}% of goal</span>
                        </div>
                        <div className="mt-2 h-2 w-full max-w-xs bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(percent, 100)}%` }} />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        <Link
                          to={`/fundraiser/campaigns/${campaign._id}/edit`}
                          className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                        >
                          Edit
                        </Link>
                        <button 
                          type="button" 
                          onClick={() => navigate(`/campaigns/${campaign._id}`)}
                          className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCampaign(campaign._id)}
                          disabled={deletingId === campaign._id}
                          className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <i className="fa-solid fa-trash text-sm" />
                          {deletingId === campaign._id ? 'Deleting...' : 'Delete'}
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
