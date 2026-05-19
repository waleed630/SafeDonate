import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { DashboardCard } from '../../components/ui/DashboardCard';

interface Campaign {
  _id: string;
  title: string;
  description: string;
  goalAmount: number;
  fraudScore?: number;
  verified: boolean;
  fundraiser: { username: string; email: string };
  images: string[];
  updates: any[];
  createdAt: string;
}

interface FraudBreakdown {
  rule1_shortDescription: number;
  rule2_highGoalNoUpdates: number;
  rule3_noImages: number;
  rule4_suspiciousKeywords: number;
  aiScore: number;
}

export function FraudMonitoringPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [breakdown, setBreakdown] = useState<FraudBreakdown | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/verification/pending');
      setCampaigns(response.data.campaigns || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchFraudBreakdown = async (campaignId: string) => {
    try {
      const response = await api.post(`/verification/test-full-score/${campaignId}`);
      setBreakdown(response.data.breakdown);
    } catch (err: any) {
      console.error('Failed to fetch fraud breakdown:', err);
    }
  };

  const handleAnalyzeAI = async (campaign: Campaign) => {
    try {
      setAiAnalysisLoading(true);
      console.log('🤖 Starting AI fraud analysis for campaign:', campaign._id, campaign.title);
      
      const response = await api.post(`/verification/test-full-score/${campaign._id}`);
      
      console.log('✅ AI Analysis completed:', response.data);
      console.log('📊 AI Score:', response.data.breakdown.aiScore);
      console.log('📋 Full Breakdown:', response.data.breakdown);
      
      setSelectedCampaign(campaign);
      setAiResult({
        ...response.data,
        breakdown: response.data.breakdown
      });
      setShowAiModal(true);
    } catch (err: any) {
      console.error('❌ AI Analysis Error:', err);
      alert('Failed to analyze fraud score: ' + (err.response?.data?.message || err.message));
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  const handleViewDetails = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    await fetchFraudBreakdown(campaign._id);
    setShowBreakdown(true);
  };

  const handleApproveCampaign = async (campaignId: string) => {
    try {
      setVerifyLoading(true);
      await api.post(`/verification/${campaignId}`, { action: 'approve' });
      setCampaigns(campaigns.filter(c => c._id !== campaignId));
      setShowBreakdown(false);
      setSelectedCampaign(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve campaign');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleRejectCampaign = async (campaignId: string) => {
    try {
      setVerifyLoading(true);
      await api.post(`/verification/${campaignId}`, {
        action: 'reject',
        rejectionReason: rejectionReason || 'Fraudulent activity detected',
      });
      setCampaigns(campaigns.filter(c => c._id !== campaignId));
      setShowRejectModal(false);
      setShowBreakdown(false);
      setSelectedCampaign(null);
      setRejectionReason('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject campaign');
    } finally {
      setVerifyLoading(false);
    }
  };

  const getFraudSeverity = (score: number) => {
    if (score >= 70) return { label: 'High Risk', color: 'text-rose-600', bg: 'bg-rose-100' };
    if (score >= 40) return { label: 'Medium Risk', color: 'text-amber-600', bg: 'bg-amber-100' };
    return { label: 'Low Risk', color: 'text-emerald-600', bg: 'bg-emerald-100' };
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const scoreOr = (c: Campaign) => c.fraudScore ?? 0;

  const highRiskCount = campaigns.filter((c) => scoreOr(c) >= 70).length;
  const mediumRiskCount = campaigns.filter((c) => {
    const s = scoreOr(c);
    return s >= 40 && s < 70;
  }).length;
  const lowRiskCount = campaigns.filter((c) => scoreOr(c) < 40).length;

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 md:px-8 max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Fraud Monitoring</h1>
      <p className="text-slate-500 mb-8">AI-powered fraud detection dashboard</p>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <DashboardCard title="Pending Review" value={campaigns.length.toString()} icon="fa-hourglass" iconBg="bg-blue-100" iconColor="text-blue-600" />
        <DashboardCard title="High Risk" value={highRiskCount.toString()} icon="fa-triangle-exclamation" iconBg="bg-rose-100" iconColor="text-rose-600" />
        <DashboardCard title="Medium Risk" value={mediumRiskCount.toString()} icon="fa-flag" iconBg="bg-amber-100" iconColor="text-amber-600" />
        <DashboardCard title="Low Risk" value={lowRiskCount.toString()} icon="fa-shield-halved" iconBg="bg-emerald-100" iconColor="text-emerald-600" />
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Campaigns Pending Review</h2>
          <p className="text-sm text-slate-500 mt-1">Click on a campaign to view fraud analysis</p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">
            <i className="fa-solid fa-spinner fa-spin mr-2" /> Loading campaigns...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <i className="fa-solid fa-shield-check text-4xl text-emerald-200 mb-4" />
            <p>No campaigns pending review. All systems operating normally.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Campaign</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Fundraiser</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Goal Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Fraud Score</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Risk Level</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => {
                  const score = scoreOr(campaign);
                  const severity = getFraudSeverity(score);
                  return (
                    <tr key={campaign._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-slate-900 truncate">{campaign.title}</p>
                          <p className="text-xs text-slate-500">{campaign._id.slice(0, 8)}...</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <p className="font-medium text-slate-900">{campaign.fundraiser.username}</p>
                          <p className="text-xs text-slate-500">{campaign.fundraiser.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-slate-900">
                        ${campaign.goalAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-6 bg-slate-200 rounded-full relative">
                            <div
                              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-all ${
                                score >= 70 ? 'bg-rose-500' : score >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ marginLeft: `${(score / 100) * 4}px` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-slate-900">
                            {campaign.fraudScore !== undefined ? score : 'Calculating...'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          campaign.fraudScore !== undefined 
                            ? severity.bg + ' ' + severity.color
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {campaign.fraudScore !== undefined ? severity.label : 'Calculating...'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAnalyzeAI(campaign)}
                            disabled={aiAnalysisLoading}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            title="Run AI fraud analysis using HuggingFace BART model"
                          >
                            {aiAnalysisLoading ? (
                              <>
                                <i className="fa-solid fa-spinner fa-spin mr-1" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <i className="fa-solid fa-robot mr-1" />
                                Analyze
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleViewDetails(campaign)}
                            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showBreakdown && selectedCampaign && breakdown && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedCampaign.title}</h3>
                <p className="text-sm text-slate-500 mt-1">Fundraiser: {selectedCampaign.fundraiser.username}</p>
              </div>
              <button
                onClick={() => setShowBreakdown(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <i className="fa-solid fa-xmark text-xl" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Overall Fraud Score</span>
                  <span className={`text-2xl font-bold ${getFraudSeverity(scoreOr(selectedCampaign)).color}`}>
                    {scoreOr(selectedCampaign)}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      scoreOr(selectedCampaign) >= 70 ? 'bg-rose-500' : scoreOr(selectedCampaign) >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${scoreOr(selectedCampaign)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-slate-900 text-sm">Score Breakdown</h4>
                
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Short Description (&lt;150 chars)</span>
                  <span className={`font-semibold ${breakdown.rule1_shortDescription > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    +{breakdown.rule1_shortDescription}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">High Goal (&gt;$50k) + No Updates</span>
                  <span className={`font-semibold ${breakdown.rule2_highGoalNoUpdates > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    +{breakdown.rule2_highGoalNoUpdates}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">No Images</span>
                  <span className={`font-semibold ${breakdown.rule3_noImages > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    +{breakdown.rule3_noImages}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Suspicious Keywords</span>
                  <span className={`font-semibold ${breakdown.rule4_suspiciousKeywords > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    +{breakdown.rule4_suspiciousKeywords}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-sm font-medium text-blue-900">AI Model Score</span>
                  <span className="font-semibold text-blue-600">+{breakdown.aiScore}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg mt-4">
                <h5 className="text-sm font-medium text-slate-900 mb-2">Campaign Details</h5>
                <div className="text-sm text-slate-600 space-y-1">
                  <p>• Description length: {selectedCampaign.description.length} characters</p>
                  <p>• Images: {selectedCampaign.images.length}</p>
                  <p>• Updates: {selectedCampaign.updates.length}</p>
                  <p>• Goal: ${selectedCampaign.goalAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBreakdown(false)}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => handleApproveCampaign(selectedCampaign._id)}
                disabled={verifyLoading}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifyLoading ? <i className="fa-solid fa-spinner fa-spin mr-2" /> : null}
                Approve
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={verifyLoading}
                className="flex-1 py-2 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Reject Campaign</h3>
            <p className="text-slate-600 text-sm mb-4">Are you sure you want to reject "{selectedCampaign.title}"?</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">Rejection Reason (Optional)</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., High fraud score detected. Campaign shows multiple red flags."
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={verifyLoading}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectCampaign(selectedCampaign._id)}
                disabled={verifyLoading}
                className="flex-1 py-2 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifyLoading ? <i className="fa-solid fa-spinner fa-spin mr-2" /> : null}
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {showAiModal && selectedCampaign && aiResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <i className="fa-solid fa-robot text-blue-600" />
                  🤖 AI Fraud Analysis
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">HuggingFace BART</span>
                </h3>
                <p className="text-sm text-slate-500 mt-1">Campaign: {selectedCampaign.title}</p>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <i className="fa-solid fa-xmark text-xl" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* AI Score Summary */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-blue-900 flex items-center gap-2">
                    <i className="fa-solid fa-brain text-blue-600" />
                    Overall Fraud Score
                  </span>
                  <span className={`text-3xl font-bold ${
                    aiResult.fraudScore >= 70 ? 'text-rose-600' : 
                    aiResult.fraudScore >= 40 ? 'text-amber-600' : 
                    'text-emerald-600'
                  }`}>
                    {aiResult.fraudScore}
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      aiResult.fraudScore >= 70 ? 'bg-rose-500' : 
                      aiResult.fraudScore >= 40 ? 'bg-amber-500' : 
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${aiResult.fraudScore}%` }}
                  />
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  {aiResult.fraudScore >= 70 ? '🔴 High Risk - Requires review' : 
                   aiResult.fraudScore >= 40 ? '🟡 Medium Risk - Monitor closely' : 
                   '🟢 Low Risk - Generally safe'}
                </p>
              </div>

              {/* Rule-Based Scoring */}
              {aiResult.breakdown && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <i className="fa-solid fa-list" />
                    Rule-Based Detection (Scoring)
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className={`p-3 rounded-lg border-2 ${aiResult.breakdown.rule1_shortDescription > 0 ? 'bg-rose-50 border-rose-300' : 'bg-emerald-50 border-emerald-300'}`}>
                      <span className="text-xs text-slate-600 block mb-1">📝 Description Length</span>
                      <p className={`font-bold text-lg ${aiResult.breakdown.rule1_shortDescription > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        +{aiResult.breakdown.rule1_shortDescription}
                      </p>
                      <span className="text-xs text-slate-500">({aiResult.descriptionLength} chars)</span>
                    </div>

                    <div className={`p-3 rounded-lg border-2 ${aiResult.breakdown.rule2_highGoalNoUpdates > 0 ? 'bg-rose-50 border-rose-300' : 'bg-emerald-50 border-emerald-300'}`}>
                      <span className="text-xs text-slate-600 block mb-1">💰 High Goal + No Updates</span>
                      <p className={`font-bold text-lg ${aiResult.breakdown.rule2_highGoalNoUpdates > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        +{aiResult.breakdown.rule2_highGoalNoUpdates}
                      </p>
                    </div>

                    <div className={`p-3 rounded-lg border-2 ${aiResult.breakdown.rule3_noImages > 0 ? 'bg-rose-50 border-rose-300' : 'bg-emerald-50 border-emerald-300'}`}>
                      <span className="text-xs text-slate-600 block mb-1">🖼️ Images</span>
                      <p className={`font-bold text-lg ${aiResult.breakdown.rule3_noImages > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        +{aiResult.breakdown.rule3_noImages}
                      </p>
                      <span className="text-xs text-slate-500">{aiResult.hasImages ? '✅ Present' : '❌ Missing'}</span>
                    </div>

                    <div className={`p-3 rounded-lg border-2 ${aiResult.breakdown.rule4_suspiciousKeywords > 0 ? 'bg-rose-50 border-rose-300' : 'bg-emerald-50 border-emerald-300'}`}>
                      <span className="text-xs text-slate-600 block mb-1">⚠️ Suspicious Keywords</span>
                      <p className={`font-bold text-lg ${aiResult.breakdown.rule4_suspiciousKeywords > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        +{aiResult.breakdown.rule4_suspiciousKeywords}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Model Score - Highlighted */}
              {aiResult.breakdown && (
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-purple-400 rounded-lg">
                  <h5 className="text-sm font-bold text-purple-900 mb-2 flex items-center gap-2">
                    <i className="fa-solid fa-wand-magic-sparkles text-purple-600" />
                    AI Model Analysis (HuggingFace BART)
                  </h5>
                  <p className="text-xs text-purple-700 mb-2">
                    Natural Language Processing analysis of campaign description
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-purple-600">+{aiResult.breakdown.aiScore}</span>
                    <span className="text-sm text-purple-600">(max 100 points)</span>
                  </div>
                  <p className="text-xs text-purple-600 mt-2">
                    {aiResult.breakdown.aiScore > 0 ? '⚠️ Detected potential fraud indicators in text' : '✅ No fraud indicators detected by AI'}
                  </p>
                </div>
              )}

              {/* Campaign Details */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h5 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <i className="fa-solid fa-chart-bar" />
                  Campaign Metrics
                </h5>
                <div className="text-sm text-slate-700 space-y-2">
                  <div className="flex justify-between">
                    <span>📝 Description Length:</span>
                    <strong>{aiResult.descriptionLength} characters</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>🖼️ Images:</span>
                    <strong>{aiResult.hasImages ? '✅ Yes' : '❌ No'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>📰 Updates:</span>
                    <strong>{aiResult.hasUpdates ? '✅ Yes' : '❌ No'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>🎯 Goal Amount:</span>
                    <strong>${aiResult.goalAmount ? (aiResult.goalAmount).toLocaleString() : 'N/A'}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAiModal(false)}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowAiModal(false);
                  handleViewDetails(selectedCampaign);
                }}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-check" />
                Approve / Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
