// controllers/analyticsController.js
import Campaign from '../models/Campaign.js';
import Donation from '../models/Donation.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// ==================== FUNDRAISER ANALYTICS ====================
export const getFundraiserAnalytics = async (req, res) => {
  try {
    const fundraiserId = req.user._id;

    // All campaigns of this fundraiser
    const campaigns = await Campaign.find({ fundraiser: fundraiserId });

    // Total raised, total donors, avg progress
    const totalRaised = campaigns.reduce((sum, c) => sum + c.raisedAmount, 0);
    const totalDonors = campaigns.reduce((sum, c) => sum + c.donorCount, 0);

    // Donation trends (last 30 days)
    const trends = await Donation.aggregate([
      { $match: { campaign: { $in: campaigns.map(c => c._id) } } },
      { 
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          amount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      overview: {
        totalCampaigns: campaigns.length,
        totalRaised,
        totalDonors,
        avgProgress: campaigns.length ? 
          (campaigns.reduce((sum, c) => sum + c.progress, 0) / campaigns.length).toFixed(1) : 0
      },
      trends,
      campaigns: campaigns.map(c => ({
        id: c._id,
        title: c.title,
        raised: c.raisedAmount,
        goal: c.goalAmount,
        progress: c.progress,
        donors: c.donorCount
      }))
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==================== ADMIN ANALYTICS ====================
export const getPlatformAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCampaigns = await Campaign.countDocuments();
    const totalRaised = await Campaign.aggregate([{ $group: { _id: null, total: { $sum: "$raisedAmount" } } }]);
    const totalDonations = await Donation.countDocuments();

    // User growth (last 30 days)
    const userGrowth = await User.aggregate([
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Fraud stats
    const fraudStats = await Campaign.aggregate([
      { $group: { _id: null, avgFraudScore: { $avg: "$fraudScore" }, suspicious: { $sum: { $cond: [{ $gt: ["$fraudScore", 50] }, 1, 0] } } } }
    ]);

    res.json({
      success: true,
      platform: {
        totalUsers,
        totalCampaigns,
        totalRaised: totalRaised[0]?.total || 0,
        totalDonations
      },
      userGrowth,
      fraudStats: fraudStats[0] || { avgFraudScore: 0, suspicious: 0 }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getTransactionVolume = async (req, res) => {
  const volume = await Donation.aggregate([
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }, volume: { $sum: "$amount" } } },
    { $sort: { _id: 1 } }
  ]);

  res.json({ success: true, volume });
};