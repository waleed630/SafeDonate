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

export interface CategoryItem {
  _id?: string;
  id?: string;
  label: string;
  slug: string;
  icon: string;
  badge: string;
  hover?: string;
  active: boolean;
  order: number;
}

const defaultCategories: CategoryItem[] = [
  { id: '1', label: 'Medical', slug: 'medical', icon: 'fa-heart-pulse', badge: 'text-rose-700', active: true, order: 0 },
  { id: '2', label: 'Education', slug: 'education', icon: 'fa-graduation-cap', badge: 'text-blue-700', active: true, order: 1 },
  { id: '3', label: 'Animals', slug: 'animals', icon: 'fa-paw', badge: 'text-amber-700', active: true, order: 2 },
  { id: '4', label: 'Disaster', slug: 'disaster', icon: 'fa-house-chimney-crack', badge: 'text-rose-700', active: false, order: 3 },
  { id: '5', label: 'Creative', slug: 'creative', icon: 'fa-palette', badge: 'text-purple-700', active: true, order: 4 },
  { id: '6', label: 'Environment', slug: 'environment', icon: 'fa-leaf', badge: 'text-teal-700', active: false, order: 5 },
];

type CategoriesContextValue = {
  categories: CategoryItem[];
  activeCategories: CategoryItem[];
  loading: boolean;
  error: string | null;
  addCategory: (item: Omit<CategoryItem, 'order' | 'active' | 'id' | '_id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<CategoryItem>) => Promise<void>;
  setOrder: (id: string, newOrder: number) => Promise<void>;
  deactivate: (id: string) => Promise<void>;
  activate: (id: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
};

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<CategoryItem[]>(defaultCategories);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/categories');
      const fetchedCategories = (response.data.categories || []).map((cat: any) => ({
        id: cat._id,
        _id: cat._id,
        label: cat.label,
        slug: cat.slug,
        icon: cat.icon,
        badge: cat.badge,
        active: cat.active !== false,
        order: cat.order ?? 0,
      }));
      setCategories(fetchedCategories.length > 0 ? fetchedCategories : defaultCategories);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err.response?.data?.message || 'Failed to load categories');
      setCategories(defaultCategories);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const activeCategories = useMemo(
    () => categories.filter((c) => c.active).sort((a, b) => a.order - b.order),
    [categories]
  );

  const addCategory = useCallback(
    async (item: Omit<CategoryItem, 'order' | 'active' | 'id' | '_id'>) => {
      try {
        const response = await api.post('/categories', {
          label: item.label,
          slug: item.slug,
          icon: item.icon,
          badge: item.badge,
        });
        const newCat = response.data.category;
        setCategories((prev) => [
          ...prev,
          {
            id: newCat._id,
            _id: newCat._id,
            label: newCat.label,
            slug: newCat.slug,
            icon: newCat.icon,
            badge: newCat.badge,
            active: newCat.active,
            order: newCat.order,
          },
        ]);
      } catch (err: any) {
        throw new Error(err.response?.data?.message || 'Failed to create category');
      }
    },
    []
  );

  const updateCategory = useCallback(async (id: string, updates: Partial<CategoryItem>) => {
    try {
      const response = await api.put(`/categories/${id}`, {
        label: updates.label,
        slug: updates.slug,
        icon: updates.icon,
        badge: updates.badge,
        active: updates.active,
        order: updates.order,
      });
      const updatedCat = response.data.category;
      setCategories((prev) =>
        prev.map((c) =>
          (c.id === id || c._id === id)
            ? {
                id: updatedCat._id,
                _id: updatedCat._id,
                label: updatedCat.label,
                slug: updatedCat.slug,
                icon: updatedCat.icon,
                badge: updatedCat.badge,
                active: updatedCat.active,
                order: updatedCat.order,
              }
            : c
        )
      );
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to update category');
    }
  }, []);

  const setOrder = useCallback(async (id: string, newOrder: number) => {
    try {
      await updateCategory(id, { order: newOrder });
    } catch (err: any) {
      throw new Error(err.message || 'Failed to set order');
    }
  }, [updateCategory]);

  const deactivate = useCallback(async (id: string) => {
    try {
      const response = await api.post(`/categories/${id}/toggle-status`);
      const updatedCat = response.data.category;
      setCategories((prev) =>
        prev.map((c) =>
          (c.id === id || c._id === id)
            ? {
                id: updatedCat._id,
                _id: updatedCat._id,
                label: updatedCat.label,
                slug: updatedCat.slug,
                icon: updatedCat.icon,
                badge: updatedCat.badge,
                active: updatedCat.active,
                order: updatedCat.order,
              }
            : c
        )
      );
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to deactivate category');
    }
  }, []);

  const activate = useCallback(async (id: string) => {
    try {
      const response = await api.post(`/categories/${id}/toggle-status`);
      const updatedCat = response.data.category;
      setCategories((prev) =>
        prev.map((c) =>
          (c.id === id || c._id === id)
            ? {
                id: updatedCat._id,
                _id: updatedCat._id,
                label: updatedCat.label,
                slug: updatedCat.slug,
                icon: updatedCat.icon,
                badge: updatedCat.badge,
                active: updatedCat.active,
                order: updatedCat.order,
              }
            : c
        )
      );
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Failed to activate category');
    }
  }, []);

  const value = useMemo(
    () => ({
      categories,
      activeCategories,
      loading,
      error,
      addCategory,
      updateCategory,
      setOrder,
      deactivate,
      activate,
      fetchCategories,
    }),
    [categories, activeCategories, loading, error, addCategory, updateCategory, setOrder, deactivate, activate, fetchCategories]
  );

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error('useCategories must be used within CategoriesProvider');
  return ctx;
}

export function useCategoriesOptional() {
  return useContext(CategoriesContext);
}
