import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { campaigns } from '../data/campaigns';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Modal } from '../components/ui/Modal';
import { LiveBadge } from '../components/live/LiveBadge';
import { OnlineViewers } from '../components/live/OnlineViewers';
import { LiveDonationTicker } from '../components/live/LiveDonationTicker';
import { useRealtime } from '../contexts/RealtimeContext';
import { CampaignComments } from '../components/campaign/CampaignComments';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import { organizerAvatarUrl } from '../utils/organizerAvatar';
import { useSocket } from '../hooks/useSocket';
import { NgoVerificationBadge } from '../components/campaign/NgoVerificationBadge';

interface CampaignData {
  _id: string;
  title: string;
  description: string;
  images?: string[];
  category: string;
  goalAmount: number;
  raisedAmount: number;
  donorCount?: number;
  adminPaused?: boolean;
  status?: string;
  campaign_type?: string;
  ngo_verification?: {
    verified?: boolean;
    level?: string;
    registry_type?: string;
    checked_at?: string;
  };
  updates?: {
    _id?: string;
    title: string;
    content: string;
    postedAt: string;
  }[];
  fundraiser?: {
    _id: string;
    username: string;
    email?: string;
    profilePicture?: string | null;
  };
}

interface TopDonation {
  id: string;
  donorName: string;
  donorAvatar?: string;
  amount: number;
  timestamp: string;
  verified?: boolean;
}

interface RecentSidebarDonation {
  id: string;
  donorName: string;
  donorAvatar?: string;
  amount: number;
  timestamp: string;
}

