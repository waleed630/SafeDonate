import { useState } from 'react';
import { useTags } from '../../contexts/TagsContext';
import type { TagItem } from '../../contexts/TagsContext';

export function ManageTagsPage() {
  const { tags, loading, error: contextError, addTag, updateTag, removeTag } = useTags();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<TagItem | null>(null);
  const [form, setForm] = useState({ label: '', slug: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAdd = async () => {
    if (!form.label.trim()) {
      setError('Label is required');
      return;
    }
    try {
      setIsSubmitting(true);
      setError('');
      const slug = form.slug.trim() || form.label.trim().toLowerCase().replace(/\s+/g, '-');
      await addTag({ label: form.label.trim(), slug });
      setForm({ label: '', slug: '' });
      setShowAdd(false);
      setSuccess('Tag added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to add tag');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    if (!form.label.trim()) {
      setError('Label is required');
      return;
    }
    try {
      setIsSubmitting(true);
      setError('');
      const slug = form.slug.trim() || form.label.trim().toLowerCase().replace(/\s+/g, '-');
      await updateTag(editing._id || editing.id || '', {
        label: form.label.trim(),
        slug,
      });
      setEditing(null);
      setSuccess('Tag updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update tag');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;
    try {
      setError('');
      await removeTag(id);
      setSuccess('Tag deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete tag');
    }
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Campaign Tags</h1>
      <p className="text-slate-500 mb-8">Create and manage tags for filtering and organizing campaigns</p>

      {/* Error and Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm">
          {success}
        </div>
      )}
      {contextError && !error && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm">
          {contextError}
        </div>
      )}

      <div className="flex justify-end mb-6">
        <button
          type="button"
          onClick={() => {
            setShowAdd(true);
            setError('');
          }}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
        >
          <i className="fa-solid fa-plus mr-2" /> Add Tag
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">
          <div className="inline-block">
            <div className="animate-spin">
              <i className="fa-solid fa-spinner text-4xl text-emerald-600" />
            </div>
          </div>
          <p className="mt-4">Loading tags...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Label</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Slug</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((t) => (
                  <tr key={t._id || t.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="px-4 py-4 font-medium text-slate-800">{t.label}</td>
                    <td className="px-4 py-4 font-mono text-sm text-slate-600">{t.slug}</td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(t);
                          setForm({ label: t.label, slug: t.slug });
                          setError('');
                        }}
                        className="text-emerald-600 hover:text-emerald-700 text-sm font-medium mr-3"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(t._id || t.id || '')}
                        className="text-rose-600 hover:text-rose-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {tags.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <i className="fa-solid fa-inbox text-4xl mb-3 opacity-50" />
              <p>No tags found. Create one to get started!</p>
            </div>
          )}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Tag</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Label</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. Urgent"
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Slug (optional)</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="urgent"
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowAdd(false);
                  setForm({ label: '', slug: '' });
                  setError('');
                }}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Edit Tag</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Label</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setError('');
                }}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
