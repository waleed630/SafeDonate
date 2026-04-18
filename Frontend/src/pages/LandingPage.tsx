import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CampaignCard } from '../components/CampaignCard';
import api from '../api/axios';
import { useCategories } from '../contexts/CategoriesContext';

const categories = [
  { icon: 'fa-heart-pulse', label: 'Medical', bg: 'bg-emerald-50', text: 'text-emerald-600', hoverBg: 'group-hover:bg-emerald-600', hoverText: 'group-hover:text-emerald-700' },
  { icon: 'fa-graduation-cap', label: 'Education', bg: 'bg-blue-50', text: 'text-blue-600', hoverBg: 'group-hover:bg-blue-600', hoverText: 'group-hover:text-blue-700' },
  { icon: 'fa-paw', label: 'Animals', bg: 'bg-amber-50', text: 'text-amber-600', hoverBg: 'group-hover:bg-amber-600', hoverText: 'group-hover:text-amber-700' },
  { icon: 'fa-house-chimney-crack', label: 'Disaster', bg: 'bg-rose-50', text: 'text-rose-600', hoverBg: 'group-hover:bg-rose-600', hoverText: 'group-hover:text-rose-700' },
  { icon: 'fa-palette', label: 'Creative', bg: 'bg-purple-50', text: 'text-purple-600', hoverBg: 'group-hover:bg-purple-600', hoverText: 'group-hover:text-purple-700' },
  { icon: 'fa-leaf', label: 'Environment', bg: 'bg-teal-50', text: 'text-teal-600', hoverBg: 'group-hover:bg-teal-600', hoverText: 'group-hover:text-teal-700' },
];

interface Campaign {
  _id: string;
  title: string;
  description: string;
  category: string;
  images?: string[];
  goalAmount: number;
  raisedAmount?: number;
  progress?: number;
  verified: boolean;
  tags?: string[];
  createdAt: string;
  donorCount?: number;
  fundraiser: {
    _id: string;
    username: string;
    email: string;
  };
}

