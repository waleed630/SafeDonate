import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RegisterSidebar } from '../components/layout/RegisterSidebar';
import { MobileHeader } from '../components/layout/MobileHeader';
import { useAuth } from '../contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
} from '../components/ui/AlertDialog';
import { useToast } from '../hooks/use-toast';

const BACKEND_URL = 'http://localhost:5000';

export function RegisterPage() {
  const [role, setRole] = useState<'donor' | 'fundraiser'>('donor');
  const [showPassword, setShowPassword] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; title: string; message: string }>({ open: false, title: '', message: '' });

  const { register, setUser } = useAuth() as any;
  const navigate = useNavigate();
  const { toast } = useToast();

  // Handle OAuth callback from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const refresh = params.get('refresh');
    const userRole = params.get('role');
    const profilePicture = params.get('picture');

    if (token && refresh) {
      try {
        // Decode JWT token to get user info (without verification on frontend)
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const decodedToken = JSON.parse(atob(tokenParts[1]));
          
          // Store tokens
          localStorage.setItem('safedonate_token', token);
          localStorage.setItem('safedonate_refresh_token', refresh);
          
          // Store user info
          const user = {
            id: decodedToken.id || decodedToken.userId,
            email: decodedToken.email,
            name: decodedToken.username || decodedToken.name || '',
            role: userRole || decodedToken.role || 'donor',
            avatar: profilePicture || undefined,
          };
          localStorage.setItem('safedonate_user', JSON.stringify(user));
          setUser(user);
        }

        toast({
          title: '✨ Welcome!',
          description: `You have successfully registered as a ${userRole}!`,
          variant: 'success',
        });

        const dest = userRole === 'fundraiser' ? '/fundraiser/dashboard' : '/donor/dashboard';
        navigate(dest, { replace: true });
      } catch (error) {
        console.error('Failed to process OAuth callback:', error);
        setErrorDialog({
          open: true,
          title: 'Authentication Error',
          message: 'Failed to process your authentication. Please try again.',
        });
      }
    } else if (params.get('error') === 'oauth_failed') {
      setErrorDialog({
        open: true,
        title: 'OAuth Failed',
        message: 'Google authentication failed. Please try again.',
      });
    }
  }, [navigate, toast]);

  const handleGoogleSignup = () => {
    // Redirect to backend Google OAuth endpoint with selected role
    window.location.href = `${BACKEND_URL}/api/auth/google?role=${role}`;
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const form = e.target as HTMLFormElement;
      const email = (form.querySelector('#email') as HTMLInputElement)?.value?.trim();
      const password = (form.querySelector('#password') as HTMLInputElement)?.value;
      const firstName = (form.querySelector('#first-name') as HTMLInputElement)?.value?.trim() || '';
      const lastName = (form.querySelector('#last-name') as HTMLInputElement)?.value?.trim() || '';
      const termsChecked = (form.querySelector('#terms') as HTMLInputElement)?.checked;

      // Validation
      if (!firstName || !lastName) {
        setErrorDialog({
          open: true,
          title: 'Incomplete Form',
          message: 'Please enter both first and last name.',
        });
        setIsLoading(false);
        return;
      }

      if (!email) {
        setErrorDialog({
          open: true,
          title: 'Missing Email',
          message: 'Please enter a valid email address.',
        });
        setIsLoading(false);
        return;
      }

      if (!password || password.length < 6) {
        setErrorDialog({
          open: true,
          title: 'Weak Password',
          message: 'Password must be at least 6 characters long.',
        });
        setIsLoading(false);
        return;
      }

      if (!termsChecked) {
        setErrorDialog({
          open: true,
          title: 'Terms Not Accepted',
          message: 'Please agree to the Terms of Service and Privacy Policy.',
        });
        setIsLoading(false);
        return;
      }

      const username = `${firstName} ${lastName}`;

      await register({ email, password, username, role });

      toast({
        title: '✨ Success!',
        description: `Welcome to SafeDonate! You've been registered as a ${role}.`,
        variant: 'success',
      });

      const dest = role === 'fundraiser' ? '/fundraiser/dashboard' : '/donor/dashboard';
      navigate(dest, { replace: true });
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Registration failed. Please try again.';
      const existingRole = err?.response?.data?.existingRole;

      // Check if this is a role mismatch error
      if (existingRole) {
        setErrorDialog({
          open: true,
          title: '⚠️ Already Registered',
          message: errorMessage,
        });
      } else {
        setErrorDialog({
          open: true,
          title: 'Registration Failed',
          message: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 text-gray-900 font-sans antialiased min-h-screen">
      <RegisterSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Error Dialog */}
      <AlertDialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{errorDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{errorDialog.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorDialog({ ...errorDialog, open: false })}>
              Try Again
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="ml-0 lg:ml-72 min-h-screen flex flex-col overflow-hidden bg-white">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left split: Visual */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-emerald-900 flex-col justify-between p-12 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=1600"
              alt="Community"
              className="w-full h-full object-cover opacity-40 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/80 via-emerald-900/60 to-emerald-900/90" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/50 border border-emerald-600/50 backdrop-blur-sm text-emerald-100 text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Over $50M Raised This Year
            </div>

            <h2 className="font-serif text-5xl md:text-6xl font-medium text-white leading-tight mb-6">
              Empower dreams,
              <br />
              <span className="italic text-emerald-300">one donation</span> at a time.
            </h2>

            <p className="text-lg text-emerald-100/90 max-w-md leading-relaxed">
              Join a community of 2 million+ changemakers. Whether you&apos;re funding a medical emergency or launching the next big idea, SafeDonate is your trusted partner.
            </p>
          </div>

          <div className="relative z-10 mt-auto">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 max-w-md transform transition-transform hover:scale-[1.02] duration-300">
              <div className="flex gap-1 text-yellow-400 mb-3 text-sm">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className="fa-solid fa-star" />
                ))}
              </div>
              <p className="text-white font-medium italic mb-4">
                &quot;The transparency of this platform gave me the confidence to donate. Seeing the direct impact of my contribution was incredibly rewarding.&quot;
              </p>
              <div className="flex items-center gap-3">
                <img
                  src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150"
                  alt="User"
                  className="w-10 h-10 rounded-full border-2 border-emerald-400 object-cover"
                />
                <div>
                  <p className="text-white font-semibold text-sm">Sarah Jenkins</p>
                  <p className="text-emerald-200 text-xs">Top Donor • 24 Campaigns Backed</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right split: Form */}
        <div className="w-full lg:w-1/2 min-h-0 flex-1 overflow-y-auto register-scrollbar bg-white flex flex-col">
          <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12">
            <div className="w-full max-w-md mx-auto">
              <div className="mb-8 text-center lg:text-left">
                <h2 className="font-serif text-4xl font-bold text-gray-900 mb-3">Create an account</h2>
                <p className="text-gray-500">
                  Already have an account?{' '}
                  <Link to="/login" className="text-emerald-700 font-semibold hover:text-emerald-800 hover:underline transition-colors">
                    Log in
                  </Link>
                </p>
              </div>

              {/* Role Toggle */}
              <div className="mb-8 p-1 bg-gray-100 rounded-xl flex relative">
                <div className="w-1/2">
                  <input
                    type="radio"
                    name="role"
                    id="role-donor"
                    className="peer hidden"
                    checked={role === 'donor'}
                    onChange={() => setRole('donor')}
                  />
                  <label
                    htmlFor="role-donor"
                    className={`flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-all duration-200 ${
                      role === 'donor'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <i className="fa-solid fa-heart" />
                    I want to Donate
                  </label>
                </div>
                <div className="w-1/2">
                  <input
                    type="radio"
                    name="role"
                    id="role-fundraiser"
                    className="peer hidden"
                    checked={role === 'fundraiser'}
                    onChange={() => setRole('fundraiser')}
                  />
                  <label
                    htmlFor="role-fundraiser"
                    className={`flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-all duration-200 ${
                      role === 'fundraiser'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <i className="fa-solid fa-hand-holding-dollar" />
                    I want to Fundraise
                  </label>
                </div>
              </div>

              {/* Social Signup */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
                >
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Google</span>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
                >
                  <i className="fa-brands fa-apple text-xl text-gray-900" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Apple</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 uppercase tracking-wider text-xs font-medium">Or continue with email</span>
                </div>
              </div>

              {/* Form */}
              <form
                className="space-y-5"
                onSubmit={handleRegister}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">First name</label>
                    <input
                      type="text"
                      id="first-name"
                      className="block w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all duration-200"
                      placeholder="Jane"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">Last name</label>
                    <input
                      type="text"
                      id="last-name"
                      className="block w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all duration-200"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      className="block w-full pl-4 pr-10 py-3 rounded-lg border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all duration-200"
                      placeholder="jane@example.com"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                      <i className="fa-regular fa-envelope" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      className="block w-full pl-4 pr-10 py-3 rounded-lg border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all duration-200"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                    >
                      <i className={showPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'} />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <div className="flex items-center h-5">
                    <input id="terms" type="checkbox" className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                  </div>
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    I agree to the <a href="#" className="text-emerald-700 hover:underline">Terms of Service</a> and <a href="#" className="text-emerald-700 hover:underline">Privacy Policy</a>.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center px-4 py-3.5 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {isLoading ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin mr-2" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>
            </div>
          </div>

          <footer className="bg-gray-50 text-gray-500 border-t border-gray-100 mt-auto">
            <div className="px-8 py-6 text-center">
              <p className="text-xs">&copy; 2025 SafeDonate. All rights reserved.</p>
              <div className="flex justify-center gap-4 mt-2 text-xs">
                <a href="#" className="hover:text-emerald-700 transition-colors">Privacy</a>
                <span className="text-gray-300">•</span>
                <a href="#" className="hover:text-emerald-700 transition-colors">Terms</a>
                <span className="text-gray-300">•</span>
                <a href="#" className="hover:text-emerald-700 transition-colors">Help</a>
              </div>
            </div>
          </footer>
        </div>
        </div>
      </div>
    </div>
  );
}
