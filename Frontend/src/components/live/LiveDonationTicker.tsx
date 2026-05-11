interface LiveDonationTickerItem {
  id: string;
  donorName: string;
  donorAvatar?: string;
  amount: number;
  timestamp: string;
  campaign?: string;
}

interface LiveDonationTickerProps {
  items: LiveDonationTickerItem[];
  loading?: boolean;
  title?: string;
  className?: string;
}

const timeAgo = (timestamp: string) => {
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export function LiveDonationTicker({ items, loading = false, title = 'Recent donations', className = '' }: LiveDonationTickerProps) {

  return (
    <div className={`bg-slate-50 border border-slate-100 rounded-xl overflow-hidden ${className}`}>
      <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{title}</span>
      </div>
      <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
        {loading ? (
          <p className="px-4 py-3 text-sm text-slate-500">Loading recent donations...</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-3 text-sm text-slate-500">No donations yet.</p>
        ) : (
          items.map((d) => (
            <div key={d.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/50 transition-colors">
              <img src={d.donorAvatar || 'https://i.pravatar.cc/150'} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-800 truncate">
                  <span className="font-medium">{d.donorName}</span>
                  <span className="text-slate-500"> donated </span>
                  <span className="font-semibold text-emerald-600">${d.amount.toLocaleString()}</span>
                  {d.campaign && <span className="text-slate-500"> to {d.campaign}</span>}
                </p>
                <p className="text-xs text-slate-400">{timeAgo(d.timestamp)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
