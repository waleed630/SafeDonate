// controllers/verificationController.js
import Campaign from '../models/Campaign.js';
import logger from '../utils/logger.js';
import axios from 'axios';

const HUGGINGFACE_TOKEN = process.env.HUGGINGFACE_TOKEN;

// AI Fraud Detection using Open-Source Hugging Face Model
const getAIFraudScore = async (description) => {
  if (!HUGGINGFACE_TOKEN) {
    console.warn('⚠️ HUGGINGFACE_TOKEN not configured - AI model disabled');
    return 0;
  }

  const text = String(description ?? '');
  if (!text.trim()) {
    return 0;
  }

  try {
    console.log('🤖 [AI MODEL] Starting HuggingFace BART analysis...');
    console.log('📝 [AI MODEL] Description length:', text.length, 'characters');
    
    const response = await axios.post(
     
      "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli", 
      {
        inputs: text,
        parameters: {
          candidate_labels: [
            "legitimate campaign",
            "fake story",
            "suspicious scam",
            "urgent fraud"
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_TOKEN}`,
          "Content-Type": "application/json"
        },
        timeout: 8000
      }
    );

    console.log('✅ [AI MODEL] HuggingFace response received');
    const result = response.data;

    // Case 1: HF returns array of {label, score}
    if (Array.isArray(result) && result[0]?.label) {
      let scamScore = 0;

      result.forEach(item => {
        console.log('  📌 Label:', item.label, '| Score:', item.score);
        if (
          item.label.toLowerCase().includes("scam") ||
          item.label.toLowerCase().includes("fraud")
        ) {
          scamScore = Math.max(scamScore, item.score || 0);
        }
      });

      const finalScore = Math.round(scamScore * 100);
      console.log('🎯 [AI MODEL] Final AI Score:', finalScore);
      return finalScore;
    }

    // Case 2: HF returns {labels: [], scores: []}
    if (result?.labels && result?.scores) {
      let scamScore = 0;

      result.labels.forEach((label, index) => {
        console.log('  📌 Label:', label, '| Score:', result.scores[index]);
        if (
          label.toLowerCase().includes("scam") ||
          label.toLowerCase().includes("fraud")
        ) {
          scamScore = Math.max(scamScore, result.scores[index]);
        }
      });

      const finalScore = Math.round(scamScore * 100);
      console.log('🎯 [AI MODEL] Final AI Score:', finalScore);
      return finalScore;
    }

    // Fallback if no scam/fraud labels found
    console.warn('⚠️ [AI MODEL] No fraud indicators detected');
    return 0;
  } catch (err) {
    console.error("HuggingFace ERROR:", err.response?.data || err.message);
    return 0;
  }
};
// Combined Fraud Score (Rule-based + AI)
const calculateFraudScore = async (campaign) => {
  console.log('\n📊 [FRAUD ANALYSIS] Starting fraud score calculation for:', campaign._id);
  let score = 0;

  const description = String(campaign?.description ?? '');
  const images = Array.isArray(campaign?.images) ? campaign.images : [];
  const updates = Array.isArray(campaign?.updates) ? campaign.updates : [];

  // Rule 1: Very short description
  if (description.length < 150) {
    console.log('⚠️ Rule 1 triggered: Short description (<150 chars) | +30 points');
    score += 30;
  } else {
    console.log('✅ Rule 1 passed: Description length is adequate');
  }

  // Rule 2: Unrealistically high goal with no updates
  const goalAmount = Number(campaign?.goalAmount) || 0;
  if (goalAmount > 50000 && updates.length === 0) {
    console.log('⚠️ Rule 2 triggered: High goal (>$50k) with no updates | +25 points');
    score += 25;
  } else {
    console.log('✅ Rule 2 passed: Goal/updates check passed');
  }

  // Rule 3: No images
  if (images.length === 0) {
    console.log('⚠️ Rule 3 triggered: No images | +20 points');
    score += 20;
  } else {
    console.log('✅ Rule 3 passed: Campaign has images');
  }

  // Rule 4: Suspicious keywords
  const suspiciousWords = ['urgent', 'help me', 'god bless', 'emergency', 'please help'];
  const descLower = description.toLowerCase();
  if (suspiciousWords.some(word => descLower.includes(word))) {
    console.log('⚠️ Rule 4 triggered: Suspicious keywords detected | +15 points');
    score += 15;
  } else {
    console.log('✅ Rule 4 passed: No suspicious keywords');
  }

  // AI Score (Open Source Model)
  console.log('\n🤖 [FRAUD ANALYSIS] Calling AI model for deep analysis...');
  const aiScore = await getAIFraudScore(description);
  console.log('🤖 [FRAUD ANALYSIS] AI model returned score:', aiScore);
  score += aiScore;

  const finalScore = Math.min(100, score);
  console.log('\n✅ [FRAUD ANALYSIS] Final Score:', finalScore, '(Rule-based:', score - aiScore, '+ AI:', aiScore, ')\n');
  
  return finalScore;
};

// Admin: Verify Campaign
const verifyCampaign = async (req, res) => {
  try {
    const { action, rejectionReason } = req.body;
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });

    if (action === "approve") {
      const fraudScore = await calculateFraudScore(campaign);
      campaign.verified = true;
      campaign.adminPaused = false;
      campaign.fraudScore = fraudScore;
      campaign.verifiedBy = req.user._id;
      campaign.verifiedAt = new Date();
      campaign.rejectionReason = undefined;
    } 
    else if (action === "reject") {
      campaign.verified = false;
      campaign.rejectionReason = rejectionReason || "Not approved by admin";
    } 
    else {
      return res.status(400).json({ success: false, message: "Invalid action. Use 'approve' or 'reject'" });
    }

    await campaign.save();

    res.json({
      success: true,
      message: action === "approve" ? "Campaign approved and verified" : "Campaign rejected",
      campaign
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==================== GET PENDING CAMPAIGNS (FIXED) ====================
 const getPendingCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({
      verified: false,
      status: 'pending',
    })
      .populate('fundraiser', 'username email profilePicture')
      .sort({ createdAt: -1 });

    const campaignsWithScores = await Promise.all(
      campaigns.map(async (campaign) => {
        if (!campaign.fraudScore) {
          try {
            campaign.fraudScore = await calculateFraudScore(campaign);
          } catch (err) {
            logger.warn(`Fraud score skipped for campaign ${campaign._id}:`, err?.message || err);
            campaign.fraudScore = 0;
          }
        }
        return campaign;
      })
    );

    res.json({ 
      success: true, 
      count: campaignsWithScores.length, 
      campaigns: campaignsWithScores 
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
 const testFullFraudScore = async (req, res) => {
  try {
    const { campaignId } = req.params;
    console.log('\n🔍 [TEST ANALYSIS] Admin initiated AI fraud analysis for campaign:', campaignId);

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }
    
    console.log('📋 Campaign found:', campaign.title);
    const suspiciousWords = ['urgent', 'help me', 'god bless', 'emergency', 'please help'];

    const fraudScore = await calculateFraudScore(campaign);

    res.json({
      success: true,
      campaignId: campaign._id,
      title: campaign.title,
      descriptionLength: campaign.description.length,
      hasImages: campaign.images.length > 0,
      hasUpdates: campaign.updates.length > 0,
      goalAmount: campaign.goalAmount,
      fraudScore,
      breakdown: {
        rule1_shortDescription: campaign.description.length < 150 ? 30 : 0,
        rule2_highGoalNoUpdates: (campaign.goalAmount > 50000 && campaign.updates.length === 0) ? 25 : 0,
        rule3_noImages: campaign.images.length === 0 ? 20 : 0,
        rule4_suspiciousKeywords: suspiciousWords.some(word => 
          campaign.description.toLowerCase().includes(word)
        ) ? 15 : 0,
        aiScore: await getAIFraudScore(campaign.description)
      }
    });
    console.log('✅ [TEST ANALYSIS] Analysis complete, response sent to frontend\n');
  } catch (err) {
    console.error('❌ [TEST ANALYSIS] Error:', err.message);
    logger.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Test: Standalone AI fraud score (just pass description text)
 const testAIFraudScoreOnly = async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || typeof description !== 'string' || description.trim() === '') {
      return res.status(400).json({ success: false, message: "Valid description text is required" });
    }

    const aiScore = await getAIFraudScore(description);

    res.json({
      success: true,
      descriptionLength: description.length,
      aiScore,
      interpretation: aiScore > 60 ? "High suspicion (likely scam/fake)" : 
                      aiScore > 30 ? "Moderate suspicion" : 
                      "Low suspicion (likely legitimate)"
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
export { verifyCampaign, getPendingCampaigns, calculateFraudScore, getAIFraudScore, testFullFraudScore, testAIFraudScoreOnly };