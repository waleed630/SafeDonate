import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 shadow-lg z-20 relative pb-[max(0px,env(safe-area-inset-bottom))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="text-sm text-gray-600">
          <p>© 2025 SafeDonate. All rights reserved.</p>
        </div>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6">
          <Link to="/about" className="text-sm text-gray-600 hover:text-emerald-600 transition-colors">About</Link>
          <a href="#" className="text-sm text-gray-600 hover:text-emerald-600 transition-colors">Privacy Policy</a>
          <a href="#" className="text-sm text-gray-600 hover:text-emerald-600 transition-colors">Terms of Service</a>
          <a href="#" className="text-sm text-gray-600 hover:text-emerald-600 transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
}
