// controllers/analyticsController.js
import Campaign from '../models/Campaign.js';
import Donation from '../models/Donation.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// ==================== FUNDRAISER ANALYTICS ====================
export const getFundraiserAnalytics = async (req, res) => {
  try {
    const fundraiserId = req.user._id;

    // Campaigns that count toward active stats (admin-paused excluded until resumed)
    const fundraiserUser = await User.findById(fundraiserId).select(
      'completedCampaignsCount completedCampaignDonorsTotal fundraiserLifetimeRaised',
    );

    const campaigns = await Campaign.find({ fundraiser: fundraiserId });
    const activeCampaigns = campaigns.filter((c) => !c.adminPaused);

    // Total raised: active campaigns + amount from completed (deleted) campaigns (never drops on complete)
    const raisedFromActiveCampaigns = activeCampaigns.reduce(
      (sum, c) => sum + (c.raisedAmount || 0),
      0,
    );
    const totalRaised =
      raisedFromActiveCampaigns + (fundraiserUser?.fundraiserLifetimeRaised || 0);
    const totalDonors = activeCampaigns.reduce((sum, c) => sum + (c.donorCount || 0), 0);
    const activeIds = activeCampaigns.map((c) => c._id);

    // Donation trends (last 30 days) — only for campaigns that are not admin-paused
    const trends = await Donation.aggregate([
      { $match: { campaign: { $in: activeIds } } },
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
        totalCampaigns: activeCampaigns.length,
        totalRaised,
        totalDonors,
        avgProgress: activeCampaigns.length
          ? (activeCampaigns.reduce((sum, c) => sum + (c.progress || 0), 0) / activeCampaigns.length).toFixed(1)
          : 0,
        completedCampaignsCount: fundraiserUser?.completedCampaignsCount || 0,
        completedCampaignDonorsTotal: fundraiserUser?.completedCampaignDonorsTotal || 0,
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
const livePublicCampaignFilter = {
  verified: true,
  adminPaused: { $ne: true },
};

export const getPlatformAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCampaigns = await Campaign.countDocuments(livePublicCampaignFilter);
    const totalRaisedLive = await Campaign.aggregate([
      { $match: livePublicCampaignFilter },
      { $group: { _id: null, total: { $sum: "$raisedAmount" } } },
    ]);
    const lifetimeRaisedAgg = await User.aggregate([
      { $group: { _id: null, total: { $sum: { $ifNull: ['$fundraiserLifetimeRaised', 0] } } } },
    ]);
    const totalRaised =
      (totalRaisedLive[0]?.total || 0) + (lifetimeRaisedAgg[0]?.total || 0);
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
        totalRaised,
        totalDonations
      },
      userGrowth,
      fraudStats: fraudStats[0] || { avgFraudScore: 0, suspicious: 0 }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getPublicAnalytics = async (req, res) => {
  try {
    const liveFilter = livePublicCampaignFilter;
    const totalCampaigns = await Campaign.countDocuments(liveFilter);
    const totalRaisedResult = await Campaign.aggregate([
      { $match: liveFilter },
      { $group: { _id: null, total: { $sum: "$raisedAmount" } } },
    ]);
    const lifetimeRaisedAgg = await User.aggregate([
      { $group: { _id: null, total: { $sum: { $ifNull: ['$fundraiserLifetimeRaised', 0] } } } },
    ]);
    const totalRaised =
      (totalRaisedResult[0]?.total || 0) + (lifetimeRaisedAgg[0]?.total || 0);
    const totalDonors = await User.countDocuments({ role: 'donor' });
    const transparency = 100;

    const completedAgg = await User.aggregate([
      { $group: { _id: null, total: { $sum: { $ifNull: ['$completedCampaignsCount', 0] } } } },
    ]);
    const completedCampaignsTotal = completedAgg[0]?.total || 0;

    res.json({
      success: true,
      overview: {
        totalCampaigns,
        totalRaised,
        totalDonors,
        transparency,
        completedCampaignsTotal,
      }
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getTransactionVolume = async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 365);
    const volume = await Donation.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          volume: { $sum: '$amount' },
          donations: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, volume });
  } catch (err) {
    logger.error('getTransactionVolume:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** Fundraiser (own) or admin: per-campaign donation totals and daily trend */
export const getCampaignAnalytics = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    const owns = campaign.fundraiser.toString() === req.user._id.toString();
    if (req.user.role === 'fundraiser' && !owns) {
      return res.status(403).json({
        success: false,
        message: 'You can only view analytics for your own campaigns',
      });
    }
    if (!['fundraiser', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const trends = await Donation.aggregate([
      { $match: { campaign: campaign._id } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          amount: { $sum: '$amount' },
          donations: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const agg = await Donation.aggregate([
      { $match: { campaign: campaign._id } },
      {
        $group: {
          _id: null,
          totalFromDonations: { $sum: '$amount' },
          donationCount: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
        },
      },
    ]);
    const row = agg[0];
    const donationCount = row?.donationCount || 0;
    const totalFromDonations = row?.totalFromDonations || 0;
    const avgDonation = donationCount ? Math.round(row.avgAmount || 0) : 0;

    const goal = Number(campaign.goalAmount) || 0;
    const raised = Number(campaign.raisedAmount) || 0;
    const progressPct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

    res.json({
      success: true,
      campaign: {
        id: campaign._id,
        title: campaign.title,
        raised,
        goal,
        donorCount: campaign.donorCount || 0,
        progressPct,
      },
      summary: {
        totalRaised: raised,
        donationCount,
        totalFromDonations,
        avgDonation,
      },
      trends,
    });
  } catch (err) {
    logger.error('getCampaignAnalytics:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};