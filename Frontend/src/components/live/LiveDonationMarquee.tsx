import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { mockLiveDonations } from '../../data/mockData';

interface LiveDonation {
  id: string;
  donorName: string;
  donorAvatar?: string;
  amount: number;
  campaign: string;
  campaignId?: number;
  timestamp?: string;
  timeAgo: string;
}

interface LiveDonationMarqueeProps {
  className?: string;
}

const getRelativeTime = (timestamp?: string): string => {
  if (!timestamp) return 'Just now';
  const published = new Date(timestamp).getTime();
  const now = Date.now();
  const diffSeconds = Math.max(0, Math.floor((now - published) / 1000));

  if (diffSeconds < 60) return 'Just now';
  if (diffSeconds < 120) return '1m ago';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 7200) return '1h ago';
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  return `${Math.floor(diffSeconds / 86400)}d ago`;
};

export function LiveDonationMarquee({ className = '' }: LiveDonationMarqueeProps) {
  const [items, setItems] = useState<LiveDonation[]>([]);

  useEffect(() => {
    const fetchLiveDonations = async () => {
      try {
        const response = await api.get('/donations/live');
        const donations = response.data.donations || [];

        const normalized = donations.map((d: any) => ({
          id: d.id || d._id || `${Math.random()}`,
          donorName: d.donorName || 'Anonymous',
          donorAvatar: d.donorAvatar,
          amount: d.amount ?? 0,
          campaign: d.campaign || 'Campaign',
          campaignId: d.campaignId,
          timestamp: d.timestamp,
          timeAgo: getRelativeTime(d.timestamp),
        }));

        if (normalized.length > 0) {
          setItems(normalized);
          return;
        }
      } catch (error) {
        console.warn('Live donations fetch failed, using fallback mock data.', error);
      }

      setItems(mockLiveDonations);
    };

    fetchLiveDonations();
  }, []);

  const displayItems = items.length > 0 ? [...items, ...items] : [...mockLiveDonations, ...mockLiveDonations];

  return (
    <div className={`overflow-hidden border-b border-slate-100 bg-white/80 backdrop-blur-sm ${className}`}>
      <div className="flex items-center gap-6 py-2">
        <span className="flex-shrink-0 flex items-center gap-2 px-4">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Live donations</span>
        </span>
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex animate-marquee hover:[animation-play-state:paused]">
            {displayItems.map((d, i) => (
              <span key={`${d.id}-${i}`} className="flex-shrink-0 mx-4 text-sm text-slate-600 whitespace-nowrap">
                <span className="font-medium text-slate-800">{d.donorName}</span>
                <span className="text-slate-500"> donated </span>
                <span className="font-semibold text-emerald-600">${d.amount}</span>
                <span className="text-slate-500"> to {d.campaign}</span>
                <span className="text-slate-400 text-xs ml-1">• {d.timeAgo}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
