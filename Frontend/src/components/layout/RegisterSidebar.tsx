import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { href: '/home', icon: 'fa-house', label: 'Home' },
  { href: '/campaigns', icon: 'fa-magnifying-glass', label: 'Discover' },
  { href: '/campaigns/featured', icon: 'fa-heart', label: 'Featured' },
  { href: '/donor/dashboard', icon: 'fa-handshake', label: 'Donor Hub' },
  { href: '/fundraiser/dashboard', icon: 'fa-rocket', label: 'Fundraiser' },
  { href: '/fundraiser/create-campaign', icon: 'fa-plus-circle', label: 'Create Campaign' },
  { href: '/admin/dashboard', icon: 'fa-shield', label: 'Admin Panel' },
];

interface RegisterSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function RegisterSidebar({ isOpen = false, onClose }: RegisterSidebarProps) {
  const location = useLocation();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <div
        className={`fixed left-0 top-0 h-screen w-72 bg-gradient-to-b from-emerald-800 to-emerald-900 text-white flex flex-col shadow-lg z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
      <div className="p-6 border-b border-emerald-700 flex items-center justify-between">
        <Link to="/home" className="flex items-center gap-3 mb-1" onClick={onClose}>
          <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">SafeDonate</h1>
            <p className="text-xs text-emerald-200">Crowdfunding</p>
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

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            onClick={onClose}
            className="flex items-center gap-4 px-4 py-3 rounded-lg text-emerald-100 font-medium transition-all duration-200 hover:bg-emerald-700/50"
          >
            <i className={`fa-solid ${item.icon} w-5`} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="px-4 py-4 space-y-2 border-t border-emerald-700">
        <Link
          to="/login"
          onClick={onClose}
          className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            location.pathname === '/login' ? 'bg-emerald-600 text-white' : 'bg-emerald-700/40 text-emerald-100 hover:bg-emerald-600/60'
          }`}
        >
          <i className="fa-solid fa-arrow-right-to-bracket w-4" />
          <span>Login</span>
        </Link>
        <Link
          to="/register"
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-emerald-600 text-white font-medium transition-all duration-200 hover:bg-emerald-500 shadow-md"
        >
          <i className="fa-solid fa-user-plus w-4" />
          <span>Register</span>
        </Link>
      </div>

      <div className="px-4 py-4 border-t border-emerald-700">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-700/50 hover:bg-emerald-700 transition-all duration-200 cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center font-bold text-emerald-900 text-sm">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">John Donor</p>
            <p className="text-xs text-emerald-200 truncate">john@example.com</p>
          </div>
          <i className="fa-solid fa-chevron-down w-4 text-emerald-200" />
        </div>
      </div>
    </div>
    </>
  );
}
