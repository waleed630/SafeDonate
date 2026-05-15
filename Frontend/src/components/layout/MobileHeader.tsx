import { Link } from 'react-router-dom';

interface MobileHeaderProps {
  onMenuClick: () => void;
  title?: string;
  showLogo?: boolean;
}

export function MobileHeader({ onMenuClick, title, showLogo = true }: MobileHeaderProps) {
  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
      <button
        type="button"
        onClick={onMenuClick}
        className="p-2 -ml-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
        aria-label="Open menu"
      >
        <i className="fa-solid fa-bars text-xl" />
      </button>
      {showLogo && (
        <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <span className="font-bold text-slate-800 text-lg">SafeDonate</span>
        </Link>
      )}
      {title && !showLogo && (
        <span className="flex-1 text-center font-semibold text-slate-800">{title}</span>
      )}
      <div className="w-10" /> {/* Spacer for centering */}
    </header>
  );
}