export function LandingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [campaignsError, setCampaignsError] = useState<string | null>(null);
  const [platformAnalytics, setPlatformAnalytics] = useState({
    totalCampaigns: 0,
    totalRaised: 0,
    totalDonors: 0,
    transparency: 0,
  });
  const [platformLoading, setPlatformLoading] = useState(true);
  const [platformError, setPlatformError] = useState<string | null>(null);
  const { categories: categoryStyles } = useCategories();

  const getCategoryStyles = (categoryName: string) => {
    const category = categoryStyles.find(
      (c) => c.label.toLowerCase() === categoryName.toLowerCase(),
    );
    if (category) {
      return {
        icon: category.icon,
        badge: category.badge,
        hover: `group-hover:text-${category.badge.split('-')[1]}-700`,
      };
    }

    return {
      icon: 'fa-heart',
      badge: 'text-emerald-700',
      hover: 'group-hover:text-emerald-700',
    };
  };

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoadingCampaigns(true);
        setCampaignsError(null);
        const response = await api.get('/campaigns', {
          params: {
            sort: 'newest',
          },
        });

        const campaignList = response.data.campaigns || response.data.results || [];
        setCampaigns(Array.isArray(campaignList) ? campaignList : []);
      } catch (err: any) {
        setCampaignsError(err.response?.data?.message || 'Unable to load campaigns. Please try again.');
        setCampaigns([]);
      } finally {
        setLoadingCampaigns(false);
      }
    };

    const fetchPlatformAnalytics = async () => {
      try {
        setPlatformLoading(true);
        setPlatformError(null);
        const response = await api.get('/analytics/public');
        if (response.data?.success) {
          setPlatformAnalytics(response.data.overview);
        }
      } catch (err: any) {
        setPlatformError('Unable to load site metrics.');
      } finally {
        setPlatformLoading(false);
      }
    };

    fetchCampaigns();
    fetchPlatformAnalytics();
  }, [categoryStyles]);

  const formatNumber = (value: number) => value.toLocaleString();

  return (
    <>
      <section id="section-hero" className="relative min-h-[500px] sm:h-[600px] md:h-[650px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.pexels.com/photos/3656066/pexels-photo-3656066.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt="Happy family outdoors"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-900/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-5xl w-full px-4 sm:px-6 md:px-8 pt-8 sm:pt-12">
          <div className="max-w-2xl space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-sm text-emerald-100 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Over $10M raised this month
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight drop-shadow-lg">
              Empower Dreams,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">Fund the Future.</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-200 leading-relaxed max-w-xl drop-shadow-md">
              Join a global community of changemakers. Whether it&apos;s medical emergencies, creative projects, or community causes, your contribution sparks real change.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 pt-4">
              <button
                type="button"
                className="group relative px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald-500/40 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Donate Now
                  <i className="fa-solid fa-heart text-sm group-hover:animate-bounce" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
              <Link
                to="/fundraiser/create-campaign"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold rounded-xl transition-all duration-300 hover:-translate-y-1 inline-block"
              >
                Start Campaign
              </Link>
            </div>

            <div className="pt-6 sm:pt-8 flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-300 font-medium">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-shield-halved text-emerald-400" />
                Verified Charities
              </div>
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-lock text-emerald-400" />
                Secure Payments
              </div>
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-globe text-emerald-400" />
                Global Reach
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-20 -mt-12 sm:-mt-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-8 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="text-center space-y-1">
            <p className="text-3xl font-bold text-slate-800">
              {platformLoading ? '...' : `${formatNumber(platformAnalytics.totalDonors)}+`}
            </p>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Donors</p>
          </div>
          <div className="text-center space-y-1 pt-4 md:pt-0">
            <p className="text-3xl font-bold text-emerald-600">
              {platformLoading ? '...' : `$${formatNumber(platformAnalytics.totalRaised)}+`}
            </p>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Funds Raised</p>
          </div>
          <div className="text-center space-y-1 pt-4 md:pt-0">
            <p className="text-3xl font-bold text-slate-800">
              {platformLoading ? '...' : `${formatNumber(platformAnalytics.totalCampaigns)}+`}
            </p>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Campaigns</p>
          </div>
          <div className="text-center space-y-1 pt-4 md:pt-0">
            <p className="text-3xl font-bold text-slate-800">
              {platformLoading ? '...' : `${platformAnalytics.transparency}%`}
            </p>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Transparency</p>
          </div>
        </div>
      </div>

      <section id="section-categories" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Browse by Category</h2>
            <p className="text-slate-500 mt-1">Find causes that matter to you</p>
          </div>
          <Link to="/campaigns" className="text-emerald-600 font-semibold hover:text-emerald-700 flex items-center gap-2 transition-colors">
            View all <i className="fa-solid fa-arrow-right text-sm" />
          </Link>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-6 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {categories.map((cat) => (
            <a
              key={cat.label}
              href="#"
              className={`group flex-shrink-0 w-40 flex flex-col items-center gap-3 p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300`}
            >
              <div className={`w-14 h-14 rounded-full ${cat.bg} ${cat.text} flex items-center justify-center text-xl ${cat.hoverBg} group-hover:text-white transition-colors duration-300`}>
                <i className={`fa-solid ${cat.icon}`} />
              </div>
              <span className={`font-semibold text-slate-700 ${cat.hoverText}`}>{cat.label}</span>
            </a>
          ))}
        </div>
      </section>

      <section id="section-featured" className="py-8 sm:py-10 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto bg-slate-50 pb-16 sm:pb-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Featured Campaigns</h2>
            <p className="text-slate-500 mt-2">Urgent causes needing your immediate support</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm transition-all">
              <i className="fa-solid fa-chevron-left" />
            </button>
            <button type="button" className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm transition-all">
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>
        </div>

        {loadingCampaigns ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : campaignsError ? (
          <div className="text-center py-12">
            <p className="text-slate-500 mb-4">{campaignsError}</p>
            <Link to="/campaigns" className="inline-block px-8 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
              Browse All Campaigns
            </Link>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 mb-4">No verified campaigns available at the moment.</p>
            <Link to="/campaigns" className="inline-block px-8 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
              Browse All Campaigns
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {campaigns.slice(0, 3).map((campaign) => {
                const categoryStyle = getCategoryStyles(campaign.category);
                return (
                  <CampaignCard
                    key={campaign._id}
                    campaign={{
                      id: campaign._id,
                      fundraiserId: campaign.fundraiser._id,
                      image: campaign.images?.[0] || 'https://via.placeholder.com/400x300?text=Campaign',
                      category: campaign.category,
                      categoryIcon: categoryStyle.icon,
                      categoryBadge: categoryStyle.badge,
                      titleHover: categoryStyle.hover,
                      avatar: `https://i.pravatar.cc/150?u=${campaign.fundraiser._id}`,
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
              <Link
                to="/campaigns"
                className="inline-block px-8 py-3 bg-white border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 hover:text-emerald-600 transition-colors shadow-sm"
              >
                See All Campaigns
              </Link>
            </div>
          </>
        )}
      </section>

      <section className="bg-emerald-900 text-white py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-800/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-800/30 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
              Trusted by millions.
              <br />
              <span className="text-emerald-300">Built for impact.</span>
            </h2>
            <p className="text-emerald-100 text-lg leading-relaxed">
              SafeDonate ensures your generosity reaches those who need it most. With our SafeGive Guarantee, every donation is protected, verified, and transparent.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-800 flex items-center justify-center flex-shrink-0 text-emerald-300">
                  <i className="fa-solid fa-check text-xl" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Verified Fundraisers</h4>
                  <p className="text-emerald-200/80 text-sm">Every campaign undergoes a strict 5-step verification process.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-800 flex items-center justify-center flex-shrink-0 text-emerald-300">
                  <i className="fa-solid fa-bolt text-xl" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">Direct Payouts</h4>
                  <p className="text-emerald-200/80 text-sm">Funds are sent directly to beneficiaries, not intermediaries.</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Link
                to="/fundraiser/create-campaign"
                className="inline-block px-8 py-4 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold rounded-xl shadow-lg shadow-amber-900/20 transition-all duration-200 hover:-translate-y-1"
              >
                Start Your Fundraiser
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-emerald-500/20 rounded-2xl blur-lg" />
            <div className="relative w-full h-64 bg-emerald-800/30 rounded-2xl flex items-center justify-center">
              <i className="fa-solid fa-shield-halved text-6xl text-emerald-400/50" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
