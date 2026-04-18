import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { campaigns } from '../data/campaigns';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Modal } from '../components/ui/Modal';
import { LiveBadge } from '../components/live/LiveBadge';
import { OnlineViewers } from '../components/live/OnlineViewers';
import { LiveDonationTicker } from '../components/live/LiveDonationTicker';
import { mockCampaignUpdates, getDonationsByCampaign, formatTimestamp } from '../data/mockData';
import { useRealtime } from '../contexts/RealtimeContext';
import { CampaignComments } from '../components/campaign/CampaignComments';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

interface CampaignData {
  _id: string;
  title: string;
  description: string;
  images?: string[];
  category: string;
  goalAmount: number;
  raisedAmount: number;
  fundraiser?: {
    _id: string;
    username: string;
    email?: string;
  };
}

export function CampaignDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth() || { user: null };
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
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

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/campaigns/${id}`);
        if (response.data.success) {
          setCampaign(response.data.campaign);
          setError('');
        } else {
          setError('Campaign not found');
        }
      } catch (err: any) {
        console.error('Failed to fetch campaign:', err);
        setError(err.response?.data?.message || 'Failed to load campaign');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCampaign();
    }
  }, [id]);

  // Handle Stripe payment
  const handleDonatePayment = async () => {
    if (user?.role && user.role !== 'donor') {
      setPaymentError('Only donors can make donations');
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

  // Check if current user is the fundraiser who created this campaign
  const isFundraiser = user?.role === 'fundraiser';
  const isCampaignOwner = campaign?.fundraiser?._id === user?._id;
  // Only donors can donate, not fundraisers
  const canDonate = !isFundraiser;

  // Use real campaign data if available, otherwise fallback to mock
  const displayCampaign = campaign || fallbackCampaign;

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 md:px-8 max-w-5xl mx-auto">
      <Link to="/campaigns" className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-2 mb-6">
        <i className="fa-solid fa-arrow-left" /> Back to campaigns
      </Link>

      {loading && <p className="text-slate-500 text-center py-8">Loading campaign...</p>}
      {error && <p className="text-red-600 text-center py-8">{error}</p>}
      {!loading && !campaign && !error && (
        <p className="text-slate-500 text-center py-8">Campaign not found</p>
      )}
      
      {!loading && displayCampaign && (
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
            {campaign?.fundraiser && (
            <div className="flex items-center gap-3 mb-6">
              <img src="https://i.pravatar.cc/150?u=" alt={campaign.fundraiser.username} className="w-12 h-12 rounded-full border-2 border-white shadow" />
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
                {getDonationsByCampaign(campaignFromData.id).slice(0, 5).map((d) => (
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
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-4">Campaign Updates</h3>
              <div className="space-y-4">
                {mockCampaignUpdates.map((u) => (
                  <div key={u.id} className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-slate-700">{u.text}</p>
                    <p className="text-xs text-slate-500 mt-2">{u.date}</p>
                  </div>
                ))}
              </div>
            </div>

            <CampaignComments campaignId={campaign?._id || campaignFromData.id} organizerName={campaign?.fundraiser?.username || campaignFromData.author} />
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="sticky top-24 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className="mb-6">
                <div className="flex justify-between text-sm font-semibold text-slate-700 mb-2">
                  <span className="text-emerald-600">${campaign?.raisedAmount?.toLocaleString() ?? displayCampaign.raised?.toLocaleString()} raised</span>
                  <span>of ${campaign?.goalAmount?.toLocaleString() ?? displayCampaign.goal?.toLocaleString()}</span>
                </div>
                <ProgressBar value={campaign ? Math.round((campaign.raisedAmount / campaign.goalAmount) * 100) : displayCampaign.percent} showLabel size="md" />
              </div>
              <OnlineViewers count={12} className="mb-6" />
              <p className="text-slate-500 text-sm mb-6">
                {campaign ? Math.floor(Math.random() * 20) + 5 : getDonationsByCampaign(campaignFromData.id).length} donors
              </p>
              {canDonate && (
              <button
                onClick={() => setShowDonateModal(true)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition-colors"
              >
                Donate Now
              </button>
              )}
              {!canDonate && (
              <div className="w-full py-3.5 bg-slate-100 text-slate-600 font-semibold rounded-xl text-center">
                Fundraisers cannot donate
              </div>
              )}
            <button className="w-full mt-3 py-3 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors">
              <i className="fa-regular fa-heart mr-2" /> Save
            </button>
            </div>
            <LiveDonationTicker variant="campaign" campaignId={campaign?._id || campaignFromData.id} maxItems={5} />
          </div>
        </div>
      </div>
      )}

      <Modal isOpen={showDonateModal} onClose={() => { setShowDonateModal(false); setDonationSuccess(false); setPaymentError(''); }} title={donationSuccess ? 'Donation Successful' : 'Make a Donation'} size="md">
        <div className="space-y-6">
          {donationSuccess ? (
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
