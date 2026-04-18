import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCategories } from '../contexts/CategoriesContext';
import { useTags } from '../contexts/TagsContext';
import api from '../api/axios';

export function CreateCampaignPage() {
  const { activeCategories } = useCategories();
  const { tags } = useTags();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    goal: '',
    deadline: '',
  });

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // ✅ CLIENT-SIDE VALIDATION
    if (!formData.title.trim()) {
      setError('❌ Campaign Title is required');
      setLoading(false);
      return;
    }
    if (!formData.category.trim()) {
      setError('❌ Category is required');
      setLoading(false);
      return;
    }
    if (!formData.description.trim()) {
      setError('❌ Story/Description is required');
      setLoading(false);
      return;
    }
    if (!formData.goal || parseInt(formData.goal) < 100) {
      setError('❌ Goal Amount must be at least $100');
      setLoading(false);
      return;
    }
    if (!formData.deadline) {
      setError('❌ Campaign End Date is required');
      setLoading(false);
      return;
    }

    // ✅ DEBUG: Log all form data before submission
    console.log('📋 FORM DATA BEFORE SUBMISSION:', {
      title: formData.title,
      category: formData.category,
      description: formData.description,
      goal: formData.goal,
      deadline: formData.deadline,
      selectedTags: selectedTags,
      hasImage: !!coverImage,
    });

    const data = new FormData();

    // Text fields - match controller exactly
    data.append('title', formData.title.trim());
    data.append('category', formData.category.trim());
    data.append('description', formData.description.trim());
    data.append('goalAmount', formData.goal);
    data.append('endDate', formData.deadline);

    // Tags - send as comma-separated labels
    if (selectedTags.length > 0) {
      const tagsString = selectedTags.join(',');
      console.log('🚀 Sending tags:', tagsString);
      data.append('tags', tagsString);
    }

    // Image is OPTIONAL - only append if selected
    if (coverImage) {
      data.append('images', coverImage);
    }

    // ✅ DEBUG: Log FormData contents
    console.log('📤 FORMDATA BEING SENT:');
    for (let [key, value] of data.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: [File] ${value.name}`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }

    try {
      // ✅ Use axios which properly handles FormData with multipart/form-data
      // IMPORTANT: Do NOT set Content-Type header - let axios/browser handle it
      console.log('🚀 Sending request to /api/campaigns');
      
      const response = await api.post('/campaigns', data);

      console.log('📥 Server Response:', response.status, response.data);

      alert('Campaign created successfully! 🎉');
      navigate('/fundraiser/dashboard');
      
    } catch (err: any) {
      console.error('❌ Create campaign error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Something went wrong. Please check console and server logs.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 md:px-8 max-w-3xl mx-auto">
      <div className="mb-10">
        <Link to="/fundraiser/dashboard" className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-2 mb-4">
          <i className="fa-solid fa-arrow-left" /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Create a Campaign</h1>
        <p className="text-slate-500 mt-2">Tell your story and start raising funds</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          {error}
        </div>
      )}

      {/* ✅ DEBUG: Form State Display */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm">
        <h3 className="font-semibold text-blue-900 mb-2">Form Status:</h3>
        <div className="space-y-1 text-blue-800">
          <div className={formData.title.trim() ? '✅' : '❌'}>Title: {formData.title ? `"${formData.title}"` : '(empty)'}</div>
          <div className={formData.category.trim() ? '✅' : '❌'}>Category: {formData.category ? `"${formData.category}"` : '(empty)'}</div>
          <div className={formData.description.trim() ? '✅' : '❌'}>Description: {formData.description ? `${formData.description.length} chars` : '(empty)'}</div>
          <div className={formData.goal ? '✅' : '❌'}>Goal Amount: {formData.goal ? `$${formData.goal}` : '(empty)'}</div>
          <div className={formData.deadline ? '✅' : '❌'}>End Date: {formData.deadline || '(empty)'}</div>
          <div>Tags: {selectedTags.length > 0 ? selectedTags.join(', ') : '(none selected)'}</div>
          <div>Image: {coverImage ? `✅ ${coverImage.name}` : '(optional)'}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Campaign Details */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Campaign Details</h2>
          <div className="space-y-5">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">Campaign Title *</label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g. Help Leo get heart surgery"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
              <select
                id="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
              >
                <option value="">Select Category</option>
                {activeCategories.map((cat) => (
                  <option key={cat.id} value={cat.label}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <label key={tag.label} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:border-emerald-500 cursor-pointer transition-colors" style={{ backgroundColor: selectedTags.includes(tag.label) ? '#f0fdf4' : 'transparent' }}>
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag.label)}
                      onChange={(e) => {
                        const tagLabel = tag.label;
                        setSelectedTags((prev) =>
                          e.target.checked 
                            ? [...prev, tagLabel]
                            : prev.filter((t) => t !== tagLabel)
                        );
                        console.log('Tag toggled:', tagLabel, 'Checked:', e.target.checked);
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-700 font-medium">{tag.label}</span>
                  </label>
                ))}
              </div>
              {selectedTags.length > 0 && (
                <p className="text-xs text-emerald-600 mt-2">Selected: {selectedTags.join(', ')}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">Story *</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
                required
                placeholder="Share your story and explain why you need support..."
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all resize-none"
              />
            </div>

            <div>
              <label htmlFor="image" className="block text-sm font-medium text-slate-700 mb-2">Cover Image (Max 5MB)</label>
              <input
                type="file"
                id="image"
                name="images"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
              />
              {previewUrl && (
                <div className="mt-3">
                  <img src={previewUrl} alt="Preview" className="max-h-48 rounded-lg object-cover border" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Funding Goal */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Funding Goal</h2>
          <div className="space-y-5">
            <div>
              <label htmlFor="goal" className="block text-sm font-medium text-slate-700 mb-2">Goal Amount ($) *</label>
              <input
                type="number"
                id="goal"
                value={formData.goal}
                onChange={handleChange}
                min="100"
                required
                placeholder="15000"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
              />
            </div>
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-slate-700 mb-2">Campaign End Date *</label>
              <input
                type="date"
                id="deadline"
                value={formData.deadline}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 w-full sm:w-auto py-3.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Campaign...' : 'Create Campaign'}
          </button>
          <Link
            to="/fundraiser/dashboard"
            className="px-6 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}