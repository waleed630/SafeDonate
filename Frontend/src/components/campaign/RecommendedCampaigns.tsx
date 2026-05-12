import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CampaignCard } from '../CampaignCard';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { organizerAvatarUrl } from '../../utils/organizerAvatar';

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

interface RecommendedCampaignsProps {
  title?: string;
  maxItems?: number;
  className?: string;
}

/**
 * Renders personalized or suggested verified campaigns.
 * Fetches from backend to ensure showing only campaigns created by fundraisers and verified by admin.
 */
export function RecommendedCampaigns({
  title = 'Recommended for you',
  maxItems = 4,
  className = '',
}: RecommendedCampaignsProps) {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendedCampaigns = async () => {
      try {
        setLoading(true);
        const response = await api.get('/campaigns', {
          params: {
            sort: 'newest',
          }
        });

        if (response.data.success && response.data.campaigns) {
          setCampaigns(response.data.campaigns);
        }
      } catch (err) {
        console.error('Error fetching recommended campaigns:', err);
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendedCampaigns();
  }, [user]);

  if (loading || campaigns.length === 0) return null;

  const display = campaigns.slice(0, maxItems);

  return (
    <section className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-xl font-bold text-slate-800">{title}</h3>
        <Link
          to="/campaigns"
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
        >
          View all <i className="fa-solid fa-arrow-right text-xs" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {display.map((campaign) => (
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
    </section>
  );
}
