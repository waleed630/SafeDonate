import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function SessionExpiredModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { dismissSessionExpired } = useAuth();

  useEffect(() => {
    // Listen for session expired events
    const handleSessionExpired = () => {
      setIsOpen(true);
    };

    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    dismissSessionExpired();
  };

  const handleLoginRedirect = () => {
    window.location.href = '/login';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-amber-100 rounded-full mb-4">
          <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 text-center mb-2">Session Issue</h3>
        <p className="text-slate-600 text-center mb-6">
          We couldn't refresh your session automatically. Please try logging in again to continue.
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={handleLoginRedirect}
            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
