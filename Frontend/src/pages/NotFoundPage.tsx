import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16">
      <div className="text-8xl sm:text-9xl font-bold text-slate-200">404</div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-4">Page Not Found</h1>
      <p className="text-slate-500 mt-2 text-center max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/home"
        className="mt-8 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
