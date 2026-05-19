import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { CampaignCard } from '../components/CampaignCard';
import { RecommendedCampaigns } from '../components/campaign/RecommendedCampaigns';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../hooks/useSocket';
import api from '../api/axios';
import { organizerAvatarUrl } from '../utils/organizerAvatar';

interface Campaign {
  _id: string;
  title: string;
  description: string;
  category: string;
  images: string[];
  goalAmount: number;
  raisedAmount?: number;
  fundraiser: {
    _id: string;
    username: string;
    email: string;
    profilePicture?: string | null;
  };
  progress?: number;
  verified: boolean;
  status: string;
  createdAt: string;
  donorCount?: number;
  campaign_type?: string;
  ngo_verification?: {
    verified?: boolean;
    level?: string;
    registry_type?: string;
    checked_at?: string;
  };
}

export function DonorDashboardPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [stats, setStats] = useState({
    totalDonated: 0,
    campaignsBacked: 0,
    impactScore: 'Silver',
    thisMonth: 0,
  });

  const calculateImpactScore = (total: number) => {
    if (total >= 5000) return 'Gold';
    if (total >= 1000) return 'Silver';
    if (total > 0) return 'Bronze';
    return 'Silver';
  };

  const fetchDonationStats = async () => {
    try {
      const response = await api.get('/donations/history');
      if (response.data.success && Array.isArray(response.data.donations)) {
        const donations = response.data.donations;
        const totalDonated = donations.reduce((sum: number, d: any) => sum + (d.amount || 0), 0);
        const campaignsBacked = new Set(donations.map((d: any) => d.campaignId)).size;
        const now = new Date();
        const thisMonth = donations
          .filter((d: any) => {
            const dt = new Date(d.timestamp);
            return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
          })
          .reduce((sum: number, d: any) => sum + (d.amount || 0), 0);

        setStats({
          totalDonated,
          campaignsBacked,
          impactScore: calculateImpactScore(totalDonated),
          thisMonth,
        });
      }
    } catch (err: any) {
      console.error('Error fetching donation stats:', err);
    }
  };

  useEffect(() => {
    const fetchVerifiedCampaigns = async () => {
      try {
        setLoading(true);
        // Fetch only verified campaigns (created by fundraisers and approved by admin)
        const response = await api.get('/campaigns', {
          params: {
            sort: 'newest',
          }
        });

        if (response.data.success && response.data.campaigns) {
          // Campaigns endpoint returns only verified campaigns by default
          setCampaigns(response.data.campaigns.slice(0, 6)); // Show first 6 campaigns
          setError(null);
        }
      } catch (err: any) {
        console.error('Error fetching campaigns:', err);
        setError(err.response?.data?.message || 'Failed to load campaigns');
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVerifiedCampaigns();
    fetchUnreadMessages();
    fetchDonationStats();
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

  // Default profile display if no user
  const donorInfo = user || {
    name: 'Guest Donor',
    email: 'not-logged-in',
    avatar: 'https://i.pravatar.cc/150?u=guest',
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
      {/* Header with Donor Info */}
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Donor Hub</h1>
            <p className="text-slate-500 mt-2">Track your donations and impact</p>
          </div>
          <div className="flex items-center gap-3 sm:ml-auto">
            <img 
              src={donorInfo.avatar} 
              alt={donorInfo.name}
              className="w-12 h-12 rounded-full border-2 border-emerald-500"
            />
            <div>
              <p className="font-semibold text-slate-900">{donorInfo.name}</p>
              <p className="text-sm text-slate-500">{donorInfo.email}</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Link to="/donor/donation-history" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Donation History</Link>
          <span className="text-slate-300">•</span>
          <Link to="/donor/messages" className="relative text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-2">
            Messages
            {unreadMessageCount > 0 && (
              <span className="absolute -top-2 -right-4 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
              </span>
            )}
          </Link>
          <span className="text-slate-300">•</span>
          <Link to="/donor/notifications" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Notifications</Link>
          <span className="text-slate-300">•</span>
          <Link to="/donor/profile" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Profile</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <i className="fa-solid fa-hand-holding-dollar text-xl" />
            </div>
            <span className="text-sm font-medium text-slate-500">Total Donated</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">${stats.totalDonated.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <i className="fa-solid fa-heart text-xl" />
            </div>
            <span className="text-sm font-medium text-slate-500">Campaigns Backed</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.campaignsBacked}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <i className="fa-solid fa-trophy text-xl" />
            </div>
            <span className="text-sm font-medium text-slate-500">Impact Score</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.impactScore}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <i className="fa-solid fa-bolt text-xl" />
            </div>
            <span className="text-sm font-medium text-slate-500">This Month</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">${stats.thisMonth.toLocaleString()}</p>
        </div>
      </div>

      {/* Recent Donations */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h2 className="text-xl font-bold text-slate-900">Available Campaigns to Support</h2>
          <Link to="/campaigns" className="text-emerald-600 font-semibold hover:text-emerald-700 flex items-center gap-2">
            Discover more <i className="fa-solid fa-arrow-right text-sm" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-slate-500 mb-4">{error}</p>
            <Link to="/campaigns" className="inline-block px-8 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
              Browse All Campaigns
            </Link>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 mb-4">No verified campaigns available at the moment</p>
            <Link to="/campaigns" className="inline-block px-8 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
              Browse All Campaigns
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {campaigns.map((campaign) => (
              <CampaignCard 
                key={campaign._id} 
                campaign={{
                  id: campaign._id,
                  fundraiserId: campaign.fundraiser._id,
                  image: campaign.images?.[0] || 'https://via.placeholder.com/400x300?text=Campaign',
                  category: campaign.category,
                  categoryIcon: 'fa-heart-pulse',
                  categoryBadge: 'text-emerald-700',
                  titleHover: 'group-hover:text-emerald-700',
                  avatar: organizerAvatarUrl(campaign.fundraiser),
                  author: campaign.fundraiser.username,
                  title: campaign.title,
                  description: campaign.description,
                  raised: campaign.raisedAmount || 0,
                  goal: campaign.goalAmount,
                  percent: campaign.progress || Math.round(((campaign.raisedAmount || 0) / campaign.goalAmount) * 100),
                  campaign_type: campaign.campaign_type,
                  ngo_verification: campaign.ngo_verification,
                  status: campaign.status,
                }} 
              />
            ))}
          </div>
        )}
      </div>

      <RecommendedCampaigns title="Suggested campaigns" maxItems={4} className="mt-10" />
    </div>
  );
}
