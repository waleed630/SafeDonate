// controllers/verificationController.js
import Campaign from '../models/Campaign.js';
import logger from '../utils/logger.js';
import axios from 'axios';

const HUGGINGFACE_TOKEN = process.env.HUGGINGFACE_TOKEN;

// AI Fraud Detection using Open-Source Hugging Face Model
const getAIFraudScore = async (description) => {
  if (!HUGGINGFACE_TOKEN) return 0;

  try {
    const response = await axios.post(
     
      "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli", 
      {
        inputs: description,
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

   const result = response.data;

// Case 1: HF returns array of {label, score}
if (Array.isArray(result) && result[0]?.label) {
  let scamScore = 0;

  result.forEach(item => {
    if (
      item.label.toLowerCase().includes("scam") ||
      item.label.toLowerCase().includes("fraud")
    ) {
      scamScore = Math.max(scamScore, item.score || 0);
    }
  });

  return Math.round(scamScore * 100);
}

// Case 2: HF returns {labels: [], scores: []}
if (result?.labels && result?.scores) {
  let scamScore = 0;

  result.labels.forEach((label, index) => {
    if (
      label.toLowerCase().includes("scam") ||
      label.toLowerCase().includes("fraud")
    ) {
      scamScore = Math.max(scamScore, result.scores[index]);
    }
  });

  return Math.round(scamScore * 100);
}

// Fallback
console.error("Invalid HF response:", result);
return 0;

// let scamScore = 0;

// labels.forEach((label, index) => {
  // if (
    // label.toLowerCase().includes("scam") ||
    // label.toLowerCase().includes("fraud")
  // ) {
    // scamScore = Math.max(scamScore, scores[index]);
  // }
// });

    return Math.round(scamScore * 100);

  } catch (err) {
    console.error("HuggingFace ERROR:", err.response?.data || err.message);
    return 0;
  }
};
// Combined Fraud Score (Rule-based + AI)
const calculateFraudScore = async (campaign) => {
  let score = 0;

  // Rule 1: Very short description
  if (campaign.description.length < 150) score += 30;

  // Rule 2: Unrealistically high goal with no updates
  if (campaign.goalAmount > 50000 && campaign.updates.length === 0) score += 25;

  // Rule 3: No images
  if (campaign.images.length === 0) score += 20;

  // Rule 4: Suspicious keywords
  const suspiciousWords = ['urgent', 'help me', 'god bless', 'emergency', 'please help'];
  const descLower = campaign.description.toLowerCase();
  if (suspiciousWords.some(word => descLower.includes(word))) score += 15;

  // AI Score (Open Source Model)
  const aiScore = await getAIFraudScore(campaign.description);
  score += aiScore;

  return Math.min(100, score);
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
    // This is the cleanest and most reliable query
    const campaigns = await Campaign.find({ 
     verified: false    // ← This excludes all campaigns where verified = true
    })
      .populate('fundraiser', 'username email')
      .sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      count: campaigns.length, 
      campaigns 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
 const testFullFraudScore = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }
    const suspiciousWords = ['urgent', 'help me', 'god bless', 'emergency', 'please help'];

    const fraudScore = await calculateFraudScore(campaign);

    res.json({
      success: true,
      campaignId: campaign._id,
      title: campaign.title,
      descriptionLength: campaign.description.length,
      hasImages: campaign.images.length > 0,
      hasUpdates: campaign.updates.length > 0,
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
  } catch (err) {
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