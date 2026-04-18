import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import api from '../api/axios';

export interface TagItem {
  _id?: string;
  id?: string;
  label: string;
  slug: string;
  description?: string;
}

const defaultTags: TagItem[] = [
  { id: '1', label: 'Urgent', slug: 'urgent' },
  { id: '2', label: 'Verified', slug: 'verified' },
  { id: '3', label: 'Featured', slug: 'featured' },
];

type TagsContextValue = {
  tags: TagItem[];
  loading: boolean;
  error: string | null;
  addTag: (item: Omit<TagItem, 'id' | '_id'>) => Promise<void>;
  updateTag: (id: string, updates: Partial<TagItem>) => Promise<void>;
  removeTag: (id: string) => Promise<void>;
  fetchTags: () => Promise<void>;
};

const TagsContext = createContext<TagsContextValue | null>(null);

export function TagsProvider({ children }: { children: ReactNode }) {
  const [tags, setTags] = useState<TagItem[]>(defaultTags);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/tags');
      const fetchedTags = (response.data.tags || []).map((tag: any) => ({
        id: tag._id,
        _id: tag._id,
        label: tag.label,
        slug: tag.slug,
        description: tag.description,
      }));
      setTags(fetchedTags.length > 0 ? fetchedTags : defaultTags);
    } catch (err: any) {
      console.error('Error fetching tags:', err);
      setError(err.response?.data?.message || 'Failed to load tags');
      setTags(defaultTags);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch tags on mount
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const addTag = useCallback(
    async (item: Omit<TagItem, 'id' | '_id'>) => {
      try {
        const response = await api.post('/tags', {
          label: item.label,
          slug: item.slug,
          description: item.description,
        });
        const newTag = response.data.tag;
        setTags((prev) => [
          ...prev,
          {
            id: newTag._id,
            _id: newTag._id,
            label: newTag.label,
            slug: newTag.slug,
            description: newTag.description,
          },
        ]);
      } catch (err: any) {
        throw new Error(err.response?.data?.message || 'Failed to create tag');
      }
    },
    []
  );

  const updateTag = useCallback(async (id: string, updates: Partial<TagItem>) => {
    try {
      const response = await api.put(`/tags/${id}`, {
        label: updates.label,
        slug: updates.slug,
        description: updates.description,
      });
      const updatedTag = response.data.tag;
      setTags((prev) =>
        prev.map((t) =>
          (t.id === id || t._id === id)
            ? {
                id: updatedTag._id,
                _id: updatedTag._id,
                label: updatedTag.label,
                slug: updatedTag.slug,
                description: updatedTag.description,
              }
            : t
        )
      );
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update tag');
    }
  }, []);

  const removeTag = useCallback(async (id: string) => {
    try {
      await api.delete(`/tags/${id}`);
      setTags((prev) => prev.filter((t) => t.id !== id && t._id !== id));
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to delete tag');
    }
  }, []);

  const value = useMemo(
    () => ({ tags, loading, error, addTag, updateTag, removeTag, fetchTags }),
    [tags, loading, error, addTag, updateTag, removeTag, fetchTags]
  );

  return (
    <TagsContext.Provider value={value}>
      {children}
    </TagsContext.Provider>
  );
}

export function useTags() {
  const ctx = useContext(TagsContext);
  if (!ctx) throw new Error('useTags must be used within TagsProvider');
  return ctx;
}

export function useTagsOptional() {
  return useContext(TagsContext);
}
