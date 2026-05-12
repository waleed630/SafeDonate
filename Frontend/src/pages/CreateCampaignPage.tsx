import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCategories } from '../contexts/CategoriesContext';
import { useTags } from '../contexts/TagsContext';
import api from '../api/axios';

type VerifyApiResponse = {
  verified: boolean;
  verification_level: string;
  matched_record: null | {
    _id?: string;
    name?: string;
    registration_number?: string;
    registry_type?: string;
  };
  message?: string;
};

type SearchNgo = {
  _id?: string;
  name: string;
  registration_number?: string;
  registry_type?: string;
};

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

  const [campaignKind, setCampaignKind] = useState<'individual' | 'ngo'>('individual');
  const [organizationName, setOrganizationName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<SearchNgo[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyApiResponse | null>(null);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!searchWrapRef.current?.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (campaignKind !== 'ngo' || organizationName.trim().length < 2) {
      setSearchSuggestions([]);
      return;
    }

    const handle = window.setTimeout(async () => {
      try {
        const res = await api.get('/ngo/search', { params: { q: organizationName.trim() } });
        setSearchSuggestions(res.data?.results || []);
      } catch {
        setSearchSuggestions([]);
      }
    }, 280);

    return () => window.clearTimeout(handle);
  }, [organizationName, campaignKind]);

  useEffect(() => {
    if (campaignKind !== 'ngo') {
      setVerifyResult(null);
      setOrganizationName('');
      setRegistrationNumber('');
      setSearchSuggestions([]);
    }
  }, [campaignKind]);

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

  const handleCheckVerification = async () => {
    const name = organizationName.trim();
    if (!name) {
      setError('Enter an organization name before checking verification.');
      return;
    }
    setVerifyLoading(true);
    setError('');
    try {
      const res = await api.post('/ngo/verify', {
        organization_name: name,
        registration_number: registrationNumber.trim() || undefined,
      });
      setVerifyResult(res.data as VerifyApiResponse);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Verification check failed.';
      setError(msg);
      setVerifyResult(null);
    } finally {
      setVerifyLoading(false);
    }
  };

  const pickSuggestion = (row: SearchNgo) => {
    setOrganizationName(row.name);
    if (row.registration_number) setRegistrationNumber(row.registration_number);
    setShowSuggestions(false);
    setVerifyResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.title.trim()) {
      setError('Campaign Title is required');
      setLoading(false);
      return;
    }
    if (!formData.category.trim()) {
      setError('Category is required');
      setLoading(false);
      return;
    }
    if (!formData.description.trim()) {
      setError('Story/Description is required');
      setLoading(false);
      return;
    }
    if (!formData.goal || parseInt(formData.goal, 10) < 100) {
      setError('Goal Amount must be at least $100');
      setLoading(false);
      return;
    }
    if (!formData.deadline) {
      setError('Campaign End Date is required');
      setLoading(false);
      return;
    }
    if (campaignKind === 'ngo' && !organizationName.trim()) {
      setError('Organization name is required for NGO/Organization campaigns.');
      setLoading(false);
      return;
    }

    const data = new FormData();

    data.append('title', formData.title.trim());
    data.append('category', formData.category.trim());
    data.append('description', formData.description.trim());
    data.append('goalAmount', formData.goal);
    data.append('endDate', formData.deadline);
    data.append('campaign_type', campaignKind === 'ngo' ? 'ngo' : 'individual');
    if (campaignKind === 'ngo') {
      data.append('organization_name', organizationName.trim());
      data.append('organization_registration_number', registrationNumber.trim());
    }

    if (selectedTags.length > 0) {
      data.append('tags', selectedTags.join(','));
    }

    if (coverImage) {
      data.append('images', coverImage);
    }

    try {
      await api.post('/campaigns', data);
      alert('Campaign created successfully!');
      navigate('/fundraiser/dashboard');
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Something went wrong.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderVerificationPreview = () => {
    if (!verifyResult) return null;

    if (verifyResult.verified && verifyResult.verification_level === 'government') {
      const reg = verifyResult.matched_record?.registry_type || 'authority';
      return (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          <p className="font-semibold flex items-center gap-2">
            <span className="text-emerald-600 text-lg">✓</span>
            Verified NGO — Registered with {reg}
          </p>
          <p className="text-sm mt-2 text-emerald-800/90">{verifyResult.message}</p>
        </div>
      );
    }

    if (!verifyResult.verified && verifyResult.matched_record) {
      return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <p className="font-semibold flex items-center gap-2">
            <span className="text-amber-600 text-lg">⚠</span>
            Pending Verification — Admin will review your credentials
          </p>
          <p className="text-sm mt-2 text-amber-900/90">{verifyResult.message}</p>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-950">
        <p className="font-semibold flex items-center gap-2">
          <span className="text-rose-600 text-lg">✗</span>
          Not Found in Registry — You can still submit but donors will see this status
        </p>
        <p className="text-sm mt-2 text-rose-900/90">{verifyResult.message}</p>
      </div>
    );
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

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Campaign Details</h2>
          <div className="space-y-5">
            <div>
              <span className="block text-sm font-medium text-slate-700 mb-2">Campaign type *</span>
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="campaignKind"
                    checked={campaignKind === 'individual'}
                    onChange={() => setCampaignKind('individual')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-700">Individual / Personal cause</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="campaignKind"
                    checked={campaignKind === 'ngo'}
                    onChange={() => setCampaignKind('ngo')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-700">NGO / Organization</span>
                </label>
              </div>
            </div>

            {campaignKind === 'ngo' && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 space-y-4">
                <h3 className="font-semibold text-slate-800">Organization &amp; registry check</h3>
                <div ref={searchWrapRef} className="relative">
                  <label htmlFor="organizationName" className="block text-sm font-medium text-slate-700 mb-2">
                    Organization name *
                  </label>
                  <input
                    type="text"
                    id="organizationName"
                    value={organizationName}
                    onChange={(e) => {
                      setOrganizationName(e.target.value);
                      setShowSuggestions(true);
                      setVerifyResult(null);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    autoComplete="off"
                    placeholder="Start typing e.g. Edhi Foundation"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                  />
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <ul className="absolute z-20 mt-1 w-full max-h-52 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                      {searchSuggestions.map((row) => (
                        <li key={row._id || row.name}>
                          <button
                            type="button"
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 text-slate-800 border-b border-slate-50 last:border-0"
                            onClick={() => pickSuggestion(row)}
                          >
                            <span className="font-medium">{row.name}</span>
                            {row.registry_type && (
                              <span className="block text-xs text-slate-500">{row.registry_type}</span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <label htmlFor="registrationNumber" className="block text-sm font-medium text-slate-700 mb-2">
                    Registration number (optional)
                  </label>
                  <input
                    type="text"
                    id="registrationNumber"
                    value={registrationNumber}
                    onChange={(e) => {
                      setRegistrationNumber(e.target.value);
                      setVerifyResult(null);
                    }}
                    placeholder="e.g. SECP-CUIN-0038921"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCheckVerification}
                  disabled={verifyLoading}
                  className="px-5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-60 transition-colors"
                >
                  {verifyLoading ? 'Checking…' : 'Check Verification'}
                </button>

                <div className="pt-1">{renderVerificationPreview()}</div>
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
                Campaign Title *
              </label>
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
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
              >
                <option value="">Select Category</option>
                {activeCategories.map((cat) => (
                  <option key={cat.id} value={cat.label}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <label
                    key={tag.label}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:border-emerald-500 cursor-pointer transition-colors"
                    style={{ backgroundColor: selectedTags.includes(tag.label) ? '#f0fdf4' : 'transparent' }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag.label)}
                      onChange={(e) => {
                        const tagLabel = tag.label;
                        setSelectedTags((prev) =>
                          e.target.checked ? [...prev, tagLabel] : prev.filter((t) => t !== tagLabel),
                        );
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
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                Story *
              </label>
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
              <label htmlFor="image" className="block text-sm font-medium text-slate-700 mb-2">
                Cover Image (Max 5MB)
              </label>
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

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Funding Goal</h2>
          <div className="space-y-5">
            <div>
              <label htmlFor="goal" className="block text-sm font-medium text-slate-700 mb-2">
                Goal Amount ($) *
              </label>
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
              <label htmlFor="deadline" className="block text-sm font-medium text-slate-700 mb-2">
                Campaign End Date *
              </label>
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
            className="px-6 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
