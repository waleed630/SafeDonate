import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { CampaignCard } from '../components/CampaignCard';
import { LoginRequiredModal } from '../components/LoginRequiredModal';
import api from '../api/axios';
import { useCategories } from '../contexts/CategoriesContext';

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
  };
  progress?: number;
  verified: boolean;
  tags?: string[];
  createdAt: string;
  donorCount?: number;
}

export function FeaturedCampaignsPage() {
  const [featuredCampaigns, setFeaturedCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | undefined>();
  const { categories } = useCategories();

  // Helper function to get category styling
  const getCategoryStyles = (categoryName: string) => {
    const category = categories.find(
      (c) => c.label.toLowerCase() === categoryName.toLowerCase()
    );
    if (category) {
      return {
        icon: category.icon,
        badge: category.badge,
        hover: `group-hover:text-${category.badge.split('-')[1]}-700`,
      };
    }
    // Fallback defaults
    return {
      icon: 'fa-heart',
      badge: 'text-emerald-700',
      hover: 'group-hover:text-emerald-700',
    };
  };

  const handleDonateClick = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setShowLoginModal(true);
  };

  useEffect(() => {
    const fetchFeaturedCampaigns = async () => {
      try {
        setLoading(true);
        // Fetch campaigns tagged as "Featured" from the backend
        const response = await api.get('/campaigns', {
          params: {
            tags: 'Featured', // Filter for campaigns with the "Featured" tag
            sort: 'newest' // Show newest featured campaigns first
          }
        });

        if (response.data.success && response.data.campaigns) {
          setFeaturedCampaigns(response.data.campaigns);
          setError(null);
        }
      } catch (err: any) {
        console.error('Error fetching featured campaigns:', err);
        setError(err.response?.data?.message || 'Failed to load featured campaigns');
        setFeaturedCampaigns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedCampaigns();
  }, []);

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-4">
          <i className="fa-solid fa-star" />
          Hand-picked by our team
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Featured Campaigns</h1>
        <p className="text-slate-500 mt-2">Urgent causes needing your immediate support</p>
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
      ) : featuredCampaigns.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 mb-4">No featured campaigns available at the moment</p>
          <Link to="/campaigns" className="inline-block px-8 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
            Browse All Campaigns
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {featuredCampaigns.map((campaign) => {
              const categoryStyles = getCategoryStyles(campaign.category);
              return (
                <CampaignCard 
                  key={campaign._id} 
                  onDonateClick={handleDonateClick}
                  campaign={{
                    id: campaign._id,
                    fundraiserId: campaign.fundraiser._id,
                    image: campaign.images?.[0] || 'https://via.placeholder.com/400x300?text=Campaign',
                    category: campaign.category,
                    categoryIcon: categoryStyles.icon,
                    categoryBadge: categoryStyles.badge,
                    titleHover: categoryStyles.hover,
                    avatar: 'https://i.pravatar.cc/150?u=' + campaign.fundraiser._id,
                    author: campaign.fundraiser.username,
                    title: campaign.title,
                    description: campaign.description,
                    raised: campaign.raisedAmount || 0,
                    goal: campaign.goalAmount,
                    percent: campaign.progress || Math.round(((campaign.raisedAmount || 0) / campaign.goalAmount) * 100),
                  }} 
                />
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link to="/campaigns" className="inline-block px-8 py-3 bg-white border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 hover:text-emerald-600 transition-colors shadow-sm">
              Browse All Campaigns
            </Link>
          </div>
        </>
      )}
      
      <LoginRequiredModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        campaignId={selectedCampaignId}
      />
    </div>
  );
}
