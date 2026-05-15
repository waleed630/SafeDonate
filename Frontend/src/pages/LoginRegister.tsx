import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import type { UserRole } from '../types';

const BACKEND_URL = 'http://localhost:5000';

type AuthTab = 'login' | 'register';
type Role = UserRole;

export function LoginRegister() {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [role, setRole] = useState<Role>('donor');
  const [showPassword, setShowPassword] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState('');
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const { login, register, setUser } = useAuth() as any;
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const refresh = params.get('refresh');
    const userRole = params.get('role');

    if (token && refresh) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const decoded = JSON.parse(atob(tokenParts[1]));
          const user = {
            id: decoded.id || decoded.userId,
            email: decoded.email,
            name: decoded.username || decoded.name || '',
            role: userRole || decoded.role || 'donor',
            avatar: undefined,
          };

          localStorage.setItem('safedonate_token', token);
          localStorage.setItem('safedonate_refresh_token', refresh);
          localStorage.setItem('safedonate_user', JSON.stringify(user));
          setUser(user);

          // Fetch full user data including profilePicture
          fetch('http://localhost:5000/api/auth/me', {
            credentials: 'include',
          })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data?.user?.profilePicture) {
                const fullUser = {
                  ...user,
                  avatar: data.user.profilePicture,
                };
                localStorage.setItem('safedonate_user', JSON.stringify(fullUser));
                setUser(fullUser);
              }
            })
            .catch(err => console.debug('Profile picture fetch failed:', err));

          toast({
            title: '✨ Welcome!',
            description: `Signed in successfully as a ${user.role}.`,
            variant: 'success',
          });

          const dest = user.role === 'fundraiser' ? '/fundraiser/dashboard' : '/donor/dashboard';
          window.history.replaceState({}, document.title, window.location.pathname);
          navigate(dest, { replace: true });
        }
      } catch (error) {
        console.error('Failed to process OAuth callback:', error);
      }
    }
  }, [navigate, setUser, toast]);

  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth endpoint with selected role
    window.location.href = `${BACKEND_URL}/api/auth/google?role=${role}`;
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Panel: Visual/Brand */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden bg-emerald-900">
        <img
          src="https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt="Community collaboration"
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-900 via-emerald-900/40 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-16 text-white z-10">
          <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/50 border border-emerald-600/50 backdrop-blur-sm text-emerald-200 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Over $50M Raised This Year
            </div>
            <h2 className="text-5xl font-serif font-bold leading-tight mb-6">
              Empower dreams,
              <br />
              <span className="text-emerald-300 italic">one donation</span> at a time.
            </h2>
            <p className="text-lg text-emerald-100/90 max-w-md leading-relaxed">
              Join a community of 2 million+ changemakers. Whether you&apos;re funding a medical emergency or launching the next big idea, SafeDonate is your trusted partner.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-start gap-4">
              <img src="https://i.pravatar.cc/150?u=44" alt="User" className="w-12 h-12 rounded-full border-2 border-emerald-400" />
              <div>
                <div className="flex text-amber-400 text-xs mb-1">
                  {[...Array(5)].map((_, i) => (
                    <i key={i} className="fa-solid fa-star" />
                  ))}
                </div>
                <p className="text-sm italic text-white mb-2">
                  &quot;The transparency of this platform gave me the confidence to donate. Seeing the direct impact of my contribution was incredible.&quot;
                </p>
                <p className="text-xs font-bold text-emerald-300">Sarah Jenkins, Top Donor</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Auth Forms */}
      <div className="w-full lg:w-1/2 flex flex-col relative overflow-y-auto custom-scrollbar bg-[#FDFBF7]">
        <div className="lg:hidden p-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-800">
            <i className="fa-solid fa-circle-nodes text-2xl" />
            <span className="font-bold text-xl">SafeDonate</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 py-12 max-w-2xl mx-auto w-full">
          <div className="mb-10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-serif font-bold text-slate-900">
                {activeTab === 'login' ? 'Welcome back' : 'Create account'}
              </h2>
            </div>

            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('login')}
                className={`tab-login-btn flex-1 pb-4 text-center font-medium transition-all duration-300 border-b-2 ${
                  activeTab === 'login'
                    ? 'text-emerald-700 border-emerald-700'
                    : 'text-slate-500 border-transparent hover:text-slate-700'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className={`tab-register-btn flex-1 pb-4 text-center font-medium transition-all duration-300 border-b-2 ${
                  activeTab === 'register'
                    ? 'text-emerald-700 border-emerald-700'
                    : 'text-slate-500 border-transparent hover:text-slate-700'
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          {activeTab === 'login' && (
            <div className="animate-fade-in">
              <form className="space-y-6" onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const form = e.target as HTMLFormElement;
                  const email = (form.querySelector('#login-email') as HTMLInputElement)?.value || 'donor@example.com';
                  const password = (form.querySelector('#login-password') as HTMLInputElement)?.value || 'password';
                  
                  await login(email, password, role === 'admin' ? 'admin' : role === 'fundraiser' ? 'fundraiser' : 'donor');
                  
                  // Extract name from email or use generic greeting
                  const userName = email.split('@')[0];
                  setWelcomeUser(userName);
                  setShowWelcomeModal(true);

                  // Show success toast
                  toast({
                    title: '✨ Welcome Back!',
                    description: `You've successfully logged in as a ${role}.`,
                    variant: 'success',
                  });

                  const getDefaultDestination = (userRole: Role) => {
                    if (userRole === 'admin') return '/admin/dashboard';
                    if (userRole === 'fundraiser') return '/fundraiser/dashboard';
                    return '/donor/dashboard';
                  };

                  const shouldUseFromDestination = (fromPath?: string, userRole?: Role) => {
                    if (!fromPath || !userRole) return false;
                    const rolePrefix = userRole === 'admin' ? '/admin' : userRole === 'fundraiser' ? '/fundraiser' : '/donor';

                    // Allow returning to public pages or same-role protected pages only.
                    return fromPath.startsWith(rolePrefix) || fromPath === '/' || fromPath.startsWith('/campaigns') || fromPath.startsWith('/donation');
                  };

                  // Navigate after a short delay to let user see the modal
                  setTimeout(() => {
                    const dest = shouldUseFromDestination(from, role) && from
                      ? from
                      : getDefaultDestination(role);
                    navigate(dest, { replace: true });
                  }, 2000);
                } catch (err: any) {
                  toast({
                    title: '❌ Login Failed',
                    description: err?.response?.data?.message || err?.message || 'Invalid credentials',
                    variant: 'destructive',
                  });
                }
              }}>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 group"
                  >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800">Google</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 group"
                  >
                    <i className="fa-brands fa-apple text-xl text-slate-800" />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800">Apple</span>
                  </button>
                </div>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-200" />
                  <span className="flex-shrink-0 mx-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Or continue with email</span>
                  <div className="flex-grow border-t border-slate-200" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sign in as</label>
                  <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-2">
                    {(['donor', 'fundraiser', 'admin'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2.5 rounded-lg text-xs min-[380px]:text-sm font-medium transition-colors ${
                          role === r ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group relative">
                  <input
                    type="email"
                    id="login-email"
                    className="peer w-full px-4 py-3.5 rounded-xl border border-slate-200 text-slate-900 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
                    placeholder="Email address"
                  />
                  <label htmlFor="login-email" className="absolute left-4 top-3.5 text-slate-400 text-sm transition-all pointer-events-none">
                    Email address
                  </label>
                  <i className="fa-regular fa-envelope absolute right-4 top-4 text-slate-400" />
                </div>

                <div className="space-y-2">
                  <div className="input-group relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="login-password"
                      className="peer w-full px-4 py-3.5 rounded-xl border border-slate-200 text-slate-900 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
                      placeholder="Password"
                    />
                    <label htmlFor="login-password" className="absolute left-4 top-3.5 text-slate-400 text-sm transition-all pointer-events-none">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      <i className={showPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'} />
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowForgotPasswordModal(true)}
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-lg shadow-emerald-700/20 transform transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                  <span>Sign In</span>
                  <i className="fa-solid fa-arrow-right text-sm" />
                </button>
              </form>
            </div>
          )}

          {activeTab === 'register' && (
            <div className="animate-fade-in">
              <form
                className="space-y-6"
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const form = e.target as HTMLFormElement;
                    const email = (form.querySelector('#reg-email') as HTMLInputElement)?.value;
                    const password = (form.querySelector('#reg-password') as HTMLInputElement)?.value;
                    const username = ((form.querySelector('#reg-fname') as HTMLInputElement)?.value || '') + ' ' + ((form.querySelector('#reg-lname') as HTMLInputElement)?.value || '');
                    await register({ email, password, username, role });
                    
                    // Show success toast
                    toast({
                      title: '✨ Success!',
                      description: `Welcome to SafeDonate! You've been registered as a ${role}.`,
                      variant: 'success',
                    });
                    
                    // After register, redirect to dashboard based on role
                    const dest = role === 'fundraiser' ? '/fundraiser/dashboard' : '/donor/dashboard';
                    navigate(dest, { replace: true });
                  } catch (err: any) {
                    const errorMessage = err?.response?.data?.message || err?.message || 'Registration failed. Please try again.';
                    const existingRole = err?.response?.data?.existingRole;

                    // Show error toast
                    toast({
                      title: existingRole ? '⚠️ Already Registered' : '❌ Registration Failed',
                      description: errorMessage,
                      variant: 'destructive',
                    });
                  }
                }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 group"
                  >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800">Continue with Google</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 group"
                  >
                    <i className="fa-brands fa-apple text-xl text-slate-800" />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800">Continue with Apple</span>
                  </button>
                </div>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-200" />
                  <span className="flex-shrink-0 mx-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Or continue with email</span>
                  <div className="flex-grow border-t border-slate-200" />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">I want to...</label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="cursor-pointer group">
                      <input
                        type="radio"
                        name="role"
                        checked={role === 'donor'}
                        onChange={() => setRole('donor')}
                        className="hidden"
                      />
                      <div
                        className={`h-full p-4 rounded-xl border-2 transition-all duration-200 relative overflow-hidden ${
                          role === 'donor' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-200'
                        }`}
                      >
                        <div className="flex flex-col items-center text-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 ${
                              role === 'donor' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600'
                            }`}
                          >
                            <i className="fa-solid fa-heart" />
                          </div>
                          <div>
                            <span className="block font-bold text-slate-800">Donate</span>
                            <span className="text-xs text-slate-500">Support causes</span>
                          </div>
                        </div>
                        <div className={`absolute top-2 right-2 text-emerald-600 transition-all duration-200 ${role === 'donor' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                          <i className="fa-solid fa-circle-check" />
                        </div>
                      </div>
                    </label>

                    <label className="cursor-pointer group">
                      <input
                        type="radio"
                        name="role"
                        checked={role === 'fundraiser'}
                        onChange={() => setRole('fundraiser')}
                        className="hidden"
                      />
                      <div
                        className={`h-full p-4 rounded-xl border-2 transition-all duration-200 relative overflow-hidden ${
                          role === 'fundraiser' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-200'
                        }`}
                      >
                        <div className="flex flex-col items-center text-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 ${
                              role === 'fundraiser' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600'
                            }`}
                          >
                            <i className="fa-solid fa-rocket" />
                          </div>
                          <div>
                            <span className="block font-bold text-slate-800">Fundraise</span>
                            <span className="text-xs text-slate-500">Start a campaign</span>
                          </div>
                        </div>
                        <div className={`absolute top-2 right-2 text-emerald-600 transition-all duration-200 ${role === 'fundraiser' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                          <i className="fa-solid fa-circle-check" />
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group relative">
                    <input
                      type="text"
                      id="reg-fname"
                      className="peer w-full px-4 py-3.5 rounded-xl border border-slate-200 text-slate-900 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
                      placeholder="First Name"
                    />
                    <label htmlFor="reg-fname" className="absolute left-4 top-3.5 text-slate-400 text-sm transition-all pointer-events-none">
                      First Name
                    </label>
                  </div>
                  <div className="input-group relative">
                    <input
                      type="text"
                      id="reg-lname"
                      className="peer w-full px-4 py-3.5 rounded-xl border border-slate-200 text-slate-900 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
                      placeholder="Last Name"
                    />
                    <label htmlFor="reg-lname" className="absolute left-4 top-3.5 text-slate-400 text-sm transition-all pointer-events-none">
                      Last Name
                    </label>
                  </div>
                </div>

                <div className="input-group relative">
                  <input
                    type="email"
                    id="reg-email"
                    className="peer w-full px-4 py-3.5 rounded-xl border border-slate-200 text-slate-900 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
                    placeholder="Email address"
                  />
                  <label htmlFor="reg-email" className="absolute left-4 top-3.5 text-slate-400 text-sm transition-all pointer-events-none">
                    Email address
                  </label>
                  <i className="fa-regular fa-envelope absolute right-4 top-4 text-slate-400" />
                </div>

                <div className="space-y-2">
                  <div className="input-group relative">
                    <input
                      type="password"
                      id="reg-password"
                      className="peer w-full px-4 py-3.5 rounded-xl border border-slate-200 text-slate-900 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
                      placeholder="Create Password"
                    />
                    <label htmlFor="reg-password" className="absolute left-4 top-3.5 text-slate-400 text-sm transition-all pointer-events-none">
                      Create Password
                    </label>
                  </div>
                  <div className="flex gap-1 h-1 mt-2">
                    <div className="flex-1 bg-emerald-500 rounded-full" />
                    <div className="flex-1 bg-emerald-500 rounded-full" />
                    <div className="flex-1 bg-slate-200 rounded-full" />
                    <div className="flex-1 bg-slate-200 rounded-full" />
                  </div>
                  <p className="text-xs text-emerald-600 font-medium">Strength: Medium</p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex items-center h-5">
                    <input id="terms" type="checkbox" className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                  </div>
                  <label htmlFor="terms" className="text-sm text-slate-500">
                    I agree to the{' '}
                    <a href="#" className="text-emerald-600 hover:underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-emerald-600 hover:underline">
                      Privacy Policy
                    </a>
                    .
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-lg shadow-emerald-700/20 transform transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                  <span>Create Account</span>
                  <i className="fa-solid fa-user-plus text-sm" />
                </button>
              </form>
            </div>
          )}

          <div className="mt-10 text-center">
            <p className="text-sm text-slate-400">
              Protected by reCAPTCHA and subject to the Google{' '}
              <a href="#" className="underline hover:text-slate-600">
                Privacy Policy
              </a>{' '}
              and{' '}
              <a href="#" className="underline hover:text-slate-600">
                Terms of Service
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Welcome Modal */}
      <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-check text-white text-2xl" />
            </div>
            <DialogTitle className="text-2xl">Welcome, {welcomeUser}! 🎉</DialogTitle>
            <DialogDescription className="mt-2 text-base">
              You've successfully logged in to SafeDonate. Get ready to make a difference!
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-3">
            <p className="text-sm text-gray-600">
              redirecting to your {role === 'fundraiser' ? 'fundraiser' : 'donor'} dashboard...
            </p>
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />
    </div>
  );
}