const formatTimestamp = (date: string) =>
  new Date(date).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export function CampaignDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth() || { user: null };
  const { socket } = useSocket();
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  /** Public donor hit a campaign hidden by admin pause */
  const [restrictedPublic, setRestrictedPublic] = useState(false);
  
  // Fallback to mock data for now
  const realtime = useRealtime();
  const campaignFromData = campaigns.find((c) => c.id === Number(id)) || campaigns[0];
  const progressOverride = realtime.getProgressOverride(campaignFromData.id);
  const fallbackCampaign = useMemo(() => {
    if (!progressOverride) return campaignFromData;
    return { ...campaignFromData, raised: progressOverride.raised, goal: progressOverride.goal, percent: progressOverride.percent };
  }, [campaignFromData, progressOverride]);
  
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState(25);
  const [donationSuccess, setDonationSuccess] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [recentDonations, setRecentDonations] = useState<TopDonation[]>([]);
  const [recentDonationsLoading, setRecentDonationsLoading] = useState(true);
  const [sidebarRecentDonations, setSidebarRecentDonations] = useState<RecentSidebarDonation[]>([]);
  const [sidebarRecentLoading, setSidebarRecentLoading] = useState(true);
  const [campaignViewerCount, setCampaignViewerCount] = useState(0);
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [updateContent, setUpdateContent] = useState('');
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchTopDonations = async () => {
      try {
        setRecentDonationsLoading(true);
        const response = await api.get(`/campaigns/${id}/donations/top`);
        if (response.data?.success) {
          setRecentDonations(response.data.donations || []);
        } else {
          setRecentDonations([]);
        }
      } catch (err) {
        console.error('Failed to fetch top donations:', err);
        setRecentDonations([]);
      } finally {
        setRecentDonationsLoading(false);
      }
    };

    const fetchSidebarRecentDonations = async () => {
      try {
        setSidebarRecentLoading(true);
        const response = await api.get(`/campaigns/${id}/donations/recent`, {
          params: { limit: 5 },
        });
        if (response.data?.success) {
          setSidebarRecentDonations(response.data.donations || []);
        } else {
          setSidebarRecentDonations([]);
        }
      } catch (err) {
        console.error('Failed to fetch recent sidebar donations:', err);
        setSidebarRecentDonations([]);
      } finally {
        setSidebarRecentLoading(false);
      }
    };

    fetchTopDonations();
    fetchSidebarRecentDonations();

    const interval = setInterval(() => {
      fetchTopDonations();
      fetchSidebarRecentDonations();
    }, 15000);

    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/campaigns/${id}`);
        if (response.data.success) {
          setCampaign(response.data.campaign);
          setError('');
          setRestrictedPublic(false);
        } else {
          setError('Campaign not found');
        }
      } catch (err: any) {
        console.error('Failed to fetch campaign:', err);
        if (err.response?.status === 403 && err.response?.data?.restricted) {
          setRestrictedPublic(true);
          setCampaign(null);
          setError('');
        } else {
          setRestrictedPublic(false);
          setError(err.response?.data?.message || 'Failed to load campaign');
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCampaign();
    }
  }, [id]);

  useEffect(() => {
    if (campaign?.adminPaused) {
      setShowDonateModal(false);
      setDonationSuccess(false);
      setPaymentError('');
    }
  }, [campaign?.adminPaused]);

  useEffect(() => {
    if (!socket || !id) return;

    const onCampaignViewersCount = (payload: { campaignId?: string; count?: number }) => {
      if (String(payload?.campaignId || '') === String(id)) {
        setCampaignViewerCount(payload?.count ?? 0);
      }
    };

    socket.emit('joinCampaignView', { campaignId: id });
    socket.on('campaign:viewers:count', onCampaignViewersCount);

    return () => {
      socket.emit('leaveCampaignView', { campaignId: id });
      socket.off('campaign:viewers:count', onCampaignViewersCount);
    };
  }, [socket, id]);

  // Handle Stripe payment
  const handleDonatePayment = async () => {
    if (user?.role && user.role !== 'donor') {
      setPaymentError('Only donors can make donations');
      return;
    }

    if (campaign?.adminPaused) {
      setPaymentError('This campaign is paused and cannot accept donations right now.');
      return;
    }

    if (!donationAmount || donationAmount < 1) {
      setPaymentError('Please enter a valid donation amount');
      return;
    }

    setProcessingPayment(true);
    setPaymentError('');

    try {
      // Get the actual campaign ID (from real data if available, otherwise from mock)
      const actualCampaignId = campaign?._id || campaignFromData.id;

      const response = await api.post('/donations/donate', {
        campaignId: actualCampaignId,
        amount: donationAmount,
      });

      if (response.data.success && response.data.checkoutUrl) {
        console.log('✅ Payment session created. Redirecting to Stripe Checkout...');
        console.log('Checkout URL:', response.data.checkoutUrl);

        // Redirect to the full Stripe Checkout URL returned from the server
        window.location.href = response.data.checkoutUrl;
      } else {
        setPaymentError(response.data.message || 'Failed to create payment session');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setPaymentError(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePostUpdate = async () => {
    if (!id || !updateContent.trim()) return;
    try {
      setPostingUpdate(true);
      setUpdateError('');
      const response = await api.post(`/campaigns/${id}/updates`, {
        content: updateContent.trim(),
      });
      if (response.data?.success) {
        setCampaign(response.data.campaign);
        setUpdateContent('');
      } else {
        setUpdateError('Failed to post update');
      }
    } catch (err: any) {
      setUpdateError(err.response?.data?.message || 'Failed to post update');
    } finally {
      setPostingUpdate(false);
    }
  };

  // Check if current user is the fundraiser who created this campaign
  const isFundraiser = user?.role === 'fundraiser';
  const userId = user?.id || (user as { _id?: string } | null)?._id;
  const isCampaignOwner =
    !!userId && !!campaign?.fundraiser?._id && String(campaign.fundraiser._id) === String(userId);
  const isAdmin = user?.role === 'admin';
  const donationsBlocked = !!(campaign?.adminPaused);
  // Paused: no one (donors, guests, or fundraisers) can start a donation from this page
  const canDonate = !donationsBlocked && !isFundraiser && user?.role === 'donor';

  // Use real campaign data if available, otherwise fallback to mock (not when platform-restricted for public)
  const displayCampaign = campaign || fallbackCampaign;

  const raisedForSidebar = campaign
    ? campaign.raisedAmount
    : fallbackCampaign.raised;
  const goalForSidebar = campaign ? campaign.goalAmount : fallbackCampaign.goal;
  const pctForSidebar = campaign
    ? Math.round((campaign.raisedAmount / Math.max(1, campaign.goalAmount)) * 100)
    : fallbackCampaign.percent;

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 md:px-8 max-w-5xl mx-auto">
      <Link to="/campaigns" className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-2 mb-6">
        <i className="fa-solid fa-arrow-left" /> Back to campaigns
      </Link>

      {loading && <p className="text-slate-500 text-center py-8">Loading campaign...</p>}
      {error && <p className="text-red-600 text-center py-8">{error}</p>}
      {!loading && restrictedPublic && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center max-w-xl mx-auto">
          <p className="text-red-800 font-semibold mb-2">
            <i className="fa-solid fa-circle-pause mr-2" />
            Donations are paused
          </p>
          <p className="text-red-700/90 text-sm mb-2">
            This campaign has been temporarily restricted by SafeDonate. It is not open to the public, and{' '}
            <span className="font-semibold">no one can donate</span> — including donors and organizers — until the platform resumes it.
          </p>
          <Link to="/campaigns" className="text-emerald-700 font-semibold hover:underline inline-block mt-4">
            Back to Discover
          </Link>
        </div>
      )}
      {!loading && !campaign && !error && !restrictedPublic && (
        <p className="text-slate-500 text-center py-8">Campaign not found</p>
      )}
      
      {!loading && !restrictedPublic && displayCampaign && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative rounded-2xl overflow-hidden shadow-sm border border-slate-100">
            <img src={campaign?.images?.[0] || campaignFromData.image} alt={displayCampaign.title} className="w-full h-64 sm:h-80 object-cover" />
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <LiveBadge />
              <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white/90 ${
                campaign ? 'bg-emerald-100 text-emerald-700' : campaignFromData.categoryBadge
              }`}>
                <i className={`fa-solid ${campaign ? 'fa-heart' : campaignFromData.categoryIcon} mr-1`} /> {campaign?.category || displayCampaign.category}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">{displayCampaign.title}</h1>
            {campaign?.campaign_type === 'ngo' && (
              <div className="mb-4">
                <NgoVerificationBadge
                  campaignType={campaign.campaign_type}
                  ngoVerification={campaign.ngo_verification}
                  campaignStatus={campaign.status}
                  variant="prominent"
                />
              </div>
            )}
            {campaign?.adminPaused && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <span className="font-bold">
                  <i className="fa-solid fa-circle-pause mr-2" />
                  Donations paused — restricted
                </span>
                <span className="block mt-1 text-red-700/90">
                  {isCampaignOwner
                    ? 'Your campaign is hidden from Discover. Donors and other visitors cannot donate, and you cannot receive new contributions, until an admin resumes it.'
                    : isAdmin
                      ? 'This campaign is hidden from Discover. Donors and fundraisers cannot send new contributions until you resume it from Manage Campaigns.'
                      : 'Donors and organizers cannot send new contributions until SafeDonate resumes this campaign.'}
                </span>
              </div>
            )}
            {campaign?.fundraiser && (
            <div className="flex items-center gap-3 mb-6">
              <img
                src={organizerAvatarUrl(campaign.fundraiser)}
                alt={campaign.fundraiser.username}
                className="w-12 h-12 rounded-full border-2 border-white shadow object-cover"
              />
              <div>
                <p className="font-semibold text-slate-800">by {campaign.fundraiser.username}</p>
                <p className="text-sm text-slate-500">Campaign organizer</p>
              </div>
            </div>
            )}
            <p className="text-slate-600 leading-relaxed">{displayCampaign.description}</p>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-4">Recent Donations</h3>
              <div className="space-y-3 mb-6">
                {recentDonationsLoading ? (
                  <p className="text-slate-500 text-sm">Loading donations...</p>
                ) : recentDonations.length === 0 ? (
                  <p className="text-slate-500 text-sm">No donations yet.</p>
                ) : (
                  recentDonations.map((d) => (
                    <div key={d.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <img src={d.donorAvatar || 'https://i.pravatar.cc/150'} alt="" className="w-8 h-8 rounded-full" />
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{d.donorName}</p>
                          <p className="text-xs text-slate-500">{formatTimestamp(d.timestamp)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-emerald-600">${d.amount}</span>
                        {d.verified && (
                          <span className="text-emerald-500" title="Verified">
                            <i className="fa-solid fa-shield-check text-xs" />
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-4">Campaign Updates</h3>
              {isCampaignOwner && (
                <div className="mb-4">
                  <textarea
                    value={updateContent}
                    onChange={(e) => setUpdateContent(e.target.value)}
                    placeholder="Share a new update with supporters..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none text-slate-800 placeholder-slate-400"
                  />
                  {updateError && <p className="mt-2 text-sm text-red-600">{updateError}</p>}
                  <button
                    type="button"
                    onClick={handlePostUpdate}
                    disabled={postingUpdate || !updateContent.trim()}
                    className="mt-2 px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {postingUpdate ? 'Posting...' : 'Post update'}
                  </button>
                </div>
              )}
              <div className="space-y-4">
                {campaign?.updates && campaign.updates.length > 0 ? (
                  [...campaign.updates]
                    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
                    .map((u, index) => (
                      <div key={u._id || `${u.postedAt}-${index}`} className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-slate-700">{u.content}</p>
                        <p className="text-xs text-slate-500 mt-2">{formatTimestamp(u.postedAt)}</p>
                      </div>
                    ))
                ) : (
                  <p className="text-slate-500 text-sm">No updates yet.</p>
                )}
              </div>
            </div>

            {campaign?._id && (
              <CampaignComments campaignId={campaign._id} organizerName={campaign?.fundraiser?.username || campaignFromData.author} />
            )}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="sticky top-24 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className="mb-6">
                <div className="flex justify-between text-sm font-semibold text-slate-700 mb-2">
                  <span className="text-emerald-600">${raisedForSidebar.toLocaleString()} raised</span>
                  <span>of ${goalForSidebar.toLocaleString()}</span>
                </div>
                <ProgressBar value={pctForSidebar} showLabel size="md" />
              </div>
              <OnlineViewers count={campaignViewerCount} className="mb-6" />
              <p className="text-slate-500 text-sm mb-6">
                {campaign?.donorCount ?? 0} donors
              </p>
              {canDonate && (
              <button
                onClick={() => setShowDonateModal(true)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition-colors"
              >
                Donate Now
              </button>
              )}
              {donationsBlocked && (
              <div className="w-full space-y-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-red-800 text-center">
                <p className="font-semibold text-sm">
                  <i className="fa-solid fa-circle-pause mr-2" />
                  Donations paused
                </p>
                <p className="text-xs text-red-800/90 leading-relaxed">
                  Giving is turned off for everyone (donors, guests, and organizers) until SafeDonate resumes this campaign. No new payments can be started.
                </p>
              </div>
              )}
              {!donationsBlocked && isFundraiser && (
              <div className="w-full py-3.5 bg-slate-100 text-slate-600 font-semibold rounded-xl text-center">
                Fundraisers cannot donate
              </div>
              )}
              {!donationsBlocked && !isFundraiser && !canDonate && user?.role && user.role !== 'donor' && (
              <p className="text-xs text-slate-500 text-center px-1">
                Only accounts registered as donors can contribute to campaigns.
              </p>
              )}
              {!donationsBlocked && !isFundraiser && !user && (
              <Link
                to="/login"
                className="block w-full py-3.5 text-center text-sm font-semibold text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-50 transition-colors"
              >
                Sign in as a donor to donate
              </Link>
              )}
            <button className="w-full mt-3 py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors">
              <i className="fa-regular fa-heart mr-2" /> Save
            </button>
            </div>
            <LiveDonationTicker
              items={sidebarRecentDonations}
              loading={sidebarRecentLoading}
              title="Recent donations"
            />
          </div>
        </div>
      </div>
      )}

      <Modal isOpen={showDonateModal} onClose={() => { setShowDonateModal(false); setDonationSuccess(false); setPaymentError(''); }} title={donationSuccess ? 'Donation Successful' : campaign?.adminPaused ? 'Donations paused' : 'Make a Donation'} size="md">
        <div className="space-y-6">
          {campaign?.adminPaused ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-800">
              <p className="font-semibold mb-2">
                <i className="fa-solid fa-circle-pause mr-2" />
                This campaign cannot accept donations
              </p>
              <p className="text-red-800/90">
                Donations are paused by the platform. Donors and fundraisers cannot contribute until the campaign is resumed.
              </p>
            </div>
          ) : donationSuccess ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-4">
                <i className="fa-solid fa-check text-2xl" />
              </div>
              <p className="font-semibold text-slate-800 mb-2">Thank you for your donation!</p>
              <p className="text-slate-600 text-sm mb-4">Your ${donationAmount} contribution to {displayCampaign.title} is complete.</p>
              <Link to="/donor/donation-history" className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center justify-center gap-2">
                <i className="fa-solid fa-receipt" /> View receipt in Donation History
              </Link>
            </div>
          ) : (
            <>
          <p className="text-slate-600">Support {displayCampaign.title}</p>
          {paymentError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{paymentError}</p>
            </div>
          )}
          <div className="grid grid-cols-4 gap-2">
            {[25, 50, 100, 250].map((amt) => (
              <button
                key={amt}
                onClick={() => setDonationAmount(amt)}
                disabled={processingPayment}
                className={`py-2 rounded-lg font-medium transition-colors ${
                  donationAmount === amt ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                } ${processingPayment ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                ${amt}
              </button>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Custom amount ($)</label>
            <input
              type="number"
              value={donationAmount}
              onChange={(e) => setDonationAmount(Number(e.target.value) || 0)}
              disabled={processingPayment}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <button
              onClick={handleDonatePayment}
              disabled={processingPayment}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processingPayment ? 'Processing...' : `Donate $${donationAmount}`}
            </button>
            <p className="text-xs text-slate-500 text-center">Secure payment powered by Stripe</p>
          </div>
          </>
          )}
        </div>
      </Modal>
    </div>
  );
}
