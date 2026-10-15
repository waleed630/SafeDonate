import { useAuth } from '../contexts/AuthContext';

/** Slim notice shown while a visitor is using one of the shared demo accounts */
export function DemoBanner() {
  const { user } = useAuth();
  if (!user?.isDemo) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs sm:text-sm text-amber-900 text-center">
      <i className="fa-solid fa-flask mr-2" />
      You're exploring the <span className="font-semibold">demo {user.role}</span> account. Sample data resets daily,
      and actions that delete data or send email are disabled.
    </div>
  );
}
