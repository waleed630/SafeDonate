import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { href: '/', icon: 'fa-home', label: 'Home' },
  { href: '/campaigns', icon: 'fa-magnifying-glass', label: 'Discover' },
  { href: '/campaigns/featured', icon: 'fa-heart', label: 'Featured' },
  { href: '/donor/dashboard', icon: 'fa-chart-line', label: 'Donor Hub' },
  { href: '/fundraiser/dashboard', icon: 'fa-rocket', label: 'Fundraiser' },
  { href: '/fundraiser/create-campaign', icon: 'fa-plus-circle', label: 'Create Campaign' },
  { href: '/admin/dashboard', icon: 'fa-shield', label: 'Admin Panel' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    onClose?.();
  };

  const visibleNavItems = navItems.filter((item) => {
    if (item.href === '/fundraiser/create-campaign' || item.href === '/fundraiser/dashboard') {
      return user?.role === 'fundraiser';
    }
    if (item.href === '/admin/dashboard') {
      return user?.role === 'admin';
    }
    if (item.href === '/donor/dashboard') {
      return user?.role === 'donor';
    }
    return true;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <div
        className={`fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900 text-white shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
      <div className="p-6 border-b border-emerald-700 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3" onClick={onClose}>
          <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" />
            <path d="M16 8v8m-4-4h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M10 24c2-1 4-1.5 6-1.5s4 0.5 6 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div>
            <h1 className="text-lg font-bold tracking-tight">SafeDonate</h1>
            <p className="text-xs text-emerald-300">Crowdfunding</p>
          </div>
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-2 -mr-2 text-emerald-200 hover:text-white hover:bg-emerald-700 rounded-lg transition-colors"
          aria-label="Close menu"
        >
          <i className="fa-solid fa-times text-xl" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 [&::-webkit-scrollbar]:thin [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-emerald-700 [&::-webkit-scrollbar-thumb]:rounded-full" style={{ scrollbarWidth: 'thin' }}>
        {visibleNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:bg-emerald-700 hover:text-white active:scale-95 ${
                isActive ? 'bg-emerald-700 text-white' : 'text-emerald-100'
              }`}
            >
              <i className={`fa-solid ${item.icon} w-5`} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="my-4 border-t border-emerald-700" />

        {!user ? (
          <>
            <Link
              to="/login"
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:bg-emerald-700 hover:text-white ${
                location.pathname === '/login' ? 'bg-emerald-700 text-white' : 'text-emerald-100'
              }`}
            >
              <i className="fa-solid fa-sign-in-alt w-5" />
              <span>Login</span>
            </Link>
            <Link
              to="/register"
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:bg-emerald-700 hover:text-white ${
                location.pathname === '/register' ? 'bg-emerald-700 text-white' : 'text-emerald-100'
              }`}
            >
              <i className="fa-solid fa-user-plus w-5" />
              <span>Register</span>
            </Link>
          </>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:bg-red-700 hover:text-white text-emerald-100"
          >
            <i className="fa-solid fa-sign-out-alt w-5" />
            <span>Logout</span>
          </button>
        )}
      </nav>

      {user && (
      <div className="border-t border-emerald-700 p-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 transition-all duration-200 cursor-pointer">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center font-bold text-emerald-900">
              {getInitials(user.name)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-emerald-200 truncate">{user.email}</p>
          </div>
          <button type="button" className="p-1 hover:bg-emerald-600 rounded transition-colors">
            <i className="fa-solid fa-chevron-down text-xs" />
          </button>
        </div>
      </div>
      )}
    </div>
    </>
  );
}
