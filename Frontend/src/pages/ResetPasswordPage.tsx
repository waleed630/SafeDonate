import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!password.trim()) {
      setError('Please enter a new password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post(`/auth/reset-password/${token}`, {
        password,
      });

      if (response.data.success) {
        console.log('✅ Password reset successfully');
        setSuccess(true);

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to reset password. The link may have expired.';
      console.error('Reset password error:', errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <i className="fa-solid fa-exclamation-circle text-2xl text-red-600"></i>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Invalid Reset Link</h2>
          <p className="text-sm text-slate-600 mb-6">
            The password reset link appears to be invalid or expired.
          </p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
            <i className="fa-solid fa-check text-2xl text-emerald-600"></i>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Password Reset Successfully!</h2>
          <p className="text-sm text-slate-600 mb-6">
            Your password has been reset. Redirecting to login...
          </p>
          <div className="flex items-center justify-center gap-1 mb-4">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">Reset Your Password</h2>
          <p className="text-sm text-slate-600">
            Enter your new password below. This link will expire in 15 minutes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3 text-slate-400 hover:text-slate-600"
              >
                <i className={showPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'}></i>
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Minimum 6 characters
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              disabled={isLoading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 mt-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Resetting...
              </>
            ) : (
              <>
                <i className="fa-solid fa-key"></i>
                Reset Password
              </>
            )}
          </button>

          {/* Back to Login */}
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
          >
            Back to Login
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-6">
          Lost your reset email? 
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="text-emerald-600 hover:underline ml-1"
          >
            Try again
          </button>
        </p>
      </div>
    </div>
  );
}
