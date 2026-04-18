import { useEffect } from 'react';

interface SaveSuccessModalProps {
  isOpen: boolean;
  message?: string;
  onClose: () => void;
  autoCloseDuration?: number; // milliseconds, 0 to disable
}

export function SaveSuccessModal({
  isOpen,
  message = 'Changes saved successfully!',
  onClose,
  autoCloseDuration = 3000,
}: SaveSuccessModalProps) {
  // Auto-close after duration
  useEffect(() => {
    if (isOpen && autoCloseDuration > 0) {
      const timer = setTimeout(onClose, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseDuration, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-zoom-in">
        {/* Success Icon */}
        <div className="flex justify-center pt-8">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-75"></div>
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100">
              <svg
                className="w-10 h-10 text-emerald-600 animate-draw"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center px-6 py-6">
          <h2 className="text-2xl font-bold text-emerald-600 mb-2">Success! ✨</h2>
          <p className="text-slate-600 text-sm">{message}</p>
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            Done
          </button>
        </div>

        {/* Decorative bottom line */}
        <div className="h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 rounded-b-xl"></div>
      </div>

      <style>{`
        @keyframes zoom-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes draw {
          0% {
            stroke-dasharray: 60;
            stroke-dashoffset: 60;
          }
          100% {
            stroke-dasharray: 60;
            stroke-dashoffset: 0;
          }
        }
        
        .animate-zoom-in {
          animation: zoom-in 0.3s ease-out;
        }
        
        .animate-draw {
          animation: draw 0.6s ease-out 0.3s both;
        }
      `}</style>
    </div>
  );
}
