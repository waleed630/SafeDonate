import { Link } from 'react-router-dom';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId?: string;
}

export function LoginRequiredModal({ isOpen, onClose, campaignId }: LoginRequiredModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-amber-100 rounded-full mb-4">
          <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h3 className="text-lg font-semibold text-slate-900 text-center mb-2">Login Required</h3>
        <p className="text-slate-600 text-center mb-6">
          Please log in to your account as a Donor to make a donation to this campaign.
        </p>
        
        <div className="space-y-3">
          <Link
            to={`/login?redirect=${campaignId ? `/campaigns/${campaignId}` : '/campaigns/featured'}`}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors text-center block"
          >
            Log In
          </Link>
          
          <button
            onClick={onClose}
            className="w-full py-3 border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>

        <p className="text-sm text-slate-500 text-center mt-4">
          Don't have an account? {' '}
          <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-semibold">
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}
