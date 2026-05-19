import { useState } from 'react';
import { useCategories } from '../../contexts/CategoriesContext';
import type { CategoryItem } from '../../contexts/CategoriesContext';

const ICON_OPTIONS = [
  'fa-heart-pulse',
  'fa-graduation-cap',
  'fa-paw',
  'fa-house-chimney-crack',
  'fa-palette',
  'fa-leaf',
  'fa-book-open',
  'fa-hand-holding-heart',
  'fa-globe',
];
const BADGE_OPTIONS = [
  'text-emerald-700',
  'text-blue-700',
  'text-amber-700',
  'text-rose-700',
  'text-purple-700',
  'text-teal-700',
];

export function ManageCategoriesPage() {
  const { categories, addCategory, updateCategory, activate, deactivate, loading, error } = useCategories();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [form, setForm] = useState({ label: '', slug: '', icon: 'fa-leaf', badge: 'text-teal-700' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearMessages = () => {
    setFormError(null);
    setSuccessMessage(null);
  };

  const handleAdd = async () => {
    if (!form.label.trim()) {
      setFormError('Label is required');
      return;
    }
    try {
      setFormLoading(true);
      clearMessages();
      await addCategory({
        label: form.label.trim(),
        slug: form.slug.trim(),
        icon: form.icon,
        badge: form.badge,
      });
      setForm({ label: '', slug: '', icon: 'fa-leaf', badge: 'text-teal-700' });
      setShowAdd(false);
      setSuccessMessage('Category added successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to add category');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editing || !form.label.trim()) {
      setFormError('Label is required');
      return;
    }
    const editId = editing._id ?? editing.id;
    if (!editId) {
      setFormError('Missing category id');
      return;
    }
    try {
      setFormLoading(true);
      clearMessages();
      await updateCategory(String(editId), {
        label: form.label,
        slug: form.slug,
        icon: form.icon,
        badge: form.badge,
      });
      setEditing(null);
      setSuccessMessage('Category updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update category');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeactivate = async (cat: CategoryItem) => {
    try {
      await deactivate(String(cat._id ?? cat.id));
      setSuccessMessage('Category deactivated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to deactivate category');
    }
  };

  const handleActivate = async (cat: CategoryItem) => {
    try {
      await activate(String(cat._id ?? cat.id));
      setSuccessMessage('Category activated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to activate category');
    }
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Campaign Categories</h1>
      <p className="text-slate-500 mb-8">Create and manage categories for campaigns</p>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
          {successMessage}
        </div>
      )}

      <div className="flex justify-end mb-6">
        <button
          type="button"
          onClick={() => {
            setShowAdd(true);
            clearMessages();
          }}
          disabled={loading}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fa-solid fa-plus mr-2" /> Add Category
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            <i className="fa-solid fa-spinner fa-spin mr-2" /> Loading categories...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Label</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Slug</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.sort((a, b) => a.order - b.order).map((c) => (
                  <tr key={c._id || c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="px-4 py-4">
                      <span className={`${c.badge} font-medium`}>
                        <i className={`fa-solid ${c.icon} mr-2`} />
                        {c.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono text-sm text-slate-600">{c.slug}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {c.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(c);
                          setForm({ label: c.label, slug: c.slug, icon: c.icon, badge: c.badge });
                          clearMessages();
                        }}
                        className="text-emerald-600 hover:text-emerald-700 text-sm font-medium mr-3"
                      >
                        Edit
                      </button>
                      {c.active ? (
                        <button
                          type="button"
                          onClick={() => handleDeactivate(c)}
                          className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleActivate(c)}
                          className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Category</h3>
            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
                {formError}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Label</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, label: e.target.value }));
                    setFormError(null);
                  }}
                  placeholder="e.g. Medical"
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, slug: e.target.value }));
                    setFormError(null);
                  }}
                  placeholder="e.g. medical"
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Icon (Font Awesome class)</label>
                <select
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {ICON_OPTIONS.map((ico) => (
                    <option key={ico} value={ico}>{ico}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Badge color class</label>
                <select
                  value={form.badge}
                  onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {BADGE_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowAdd(false);
                  setForm({ label: '', slug: '', icon: 'fa-leaf', badge: 'text-teal-700' });
                  clearMessages();
                }}
                disabled={formLoading}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={formLoading}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formLoading ? <i className="fa-solid fa-spinner fa-spin mr-2" /> : null}
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Edit Category</h3>
            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
                {formError}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Label</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, label: e.target.value }));
                    setFormError(null);
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, slug: e.target.value }));
                    setFormError(null);
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Icon</label>
                <select
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {ICON_OPTIONS.map((ico) => (
                    <option key={ico} value={ico}>{ico}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Badge color</label>
                <select
                  value={form.badge}
                  onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {BADGE_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  clearMessages();
                }}
                disabled={formLoading}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={formLoading}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formLoading ? <i className="fa-solid fa-spinner fa-spin mr-2" /> : null}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
