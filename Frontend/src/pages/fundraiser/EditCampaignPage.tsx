import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useCategories } from '../../contexts/CategoriesContext';
import { useTags } from '../../contexts/TagsContext';
import api from '../../api/axios';

export function EditCampaignPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeCategories } = useCategories();
  const { tags } = useTags();
  
  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load campaign data on mount
  useEffect(() => {
    const loadCampaign = async () => {
      try {
        if (!id) {
          setError('Campaign ID not provided');
          return;
        }
        
        console.log('Loading campaign with ID:', id);
        const response = await api.get(`/campaigns/${id}`);
        const campaign = response.data.campaign;
        
        console.log('Loaded campaign:', campaign);
        setTitle(campaign.title || '');
        setCategory(campaign.category || '');
        setDescription(campaign.description || '');
        setSelectedTagIds(campaign.tags || []);
      } catch (err: any) {
        console.error('Failed to load campaign:', err);
        const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to load campaign details. Please try again.';
        setError(errorMsg);
      }
    };

    loadCampaign();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Campaign title is required');
      return;
    }

    if (!category) {
      setError('Please select a category');
      return;
    }

    if (!id) {
      setError('Campaign ID not found');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Updating campaign:', { id, title, category, description, tags: selectedTagIds });
      
      const response = await api.put(`/campaigns/${id}`, {
        title: title.trim(),
        category,
        description,
        tags: selectedTagIds,
      });

      console.log('Campaign updated successfully:', response.data);
      setSuccess('Campaign updated successfully!');
      
      // Redirect to my campaigns after 1.5 seconds
      setTimeout(() => {
        navigate('/fundraiser/my-campaigns');
      }, 1500);
    } catch (err: any) {
      console.error('Failed to update campaign:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to update campaign';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 md:px-8 max-w-3xl mx-auto">
      <Link to="/fundraiser/my-campaigns" className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-2 mb-6">
        <i className="fa-solid fa-arrow-left" /> Back to My Campaigns
      </Link>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Edit Campaign</h1>
      <p className="text-slate-500 mb-8">Update your campaign details</p>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Campaign Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">Select a category</option>
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <label key={tag.id} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:border-emerald-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTagIds.includes(tag.id)}
                      onChange={(e) =>
                        setSelectedTagIds((prev) =>
                          e.target.checked ? [...prev, tag.id] : prev.filter((id) => id !== tag.id)
                        )
                      }
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-700">{tag.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
            {success}
          </div>
        )}

        <div className="flex gap-4">
          <button 
            type="submit" 
            disabled={loading}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-semibold rounded-xl transition-colors"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <Link to="/fundraiser/my-campaigns" className="px-6 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
