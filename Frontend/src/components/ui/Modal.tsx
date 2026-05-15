import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        className={`relative w-full ${sizeClass} max-h-[min(90dvh,100svh-2rem)] flex flex-col bg-white rounded-t-2xl sm:rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900 pr-2">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
              aria-label="Close"
            >
              <i className="fa-solid fa-times" />
            </button>
          </div>
        )}
        <div className={`${title ? 'p-6' : 'p-4'} overflow-y-auto overscroll-contain min-h-0`}>{children}</div>
      </div>
    </div>
  );
}
