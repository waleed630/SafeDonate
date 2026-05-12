import { Link } from 'react-router-dom';
import { useState } from 'react';
import type { Campaign } from '../data/campaigns';
import { useRealtime } from '../contexts/RealtimeContext';
import { useAuth } from '../contexts/AuthContext';
import { MessageModal } from './MessageModal';
import type { NgoVerificationSnapshot } from './campaign/NgoVerificationBadge';
import { NgoVerificationBadge } from './campaign/NgoVerificationBadge';

interface CampaignCardProps {
  campaign: Omit<Campaign, 'id'> & {
    id: string | number;
    fundraiserId?: string;
    campaign_type?: string;
    ngo_verification?: NgoVerificationSnapshot | null;
    status?: string;
  };
  onDonateClick?: (campaignId: string) => void;
}

export function CampaignCard({ campaign, onDonateClick }: CampaignCardProps) {
  const { connected, getProgressOverride } = useRealtime();
  const { user } = useAuth() || { user: null };
  const [showMessageModal, setShowMessageModal] = useState(false);
  const campaignIdNumber = typeof campaign.id === 'number' ? campaign.id : NaN;
  const progressOverride = connected && Number.isFinite(campaignIdNumber) ? getProgressOverride(campaignIdNumber) : null;
  const display = progressOverride
    ? { ...campaign, raised: progressOverride.raised, goal: progressOverride.goal, percent: progressOverride.percent }
    : campaign;

  const handleDonateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If the user is not a donor, handle guest donation or redirect to campaign details.
    if (!user || user.role !== 'donor') {
      if (onDonateClick) {
        onDonateClick(String(display.id));
      } else {
        window.location.href = `/campaigns/${display.id}`;
      }
      return;
    }

    // Authenticated donor can go straight to campaign details.
    window.location.href = `/campaigns/${display.id}`;
  };

  const handleMessageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      // Show login modal or redirect to login
      window.location.href = '/login';
      return;
    }
    
    setShowMessageModal(true);
  };

  return (
    <>
    <Link to={`/campaigns/${display.id}`}>
    <article className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col h-full">
      <div className="relative h-56 overflow-hidden">
        <img src={display.image} alt={display.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap max-w-[85%]">
          <span className={`bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold ${display.categoryBadge} shadow-sm`}>
            <i className={`fa-solid ${display.categoryIcon} mr-1`} /> {display.category}
          </span>
        </div>
        <button type="button" className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-rose-500 transition-colors">
          <i className="fa-regular fa-heart" />
        </button>
      </div>
        <div className="p-4 sm:p-6 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <img src={display.avatar} alt={display.author} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" />
          <div className="flex-1">
            <span className="text-sm text-slate-500">by <span className="text-slate-800 font-medium">{display.author}</span></span>
          </div>
          <button
            type="button"
            onClick={handleMessageClick}
            className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors flex items-center justify-center"
            title={`Message ${display.author}`}
          >
            <i className="fa-solid fa-envelope text-sm" />
          </button>
        </div>
        <h3 className={`text-xl font-bold text-slate-800 mb-2 ${display.titleHover} transition-colors line-clamp-2`}>{display.title}</h3>
        <NgoVerificationBadge
          campaignType={display.campaign_type}
          ngoVerification={display.ngo_verification}
          campaignStatus={display.status}
          variant="inline"
        />
        <p className="text-slate-500 text-sm mb-6 line-clamp-2 mt-2">{display.description}</p>
        <div className="mt-auto space-y-4">
          <div>
            <div className="flex justify-between text-sm font-semibold mb-2">
              <span className="text-emerald-600">${display.raised.toLocaleString()} raised</span>
              <span className="text-slate-400">{display.percent}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full relative overflow-hidden" style={{ width: `${display.percent}%` }}>
                {display.percent === 83 && <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />}
              </div>
            </div>
            <div className="mt-1 text-xs text-slate-400 text-right">Goal: ${display.goal.toLocaleString()}</div>
          </div>
          <button 
            type="button" 
            onClick={handleDonateClick}
            className="w-full py-3 rounded-xl border-2 border-emerald-100 text-emerald-700 font-bold hover:bg-emerald-50 hover:border-emerald-200 transition-all active:scale-[0.98]"
          >
            Donate Now
          </button>
        </div>
      </div>
    </article>
    </Link>

    <MessageModal
      isOpen={showMessageModal}
      onClose={() => setShowMessageModal(false)}
      fundraiserName={display.author}
      fundraiserId={String(campaign.fundraiserId || display.id)}
      campaignTitle={display.title}
      campaignId={String(display.id)}
    />
    </>
  );
}
