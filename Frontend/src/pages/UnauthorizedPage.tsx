import { Link } from 'react-router-dom';

export function UnauthorizedPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-6">
        <i className="fa-solid fa-lock text-3xl" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Access Denied</h1>
      <p className="text-slate-500 mt-2 text-center max-w-md">
        You don't have permission to view this page.
      </p>
      <div className="flex gap-4 mt-8">
        <Link to="/home" className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors">
          Go Home
        </Link>
        <Link to="/login" className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
          Login
        </Link>
      </div>
    </div>
  );
}
