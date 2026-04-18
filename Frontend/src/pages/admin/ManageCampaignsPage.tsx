import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { ProgressBar } from '../../components/ui/ProgressBar';

interface Campaign {
  _id: string;
  title: string;
  description: string;
  images: string[];
  goalAmount: number;
  raisedAmount: number;
  status: 'pending' | 'approved' | 'rejected';
  verified: boolean;
  fundraiser: {
    _id: string;
    name: string;
    email: string;
    username: string;
  };
  createdAt: string;
  rejectionReason?: string;
}

export function ManageCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  // Modal state
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  // Fetch campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const response = await api.get('/campaigns/admin/all');
        setCampaigns(response.data.campaigns || []);
        setError('');
      } catch (err: any) {
        console.error('Failed to fetch campaigns:', err);
        setError(err.response?.data?.message || 'Failed to load campaigns');
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  // Filter campaigns
  const filteredCampaigns = filter === 'all' 
    ? campaigns 
    : campaigns.filter(c => c.status === filter);

  const handleApprove = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowApprovalModal(true);
  };

  const handleReject = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowRejectionModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedCampaign) return;

    try {
      setApproving(true);
      await api.post(`/campaigns/admin/${selectedCampaign._id}/approve`);
      
      // Update local state
      setCampaigns(campaigns.map(c => 
        c._id === selectedCampaign._id 
          ? { ...c, status: 'approved', verified: true }
          : c
      ));
      
      setShowApprovalModal(false);
      setSelectedCampaign(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve campaign');
    } finally {
      setApproving(false);
    }
  };

  const confirmReject = async () => {
    if (!selectedCampaign || !rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    try {
      setRejecting(true);
      await api.post(`/campaigns/admin/${selectedCampaign._id}/reject`, {
        reason: rejectionReason
      });
      
      // Update local state
      setCampaigns(campaigns.map(c => 
        c._id === selectedCampaign._id 
          ? { ...c, status: 'rejected', verified: false, rejectionReason }
          : c
      ));
      
      setShowRejectionModal(false);
      setSelectedCampaign(null);
      setRejectionReason('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject campaign');
    } finally {
      setRejecting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-700';
      case 'rejected':
        return 'bg-rose-100 text-rose-700';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusDisplay = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getProgress = (campaign: Campaign) => {
    return campaign.goalAmount > 0 
      ? Math.min(100, Math.round((campaign.raisedAmount / campaign.goalAmount) * 100))
      : 0;
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Manage Campaigns</h1>
      <p className="text-slate-500 mb-8">Oversee all platform campaigns and approve/reject submissions</p>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({campaigns.filter(c => status === 'all' || c.status === status).length})
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">
          <div className="inline-block">
            <div className="animate-spin">
              <i className="fa-solid fa-spinner text-4xl text-emerald-600" />
            </div>
          </div>
          <p className="mt-4">Loading campaigns...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Campaign</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Fundraiser</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Progress</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((campaign) => (
                  <tr key={campaign._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {campaign.images && campaign.images[0] && (
                          <img src={campaign.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                        )}
                        <div>
                          <p className="font-medium text-slate-800 max-w-xs truncate">{campaign.title}</p>
                          <p className="text-xs text-slate-500">Created {new Date(campaign.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      <div>
                        <p className="text-sm font-medium">{campaign.fundraiser.name}</p>
                        <p className="text-xs text-slate-500">{campaign.fundraiser.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 w-32">
                      <ProgressBar value={getProgress(campaign)} size="sm" />
                      <p className="text-xs text-slate-500 mt-1">${campaign.raisedAmount} / ${campaign.goalAmount}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {getStatusDisplay(campaign.status)}
                      </span>
                      {campaign.status === 'rejected' && campaign.rejectionReason && (
                        <p className="text-xs text-rose-600 mt-1 max-w-xs">Reason: {campaign.rejectionReason}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        {campaign.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(campaign)}
                              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(campaign)}
                              className="text-rose-600 hover:text-rose-700 text-sm font-medium"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {campaign.status === 'rejected' && (
                          <button
                            onClick={() => handleApprove(campaign)}
                            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                          >
                            Reconsider
                          </button>
                        )}
                        {campaign.status === 'approved' && (
                          <span className="text-emerald-600 text-sm font-medium">Approved</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredCampaigns.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <i className="fa-solid fa-inbox text-4xl mb-3 opacity-50" />
              <p>No campaigns found</p>
            </div>
          )}
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Approve Campaign</h2>
            <p className="text-slate-600 mb-6">
              Are you sure you want to approve "<strong>{selectedCampaign.title}</strong>"? This campaign will become visible to donors.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedCampaign(null);
                }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                disabled={approving}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
              >
                {approving ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedCampaign && (
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
                  setShowRejectionModal(false);
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
