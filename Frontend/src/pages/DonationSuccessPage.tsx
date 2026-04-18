import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';

export function DonationSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [donationDetails, setDonationDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyDonation = async () => {
      try {
        if (!sessionId) {
          setError('Invalid session');
          setLoading(false);
          return;
        }

        // Verify the donation and get details
        const response = await api.get(`/donations/verify?session_id=${sessionId}`);
        if (response.data.success) {
          setDonationDetails(response.data.donation);
        } else {
          setError(response.data.message || 'Unable to verify donation');
        }
      } catch (err: any) {
        console.error('Donation verification error:', err);
        setError(err.response?.data?.message || 'Failed to verify donation');
      } finally {
        setLoading(false);
      }
    };

    verifyDonation();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-block animate-spin mb-4">
            <i className="fa-solid fa-spinner text-4xl text-emerald-600"></i>
          </div>
          <p className="text-slate-600">Verifying your donation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
        {error ? (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto mb-4">
              <i className="fa-solid fa-exclamation text-2xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">Oops!</h1>
            <p className="text-slate-600 text-center mb-6">{error}</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-4">
              <i className="fa-solid fa-check text-2xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">Thank You!</h1>
            <p className="text-slate-600 text-center mb-6">Your donation has been received and is greatly appreciated.</p>
            
            {donationDetails && (
              <div className="bg-slate-50 rounded-lg p-4 mb-6 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Amount:</span>
                  <span className="font-semibold text-emerald-600">${donationDetails.amount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Campaign:</span>
                  <span className="text-slate-800">{donationDetails.campaignTitle}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Date:</span>
                  <span className="text-slate-800">{new Date(donationDetails.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </>
        )}

        <div className="space-y-3">
          <Link
            to="/donor/donation-history"
            className="w-full block py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-center rounded-xl transition-colors"
          >
            <i className="fa-solid fa-receipt mr-2"></i>View Receipt
          </Link>
          <Link
            to="/campaigns"
            className="w-full block py-3 border border-slate-200 text-slate-700 font-semibold text-center rounded-xl hover:bg-slate-50 transition-colors"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i>Back to Campaigns
          </Link>
        </div>
      </div>
    </div>
  );
}
