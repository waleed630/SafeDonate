import { Link } from 'react-router-dom';

export function DonationCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mx-auto mb-4">
          <i className="fa-solid fa-circle-xmark text-2xl"></i>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">Donation Cancelled</h1>
        <p className="text-slate-600 text-center mb-8">Your donation process was cancelled. No funds have been charged.</p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-800">
            <i className="fa-solid fa-info-circle mr-2"></i>
            You can return to the campaign and try again anytime.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            to="/campaigns"
            className="w-full block py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-center rounded-xl transition-colors"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i>Back to Campaigns
          </Link>
          <Link
            to="/donor/dashboard"
            className="w-full block py-3 border border-slate-200 text-slate-700 font-semibold text-center rounded-xl hover:bg-slate-50 transition-colors"
          >
            <i className="fa-solid fa-home mr-2"></i>Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
