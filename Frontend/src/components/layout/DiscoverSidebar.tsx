import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { href: '/', icon: 'fa-house', label: 'Home' },
  { href: '/campaigns', icon: 'fa-compass', label: 'Discover' },
  { href: '/campaigns/featured', icon: 'fa-star', label: 'Featured' },
  { href: '/donor/dashboard', icon: 'fa-handshake', label: 'Donor Hub' },
  { href: '/fundraiser/dashboard', icon: 'fa-heart', label: 'Fundraiser' },
  { href: '/fundraiser/create-campaign', icon: 'fa-plus', label: 'Create Campaign' },
  { href: '/admin/dashboard', icon: 'fa-shield', label: 'Admin Panel' },
];

interface DiscoverSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function DiscoverSidebar({ isOpen = false, onClose }: DiscoverSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
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
        className={`fixed left-0 top-0 h-screen w-72 bg-gradient-to-b from-emerald-900 via-emerald-800 to-teal-900 text-white flex flex-col shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
      <div className="p-6 border-b border-emerald-700/50 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 mb-1" onClick={onClose}>
          <div className="w-10 h-10 rounded-full border-2 border-emerald-400 flex items-center justify-center bg-emerald-700 shadow-lg shadow-emerald-900/20">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-emerald-300" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold text-white tracking-wide">SafeDonate</h1>
            <p className="text-emerald-300 text-xs font-light tracking-wider uppercase">Crowdfunding</p>
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

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto hide-scrollbar">
        {visibleNavItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-emerald-700 bg-opacity-60 text-white shadow-inner border border-emerald-600/30'
                  : 'text-emerald-100 hover:bg-emerald-700 hover:bg-opacity-40'
              }`}
            >
              <i className={`fa-solid ${item.icon} w-5 text-emerald-300 ${!isActive ? 'group-hover:text-white transition-colors' : ''}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 space-y-3 border-t border-emerald-700/50 bg-emerald-900/20">
        {!user ? (
          <>
            <Link
              to="/login"
              onClick={onClose}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-emerald-100 font-medium transition-all duration-200 hover:bg-emerald-700 hover:bg-opacity-40 hover:text-white"
            >
              <i className="fa-solid fa-arrow-right-to-bracket w-4" />
              <span>Login</span>
            </Link>
            <Link
              to="/register"
              onClick={onClose}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-emerald-500/50 border border-emerald-400/20"
            >
              <i className="fa-solid fa-user-plus w-4" />
              <span>Register</span>
            </Link>
          </>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-red-500/50"
          >
            <i className="fa-solid fa-sign-out-alt w-4" />
            <span>Logout</span>
          </button>
        )}
      </div>

      {user && (
      <div className="px-4 py-4 border-t border-emerald-700/50">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-800/40 hover:bg-emerald-700/60 transition-all duration-200 cursor-pointer border border-transparent hover:border-emerald-600/30">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover shadow-sm" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center font-bold text-emerald-900 text-sm shadow-sm">
              {getInitials(user.name)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
            <p className="text-xs text-emerald-300 truncate">{user.email}</p>
          </div>
          <i className="fa-solid fa-chevron-down w-4 text-emerald-300" />
        </div>
      </div>
      )}
    </div>
    </>
  );
}
