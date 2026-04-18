import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  discoverCategories,
  discoverLocations,
  targetAmountRanges,
  progressRanges,
  type SortOption,
} from '../data/discoverCampaigns';
import { LiveDonationMarquee } from '../components/live/LiveDonationMarquee';
import { useTagsOptional } from '../contexts/TagsContext';
import api from '../api/axios';

interface CampaignItem {
  id: string;
  image: string;
  category: string;
  categoryId: string;
  title: string;
  description: string;
  location: string;
  raised: number;
  goal: number;
  percent: number;
  author: string;
  authorAvatar: string;
  daysLeft: number;
  donors: number;
  createdAt: string;
  urgent?: boolean;
  tagIds?: string[];
}

export function CampaignsPage() {
  const tagsContext = useTagsOptional();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [targetFilter, setTargetFilter] = useState<string>('all');
  const [progressFilter, setProgressFilter] = useState<string>('all');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setShowFilters(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        setError(null);

        const selectedCategoryData = discoverCategories.find((cat) => cat.id === selectedCategory);
        const params: Record<string, string | number> = {
          sort: sortBy,
        };

        if (search.trim()) params.search = search.trim();
        if (selectedCategory !== 'all' && selectedCategoryData) params.category = selectedCategoryData.label;
        if (locationFilter !== 'all') params.location = locationFilter;

        const targetRange = targetAmountRanges.find((r) => r.id === targetFilter) || targetAmountRanges[0];
        if (targetFilter !== 'all') {
          params.minGoal = targetRange.min;
          if (Number.isFinite(targetRange.max) && targetRange.max !== Infinity) {
            params.maxGoal = targetRange.max;
          }
        }

        const progressRange = progressRanges.find((r) => r.id === progressFilter) || progressRanges[0];
        if (progressFilter !== 'all' && progressRange.min > 0) {
          params.minProgress = progressRange.min;
        }

        if (selectedTagIds.length > 0) {
          params.tags = selectedTagIds.join(',');
        }

        const response = await api.get('/campaigns', { params });
        const results = response.data.campaigns || [];

        const normalized = results.map((c: any) => ({
          id: c._id,
          image: c.images?.[0] || 'https://via.placeholder.com/400x300?text=Campaign',
          category: c.category || 'General',
          categoryId: String(c.category || 'general').toLowerCase(),
          title: c.title || 'Untitled Campaign',
          description: c.description || '',
          location: c.location || 'Unknown',
          raised: c.raisedAmount ?? 0,
          goal: c.goalAmount ?? 0,
          percent: c.progress ?? Math.round(((c.raisedAmount ?? 0) / Math.max(1, c.goalAmount ?? 1)) * 100),
          author: c.fundraiser?.username || 'Organizer',
          authorAvatar: `https://i.pravatar.cc/150?u=${c.fundraiser?._id || c._id}`,
          daysLeft: c.daysLeft ?? 0,
          donors: c.donorCount ?? 0,
          createdAt: c.createdAt || new Date().toISOString(),
          urgent: c.urgent || false,
          tagIds: c.tags || [],
        }));

        setCampaigns(normalized);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load campaigns. Please try again.');
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [search, selectedCategory, locationFilter, targetFilter, progressFilter, selectedTagIds, sortBy, refreshKey]);

  let filtered = campaigns.filter((c) => {
    // Remove redundant search filtering since backend already handles it
    const matchLocation = locationFilter === 'all' || c.location === locationFilter;
    const targetRange = targetAmountRanges.find((r) => r.id === targetFilter) || targetAmountRanges[0];
    const matchTarget = c.goal >= targetRange.min && c.goal <= targetRange.max;
    const progressRange = progressRanges.find((r) => r.id === progressFilter) || progressRanges[0];
    const matchProgress = c.percent >= progressRange.min && c.percent < progressRange.max;
    const matchTag =
      selectedTagIds.length === 0 ||
      (c.tagIds && selectedTagIds.some((tid) => c.tagIds!.includes(tid)));
    return matchLocation && matchTarget && matchProgress && matchTag;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'popularity':
        return b.donors - a.donors;
      case 'most-funded':
        return b.raised - a.raised;
      default:
        return 0;
    }
  });

  const activeFiltersCount =
    (locationFilter !== 'all' ? 1 : 0) +
    (targetFilter !== 'all' ? 1 : 0) +
    (progressFilter !== 'all' ? 1 : 0) +
    selectedTagIds.length;

  return (
    <>
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-slate-50/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 md:px-8 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 sm:justify-between">
        <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 truncate">Discover</h2>
          <div className="relative max-w-md w-full hidden sm:block group flex-1 min-w-0">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
            <input
              type="text"
              placeholder="Search campaigns, causes, or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm placeholder-slate-400"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="p-2.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all relative">
            <i className="fa-regular fa-bell text-xl" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>

          <div className="relative flex items-center gap-2" ref={filtersRef}>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm ${
                activeFiltersCount > 0
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700'
              }`}
            >
              <i className="fa-solid fa-sliders" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {showFilters && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-50">
                <h4 className="font-semibold text-slate-900 mb-3">Filters</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Location</label>
                    <select
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      {discoverLocations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Target Amount</label>
                    <select
                      value={targetFilter}
                      onChange={(e) => setTargetFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      {targetAmountRanges.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Progress</label>
                    <select
                      value={progressFilter}
                      onChange={(e) => setProgressFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      {progressRanges.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {tagsContext && tagsContext.tags.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Tags</label>
                      <div className="flex flex-wrap gap-2">
                        {tagsContext.tags.map((tag) => {
                          const tagId = tag.id ?? tag._id ?? '';
                          return (
                            <label
                              key={tagId}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm cursor-pointer hover:border-emerald-500"
                            >
                              <input
                                type="checkbox"
                                checked={selectedTagIds.includes(tagId)}
                                onChange={(e) =>
                                  setSelectedTagIds((prev) =>
                                    e.target.checked ? [...prev, tagId] : prev.filter((id) => id !== tagId)
                                  )
                                }
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span>{tag.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setLocationFilter('all');
                      setTargetFilter('all');
                      setProgressFilter('all');
                      setSelectedTagIds([]);
                    }}
                    className="text-sm text-slate-500 hover:text-emerald-600 font-medium"
                  >
                    Clear filters
                  </button>
                </div>
              </div>
            )}

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none pl-4 pr-10 py-2 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="popularity">Most Popular</option>
                <option value="most-funded">Most Funded</option>
              </select>
              <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search Bar */}
      <div className="sm:hidden px-4 sm:px-6 md:px-8 py-4 bg-white border-b border-slate-200">
        <div className="relative max-w-md mx-auto">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search campaigns, causes, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-slate-400"
          />
        </div>
      </div>

      <LiveDonationMarquee />

      <main className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 pb-16 sm:pb-24 max-w-7xl mx-auto space-y-8 sm:space-y-12">
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
            <p className="text-slate-600 text-lg font-medium">Loading campaigns...</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-10 shadow-sm text-center">
            <p className="text-rose-700 text-lg font-semibold mb-3">{error}</p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setRefreshKey((key) => key + 1);
              }}
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* Featured Hero Section */}
        <section className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-xl group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/90 via-emerald-900/60 to-transparent z-10" />
          <img
            src="https://images.pexels.com/photos/3822906/pexels-photo-3822906.jpeg?auto=compress&cs=tinysrgb&w=1200"
            alt="Featured Cause"
            className="w-full h-[260px] sm:h-[320px] md:h-[400px] object-cover transform group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 z-20 flex flex-col justify-center px-4 sm:px-6 md:px-10 max-w-3xl py-6 sm:py-8">
            <span className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 text-emerald-100 text-[10px] sm:text-xs font-bold uppercase tracking-wider w-fit mb-3 sm:mb-4">
              <i className="fa-solid fa-bolt text-emerald-300" /> Trending Now
            </span>
            <h1 className="font-serif text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-4 leading-tight">
              Clean Water Initiative for Rural Communities
            </h1>
            <p className="text-emerald-50 text-xs sm:text-base md:text-lg mb-4 sm:mb-8 font-light leading-relaxed max-w-xl line-clamp-2 sm:line-clamp-none">
              Join over 5,000 donors helping to build sustainable water filtration systems in drought-affected regions. Every drop counts.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-4">
              <button type="button" className="w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2.5 sm:py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm sm:text-base font-semibold rounded-lg shadow-lg shadow-emerald-900/20 transition-all transform hover:-translate-y-0.5">
                Donate Now
              </button>
              <button type="button" className="w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2.5 sm:py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-sm sm:text-base font-medium rounded-lg border border-white/30 transition-all">
                Read Story
              </button>
            </div>
            <div className="mt-6 sm:mt-10 max-w-md">
              <div className="flex justify-between text-xs sm:text-sm text-emerald-100 mb-1.5 sm:mb-2 font-medium">
                <span>$84,230 raised</span>
                <span>84% of $100k</span>
              </div>
              <div className="h-1.5 sm:h-2 bg-emerald-900/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                <div className="h-full bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]" style={{ width: '84%' }} />
              </div>
            </div>
          </div>
        </section>

        {/* Categories Filter */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="font-serif text-xl font-bold text-slate-800">Browse by Category</h3>
            <a href="#" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              View All <i className="fa-solid fa-arrow-right text-xs" />
            </a>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {discoverCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-full shadow-sm transition-all font-medium ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-900 text-white shadow-md hover:scale-105'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-500 hover:text-emerald-700 hover:shadow-md'
                }`}
              >
                <i className={`fa-solid ${cat.icon}`} />
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Recommended for You */}
        <section>
          <h3 className="font-serif text-xl font-bold text-slate-800 mb-4">Recommended for You</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
            {sorted.slice(0, 3).map((c) => (
              <Link key={c.id} to={`/campaigns/${c.id}`} className="block">
                <article className="group bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-all h-full">
                  <div className="relative h-40 overflow-hidden">
                    <img src={c.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded">Recommended</span>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-slate-800 group-hover:text-emerald-700">{c.title}</h4>
                    <p className="text-sm text-slate-500 mt-1">${c.raised.toLocaleString()} raised · {c.percent}%</p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>

        {/* Campaign Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="text-slate-500 text-sm">{sorted.length} campaign{sorted.length !== 1 ? 's' : ''} found</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {sorted.map((campaign) => (
              <Link key={campaign.id} to={`/campaigns/${campaign.id}`}>
                <article
                  className="group bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all duration-300 flex flex-col h-full"
                >
                  <div className="relative aspect-[4/3] sm:aspect-[16/10] min-h-[160px] sm:min-h-[200px] overflow-hidden">
                    <img
                      src={campaign.image}
                      alt={campaign.title}
                      className="absolute inset-0 w-full h-full object-cover object-center transform group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                      <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/90 backdrop-blur-sm text-emerald-800 text-[10px] sm:text-xs font-bold uppercase tracking-wide rounded-md shadow-sm">
                        {campaign.category}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => e.preventDefault()}
                      className="absolute top-3 right-3 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 bg-black/20 hover:bg-red-500 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
                    >
                      <i className="fa-regular fa-heart text-xs sm:text-sm" />
                    </button>
                  </div>
                  <div className="p-4 sm:p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <i className="fa-solid fa-location-dot text-slate-400 text-xs" />
                      <span className="text-xs text-slate-500 font-medium">{campaign.location}</span>
                    </div>
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3 leading-snug group-hover:text-emerald-700 transition-colors">
                      {campaign.title}
                    </h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6 line-clamp-2">{campaign.description}</p>
                    <div className="mt-auto space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                          <span>${campaign.raised.toLocaleString()} raised</span>
                          <span className="text-emerald-600">{campaign.percent}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${campaign.percent}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <img src={campaign.authorAvatar} alt={campaign.author} className="w-8 h-8 rounded-full border border-slate-200" />
                          <span className="text-xs font-medium text-slate-600">By {campaign.author}</span>
                        </div>
                        <span
                          className={`text-xs font-medium flex items-center gap-1 ${campaign.urgent ? 'text-red-500' : 'text-slate-400'}`}
                        >
                          {campaign.urgent ? <i className="fa-solid fa-fire" /> : <i className="fa-regular fa-clock" />}
                          {campaign.daysLeft} days left
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
          {sorted.length === 0 && (
            <div className="text-center py-16">
              <i className="fa-solid fa-search text-6xl text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg">No campaigns found. Try adjusting your search or filters.</p>
              <button
                onClick={() => {
                  setLocationFilter('all');
                  setTargetFilter('all');
                  setProgressFilter('all');
                  setSelectedCategory('all');
                  setSearch('');
                }}
                className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
