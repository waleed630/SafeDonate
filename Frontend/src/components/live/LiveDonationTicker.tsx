import { useState, useEffect } from 'react';
import { mockLiveDonations, type LiveDonation } from '../../data/mockData';
import { useRealtime } from '../../contexts/RealtimeContext';
import api from '../../api/axios';

interface LiveDonationTickerProps {
  variant?: 'campaign' | 'discover';
  campaignId?: string | number;
  maxItems?: number;
  className?: string;
}

export function LiveDonationTicker({ variant = 'discover', campaignId, maxItems = 6, className = '' }: LiveDonationTickerProps) {
  const { connected, liveDonations: realtimeDonations } = useRealtime();
  const [campaignDonations, setCampaignDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch real donations for campaign variant
  useEffect(() => {
    if (variant === 'campaign' && campaignId && typeof campaignId === 'string') {
      const fetchCampaignDonations = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/donations/campaign/${campaignId}`);
          if (response.data.success) {
            const donations = response.data.donations.slice(0, maxItems).map((d: any) => ({
              id: d.id,
              donorName: d.donorName,
              donorAvatar: d.donorAvatar,
              amount: d.amount,
              campaign: 'this campaign',
              campaignId: campaignId,
              timeAgo: formatTimeAgo(d.timestamp),
            }));
            setCampaignDonations(donations);
          }
        } catch (err) {
          console.error('Failed to fetch campaign donations:', err);
          // Fallback to mock data filtered by campaign
          const mockFiltered = mockLiveDonations.filter((d) => d.campaignId === campaignId).slice(0, maxItems);
          setCampaignDonations(mockFiltered);
        } finally {
          setLoading(false);
        }
      };
      fetchCampaignDonations();
    }
  }, [variant, campaignId, maxItems]);

  let items: LiveDonation[] = [];

  if (variant === 'campaign' && campaignId) {
    if (campaignDonations.length > 0) {
      items = campaignDonations;
    } else if (!loading) {
      // Show empty state for campaign with no donations
      items = [];
    } else {
      // Show loading state
      items = [];
    }
  } else {
    // For discover variant, use realtime or mock
    items = connected ? realtimeDonations : mockLiveDonations;
  }

  items = items.slice(0, maxItems);

  // Helper function to format timestamp to time ago
  function formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  return (
    <div className={`bg-slate-50 border border-slate-100 rounded-xl overflow-hidden ${className}`}>
      <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Recent donations</span>
      </div>
      <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-4 text-center">
            <p className="text-sm text-slate-500">Loading donations...</p>
          </div>
        ) : items.length > 0 ? (
          items.map((d) => (
            <div key={d.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/50 transition-colors">
              <img src={d.donorAvatar || 'https://i.pravatar.cc/150'} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-800 truncate">
                  <span className="font-medium">{d.donorName}</span>
                  <span className="text-slate-500"> donated </span>
                  <span className="font-semibold text-emerald-600">${d.amount.toLocaleString()}</span>
                  {variant === 'discover' && (
                    <span className="text-slate-500"> to {d.campaign}</span>
                  )}
                </p>
                <p className="text-xs text-slate-400">{d.timeAgo}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-4 text-center">
            <div className="text-slate-400 mb-2">
              <i className="fa-solid fa-heart text-lg" />
            </div>
            <p className="text-sm text-slate-500">No donations yet</p>
            <p className="text-xs text-slate-400">Be the first to donate!</p>
          </div>
        )}
      </div>
    </div>
  );
}
