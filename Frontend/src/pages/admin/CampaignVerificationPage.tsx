import { useState, useEffect } from 'react';
import api from '../../api/axios';

interface Campaign {
  _id: string;
  title: string;
  description: string;
  images: string[];
  goalAmount: number;
  raisedAmount: number;
  fundraiser: {
    _id: string;
    name: string;
    email: string;
    username: string;
  };
  createdAt: string;
}

export function CampaignVerificationPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  // Fetch pending campaigns
  useEffect(() => {
    const fetchPendingCampaigns = async () => {
      try {
        setLoading(true);
        const response = await api.get('/verification/pending');
        setCampaigns(response.data.campaigns || []);
        setError('');
      } catch (err: any) {
        console.error('Failed to fetch pending campaigns:', err);
        setError(err.response?.data?.message || 'Failed to load campaigns');
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingCampaigns();
  }, []);

  const handleApprove = async (campaign: Campaign) => {
    try {
      setApproving(true);
      await api.post(`/verification/${campaign._id}/verify`, {
        action: 'approve'
      });
      
      // Remove approved campaign from list
      setCampaigns(campaigns.filter(c => c._id !== campaign._id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve campaign');
    } finally {
      setApproving(false);
    }
  };

  const handleRejectClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!selectedCampaign || !rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    try {
      setRejecting(true);
      await api.post(`/verification/${selectedCampaign._id}/verify`, {
        action: 'reject',
        rejectionReason: rejectionReason
      });
      
      // Remove rejected campaign from list
      setCampaigns(campaigns.filter(c => c._id !== selectedCampaign._id));
      setShowRejectModal(false);
      setSelectedCampaign(null);
      setRejectionReason('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject campaign');
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Campaign Verification</h1>
      <p className="text-slate-500 mb-8">Review and approve pending campaigns</p>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">
          <div className="inline-block">
            <div className="animate-spin">
              <i className="fa-solid fa-spinner text-4xl text-emerald-600" />
            </div>
          </div>
          <p className="mt-4">Loading pending campaigns...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          <i className="fa-solid fa-inbox text-4xl mb-3 opacity-50" />
          <p>No pending campaigns to review</p>
        </div>
      ) : (
        <div className="space-y-6">
          {campaigns.map((c) => (
            <div key={c._id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {c.images && c.images[0] && (
                  <img src={c.images[0]} alt="" className="md:w-48 h-48 object-cover" />
                )}
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">{c.title}</h3>
                      <p className="text-sm text-slate-500">by {c.fundraiser.name}</p>
                      <p className="text-slate-600 mt-2 text-sm line-clamp-2">{c.description}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        Created {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApprove(c)}
                        disabled={approving}
                        className="px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 font-medium hover:bg-emerald-200 transition-colors disabled:opacity-50"
                      >
                        {approving ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleRejectClick(c)}
                        className="px-4 py-2 rounded-lg bg-rose-100 text-rose-700 font-medium hover:bg-rose-200 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <span className="inline-flex items-center gap-1 text-amber-600 text-sm">
                      <i className="fa-solid fa-clock" /> Pending review
                    </span>
                    <span className="text-slate-600 text-sm">
                      Goal: ${c.goalAmount} | Raised: ${c.raisedAmount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Reject Campaign</h2>
            <p className="text-slate-600 mb-4">
              Please provide a reason for rejecting "<strong>{selectedCampaign.title}</strong>".
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={4}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedCampaign(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={rejecting || !rejectionReason.trim()}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 disabled:opacity-50"
              >
                {rejecting ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
