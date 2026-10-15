import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import type { UserRole } from '../types';

const DEMO_OPTIONS: { role: UserRole; label: string; icon: string; dest: string }[] = [
  { role: 'admin', label: 'Admin', icon: 'fa-user-shield', dest: '/admin/dashboard' },
  { role: 'fundraiser', label: 'Fundraiser', icon: 'fa-hand-holding-heart', dest: '/fundraiser/dashboard' },
  { role: 'donor', label: 'Donor', icon: 'fa-heart', dest: '/donor/dashboard' },
];

/** One-click demo accounts for portfolio visitors. Hidden unless the API has DEMO_MODE=true. */
export function DemoAccess() {
  const [enabled, setEnabled] = useState(false);
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);
  const { demoLogin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    api
      .get('/auth/demo')
      .then((res) => setEnabled(Boolean(res.data?.enabled)))
      .catch(() => setEnabled(false));
  }, []);

  if (!enabled) return null;

  const handleClick = async (role: UserRole, dest: string) => {
    setLoadingRole(role);
    try {
      await demoLogin(role);
      toast({
        title: 'Welcome to the demo',
        description: `You're signed in as the demo ${role}. Sample data resets daily.`,
        variant: 'success',
      });
      navigate(dest, { replace: true });
    } catch (err: any) {
      toast({
        title: 'Demo unavailable',
        description: err?.response?.data?.message || 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
      <p className="text-sm font-semibold text-emerald-900">
        <i className="fa-solid fa-wand-magic-sparkles mr-2" />
        Just looking around? Try the live demo
      </p>
      <p className="text-xs text-emerald-800/80 mt-1 mb-3">
        No sign-up needed. Explore every dashboard; actions that would delete data are turned off.
      </p>
      <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-2">
        {DEMO_OPTIONS.map(({ role, label, icon, dest }) => (
          <button
            key={role}
            type="button"
            disabled={loadingRole !== null}
            onClick={() => handleClick(role, dest)}
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white border border-emerald-200 text-sm font-medium text-emerald-800 hover:bg-emerald-100 transition-colors disabled:opacity-60"
          >
            <i className={`fa-solid ${loadingRole === role ? 'fa-spinner fa-spin' : icon}`} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
