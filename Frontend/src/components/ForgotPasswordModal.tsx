import { useState } from 'react';
import api from '../api/axios';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email.trim()) {
        setError('Please enter your email address');
        setIsLoading(false);
        return;
      }

      const response = await api.post('/auth/forgot-password', { email });

      if (response.data.success) {
        console.log('✅ Password reset link sent to:', email);
        
        // In development, show the reset URL if available
        if (response.data.devResetUrl) {
          console.log('🔗 [DEV] Reset URL:', response.data.devResetUrl);
          setDevResetUrl(response.data.devResetUrl);
        }
        
        setIsSubmitted(true);
        // Auto-close after 5 seconds
        setTimeout(() => {
          handleClose();
        }, 5000);
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to send reset link. Please try again.';
      console.error('Forgot password error:', errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setIsSubmitted(false);
    setDevResetUrl('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Reset Password</h2>
          <p className="text-sm text-slate-500 mt-1">
            {isSubmitted
              ? 'Check your email for reset instructions'
              : 'Enter your email to receive a password reset link'}
          </p>
        </div>

        <div className="p-6">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="input-group relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="fa-regular fa-paper-plane"></i>
                    Send Reset Link
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100">
                  <i className="fa-solid fa-check text-2xl text-emerald-600"></i>
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-slate-700 font-medium">Check your email!</p>
                <p className="text-sm text-slate-500">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="text-xs text-slate-400 mt-3">
                  The link expires in 15 minutes. Please remember to check your spam folder if you don't see it.
                </p>
              </div>

              {/* Development Mode: Show Reset Link */}
              {devResetUrl && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-medium text-blue-700 mb-2">🔧 Development Mode</p>
                  <p className="text-xs text-blue-600 mb-2">
                    Can't receive email? Click the link below to test password reset:
                  </p>
                  <a
                    href={devResetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition-colors"
                  >
                    Reset Password (Dev Link)
                  </a>
                </div>
              )}

              <button
                onClick={handleClose}
                className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
