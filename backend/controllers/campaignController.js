// controllers/campaignController.js
import Campaign from "../models/Campaign.js";
import Category from "../models/Category.js";
import Tag from "../models/Tag.js";
import User from "../models/User.js";
import Donation from "../models/Donation.js";
import Notification from "../models/Notification.js";
import logger from "../utils/logger.js";
import { createNotification } from "../services/notificationService.js";

const isCampaignVisibleToRequester = (campaign, user) => {
  if (!campaign?.adminPaused) return true;
  const requesterId = user?._id?.toString();
  const fundraiserId =
    campaign.fundraiser?._id?.toString?.() ?? String(campaign.fundraiser);
  const isOwner = !!requesterId && requesterId === fundraiserId;
  const isAdmin = user?.role === "admin";
  return isOwner || isAdmin;
};

export const createCampaign = async (req, res) => {
  try {
    // Add detailed logging to diagnose the issue
    logger.info(
      `[CREATE CAMPAIGN] User: ${req.user?._id}, Body keys: ${Object.keys(req.body || {}).join(", ")}`,
    );

    // ✅ ULTRA DETAILED LOGGING
    logger.info(`[CREATE CAMPAIGN] FULL req.body:`, JSON.stringify(req.body, null, 2));
    logger.info(`[CREATE CAMPAIGN] Number of files: ${req.files ? req.files.length : 0}`);

    // Check if user exists
    if (!req.user) {
      logger.error(
        "[CREATE CAMPAIGN] User not authenticated - req.user is undefined",
      );
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const { title, category, tags, description, goalAmount, endDate } =
      req.body ?? {};

    // ✅ DEBUG: Log raw values (not just existence)
    logger.info(`[CREATE CAMPAIGN] Raw values - title: "${title}", category: "${category}", description length: ${description?.length || 0}, goalAmount: "${goalAmount}", endDate: "${endDate}", tags: "${tags}"`);

    // ✅ Fetch VALID categories from database instead of hardcoding
    const dbCategories = await Category.find({ active: true });
    const VALID_CATEGORIES = dbCategories.map(c => c.label);
    
    logger.info(`[CREATE CAMPAIGN] Valid categories from DB: ${VALID_CATEGORIES.join(', ')}`);
    logger.info(`[CREATE CAMPAIGN] User-provided category: "${category}"`);

    const normalizedCategory = category ? VALID_CATEGORIES.find(c => c.toLowerCase() === category.toLowerCase()) : null;

    logger.info(`[CREATE CAMPAIGN] Normalized category: "${normalizedCategory}"`);

    // Validate all required fields
    if (!title || !normalizedCategory || !description || !goalAmount || !endDate) {
      logger.warn(
        `[CREATE CAMPAIGN] Missing fields - title: ${!!title}, category: ${!!normalizedCategory}, description: ${!!description}, goalAmount: ${!!goalAmount}, endDate: ${!!endDate}`,
      );
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Missing required fields: title, category, description, goalAmount, endDate",
        });
    }

    // Check if user is fundraiser
    if (req.user.role !== "fundraiser") {
      logger.warn(
        `[CREATE CAMPAIGN] User role is ${req.user.role}, not fundraiser`,
      );
      return res
        .status(403)
        .json({
          success: false,
          message: "Only fundraisers can create campaigns",
        });
    }

    // ✅ BACKEND SAFETY: Validate tag labels by fetching from database
    const dbTags = await Tag.find();
    const VALID_TAG_LABELS = dbTags.map(t => t.label);
    
    logger.info(`[CREATE CAMPAIGN] Valid tags from DB: ${VALID_TAG_LABELS.join(', ')}`);
    
    let parsedTags = [];
    
    if (tags && typeof tags === 'string') {
      parsedTags = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0 && VALID_TAG_LABELS.includes(t));
      
      logger.info(`[CREATE CAMPAIGN] Parsed tags: ${parsedTags.join(', ')}`);
    }

    // Handle file uploads from multer - stores in req.files array
    let images = [];

    // Case 1: Uploaded files
    if (req.files && req.files.length > 0) {
      images = req.files
        .map((f) => f.path || f.secure_url || f.url || '')
        .filter(Boolean);
    }

    // Case 2: Image URL
    if (req.body.imageUrl) {
      images.push(req.body.imageUrl);
    }
    logger.info(`[CREATE CAMPAIGN] Images uploaded: ${images.length}`);

    const campaign = new Campaign({
      title,
      category: normalizedCategory,  // Use validated, normalized category
      tags: parsedTags,  // Use validated tag labels
      description,
      images,
      goalAmount: Number(goalAmount),
      endDate: new Date(endDate),
      fundraiser: req.user._id,
      verified: false,
    });

    await campaign.save();

    logger.info(
      `[CREATE CAMPAIGN] Campaign created successfully: ${campaign._id}`,
    );
    res.status(201).json({
      success: true,
      message: "Campaign created successfully",
      campaign,
    });
  } catch (err) {
    logger.error(`[CREATE CAMPAIGN] Error: ${err.message || "Unknown error"}`);
    logger.error(`[CREATE CAMPAIGN] Stack: ${err.stack}`);
    logger.error("🔥 FULL ERROR:", err); // ✅ ADD THIS

    res.status(500).json({
      success: false,
      message: err.message || "Failed to create campaign",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

export const getCampaigns = async (req, res) => {
  try {
    const {
      search, // keyword search
      category,
      location,
      minGoal,
      maxGoal,
      minProgress, 
      sort, 
      tags, // NEW: comma-separated tags to filter by (e.g., tags=Featured or tags=Featured,Urgent)
      recommendation = false, // NEW: ?recommendation=true for personalized mode
    } = req.query;

    const query = { verified: true, adminPaused: { $ne: true } }; // Verified & not admin-restricted

    // 1. Keyword Search (title + description + location + category) – ENHANCED
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    // 2. Filter by Category – PAST FEATURE
    if (category) query.category = category;

    // 3. Filter by Tags – NEW FEATURE
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      if (tagArray.length > 0) {
        // $in means the campaign tags should contain at least one of the requested tags
        query.tags = { $in: tagArray };
      }
    }

    // 4. Filter by Location – PAST FEATURE
    if (location) query.location = { $regex: location, $options: "i" };

    // 4. Filter by Target Amount (Goal) – PAST FEATURE
    if (minGoal)
      query.goalAmount = { ...query.goalAmount, $gte: Number(minGoal) };
    if (maxGoal)
      query.goalAmount = { ...query.goalAmount, $lte: Number(maxGoal) };

    // Build base query – PAST FEATURE
    let campaignsQuery = Campaign.find(query)
      .populate("fundraiser", "username email profilePicture")
      .select("-__v");

    // 5. Sort Options – PAST FEATURE
    switch (sort) {
      case "newest":
        campaignsQuery = campaignsQuery.sort({ createdAt: -1 });
        break;
      case "oldest":
        campaignsQuery = campaignsQuery.sort({ createdAt: 1 });
        break;
      case "popular":
        campaignsQuery = campaignsQuery.sort({ donorCount: -1 });
        break;
      case "progress":
        campaignsQuery = campaignsQuery.sort({ raisedAmount: -1 }); // Higher progress first
        break;
      default:
        campaignsQuery = campaignsQuery.sort({ createdAt: -1 });
    }

    let campaigns = await campaignsQuery;

    // 6. Filter by Progress (post-query because it's a virtual field) – PAST FEATURE
    let filteredCampaigns = campaigns;
    if (minProgress) {
      filteredCampaigns = campaigns.filter(
        (c) => c.progress >= Number(minProgress),
      );
    }

    // === NEW: Personalized Recommendation Mode (Feature 12) ===
    if (recommendation === "true" && req.user) {
      const user = await User.findById(req.user._id);
      if (user && user.interests?.length > 0) {
        // Boost campaigns matching user's interests
        const interestBoost = filteredCampaigns.filter((c) =>
          user.interests.includes(c.category),
        );

        // Add fallback: non-matching but popular/recent
        const fallback = filteredCampaigns
          .filter((c) => !user.interests.includes(c.category))
          .sort((a, b) => b.donorCount - a.donorCount) // popular first
          .slice(0, 10); // limit fallback

        filteredCampaigns = [...interestBoost, ...fallback];
      }
    }

    res.json({
      success: true,
      count: filteredCampaigns.length,
      recommendationMode: recommendation === "true",
      campaigns: filteredCampaigns,
    });
  } catch (error) {
    logger.error("Advanced search / recommendation error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get current user's campaigns
export const getUserCampaigns = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const fundraiserId = req.user._id;
    const campaigns = await Campaign.find({ fundraiser: fundraiserId })
      .populate("fundraiser", "username email profilePicture")
      .sort({ createdAt: -1 });

    res.json({ success: true, campaigns });
  } catch (error) {
    logger.error("Error getting user campaigns:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate(
      "fundraiser",
      "username email profilePicture",
    );
    if (!campaign)
      return res.status(404).json({ success: false, message: "Campaign not found" });

    if (campaign.adminPaused) {
      const uid = req.user?._id?.toString();
      const fundraiserId = campaign.fundraiser?._id?.toString?.() ?? String(campaign.fundraiser);
      const isOwner = uid && fundraiserId && uid === fundraiserId;
      const isAdmin = req.user?.role === "admin";
      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          restricted: true,
          message:
            "This campaign has been temporarily restricted by the platform and is not visible to the public.",
        });
      }
    }

    res.json({ success: true, campaign });
  } catch (err) {
    console.error('Error getting campaign:', err);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: err.message 
    });
  }
};

export const getTopCampaignDonations = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate(
      "fundraiser",
      "username email",
    );
    if (!campaign) {
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found" });
    }

    if (!isCampaignVisibleToRequester(campaign, req.user)) {
      return res.status(403).json({
        success: false,
        restricted: true,
        message:
          "This campaign has been temporarily restricted by the platform and is not visible to the public.",
      });
    }

    const donations = await Donation.find({
      campaign: campaign._id,
      status: "completed",
    })
      .populate("donor", "username name email profilePicture")
      .sort({ amount: -1, timestamp: -1 })
      .limit(5);

    const formatted = donations.map((d) => {
      const donorName =
        d.donor?.name || d.donor?.username || d.donor?.email || "Anonymous";
      return {
        _id: d._id,
        id: d._id.toString(),
        amount: d.amount,
        verified: d.status === "completed",
        donorName,
        donorAvatar:
          d.donor?.profilePicture ||
          `https://i.pravatar.cc/150?u=${encodeURIComponent(d.donor?._id?.toString() || donorName)}`,
        timestamp: d.timestamp || d.createdAt,
      };
    });

    res.json({ success: true, donations: formatted });
  } catch (error) {
    logger.error("Error getting top campaign donations:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getRecentCampaignDonations = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate(
      "fundraiser",
      "username email",
    );
    if (!campaign) {
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found" });
    }

    if (!isCampaignVisibleToRequester(campaign, req.user)) {
      return res.status(403).json({
        success: false,
        restricted: true,
        message:
          "This campaign has been temporarily restricted by the platform and is not visible to the public.",
      });
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 5, 1), 20);
    const donations = await Donation.find({
      campaign: campaign._id,
      status: "completed",
    })
      .populate("donor", "username name email profilePicture")
      .sort({ timestamp: -1, createdAt: -1 })
      .limit(limit);

    const formatted = donations.map((d) => {
      const donorName =
        d.donor?.name || d.donor?.username || d.donor?.email || "Anonymous";
      return {
        _id: d._id,
        id: d._id.toString(),
        amount: d.amount,
        verified: d.status === "completed",
        donorName,
        donorAvatar:
          d.donor?.profilePicture ||
          `https://i.pravatar.cc/150?u=${encodeURIComponent(d.donor?._id?.toString() || donorName)}`,
        timestamp: d.timestamp || d.createdAt,
      };
    });

    res.json({ success: true, donations: formatted });
  } catch (error) {
    logger.error("Error getting recent campaign donations:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getCampaignComments = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate("fundraiser", "username email")
      .populate("comments.user", "username name email profilePicture");
    if (!campaign) {
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found" });
    }

    if (!isCampaignVisibleToRequester(campaign, req.user)) {
      return res.status(403).json({
        success: false,
        restricted: true,
        message:
          "This campaign has been temporarily restricted by the platform and is not visible to the public.",
      });
    }

    const fundraiserId =
      campaign.fundraiser?._id?.toString?.() ?? String(campaign.fundraiser);
    const comments = (campaign.comments || [])
      .map((c) => {
        const commenterId = c.user?._id?.toString?.() ?? String(c.user);
        const userName =
          c.user?.name || c.user?.username || c.user?.email || "Anonymous";
        return {
          _id: c._id,
          id: c._id.toString(),
          text: c.text,
          createdAt: c.createdAt,
          userId: commenterId,
          userName,
          userAvatar:
            c.user?.profilePicture ||
            `https://i.pravatar.cc/150?u=${encodeURIComponent(commenterId || userName)}`,
          isOwner: commenterId === fundraiserId,
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, comments });
  } catch (error) {
    logger.error("Error getting campaign comments:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const addCampaignComment = async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();
    if (!text) {
      return res
        .status(400)
        .json({ success: false, message: "Comment text is required" });
    }

    const campaign = await Campaign.findById(req.params.id).populate(
      "fundraiser",
      "username email",
    );
    if (!campaign) {
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found" });
    }

    if (!isCampaignVisibleToRequester(campaign, req.user)) {
      return res.status(403).json({
        success: false,
        restricted: true,
        message:
          "This campaign has been temporarily restricted by the platform and is not visible to the public.",
      });
    }

    campaign.comments.push({
      user: req.user._id,
      text,
      createdAt: new Date(),
    });
    await campaign.save();

    const userName = req.user?.name || req.user?.username || req.user?.email || "Anonymous";
    const fundraiserId =
      campaign.fundraiser?._id?.toString?.() ?? String(campaign.fundraiser);
    const requesterId = req.user?._id?.toString?.() ?? "";
    const latestComment = campaign.comments[campaign.comments.length - 1];

    res.status(201).json({
      success: true,
      comment: {
        _id: latestComment._id,
        id: latestComment._id.toString(),
        text: latestComment.text,
        createdAt: latestComment.createdAt,
        userId: requesterId,
        userName,
        userAvatar:
          req.user?.profilePicture ||
          `https://i.pravatar.cc/150?u=${encodeURIComponent(requesterId || userName)}`,
        isOwner: requesterId === fundraiserId,
      },
    });
  } catch (error) {
    logger.error("Error adding campaign comment:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign)
      return res.status(404).json({ success: false, message: "Not found" });

    if (
      campaign.fundraiser.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    Object.assign(campaign, req.body);
    if (req.files?.length) {
      campaign.images = req.files
        .map((f) => f.path || f.secure_url || f.url || '')
        .filter(Boolean);
    }

    await campaign.save();
    res.json({ success: true, campaign });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign)
      return res.status(404).json({ success: false, message: "Not found" });

    if (
      campaign.fundraiser.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    await campaign.deleteOne();
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Fundraiser marks campaign complete. Campaign and its donations are removed;
 * lifetime stats: always +1 completed campaign and preserved raised; supporter (completed) total
 * only increases when the funding goal was reached at completion time.
 */
export const completeCampaign = async (req, res) => {
  try {
    if (req.user.role !== "fundraiser") {
      return res.status(403).json({
        success: false,
        message: "Only fundraisers can mark a campaign complete.",
      });
    }

    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }
    if (campaign.fundraiser.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only complete your own campaigns.",
      });
    }

    const donorCountSnapshot = Math.max(0, campaign.donorCount || 0);
    const raisedSnapshot = Math.max(0, Number(campaign.raisedAmount) || 0);
    const goalAmount = Math.max(0, Number(campaign.goalAmount) || 0);
    const goalReached = goalAmount > 0 && raisedSnapshot >= goalAmount;

    const userInc = {
      completedCampaignsCount: 1,
      fundraiserLifetimeRaised: raisedSnapshot,
    };
    if (goalReached) {
      userInc.completedCampaignDonorsTotal = donorCountSnapshot;
    }

    await User.findByIdAndUpdate(req.user._id, { $inc: userInc });

    const titleSnapshot = campaign.title;

    await Notification.deleteMany({ campaign: campaign._id });
    await Donation.deleteMany({ campaign: campaign._id });
    await Campaign.deleteOne({ _id: campaign._id });

    await createNotification(
      req.user._id,
      "system",
      "Campaign completed",
      `"${titleSnapshot}" has been removed from the platform.`,
      null,
    );

    logger.info(
      `[COMPLETE] Fundraiser ${req.user._id} completed & deleted campaign ${req.params.id} (goalReached=${goalReached}, donors recorded toward supporter total: ${goalReached ? donorCountSnapshot : 0}, raised preserved: ${raisedSnapshot})`,
    );

    res.json({
      success: true,
      message: "Campaign marked complete and removed from the platform.",
      summary: {
        goalReached,
        donorCountRecorded: goalReached ? donorCountSnapshot : 0,
      },
    });
  } catch (err) {
    logger.error("completeCampaign error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const addUpdate = async (req, res) => {
  try {
    const title = String(req.body?.title || "Campaign update").trim();
    const content = String(req.body?.content || "").trim();
    if (!content) {
      return res
        .status(400)
        .json({ success: false, message: "Update content is required" });
    }
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign)
      return res.status(404).json({ success: false, message: "Not found" });

    if (campaign.fundraiser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // ← Your original functionality (unchanged)
    campaign.updates.push({
      title: title || "Campaign update",
      content,
      postedBy: req.user._id,
      postedAt: new Date(),
    });
    await campaign.save();

    // === NEW: Feature 9 - Campaign Update Alerts ===
    const donations = await Donation.find({ campaign: campaign._id }).populate(
      "donor",
    );

    for (const donation of donations) {
      await createNotification(
        donation.donor._id,
        "campaign_update",
        "New Update from Campaign",
        `${campaign.title}: ${title}`,
        campaign._id,
      );
    }

    res.json({ success: true, campaign });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ===== ADMIN FUNCTIONS FOR CAMPAIGN APPROVAL/REJECTION =====

/**
 * Get all campaigns (for admin dashboard)
 * Fetches campaigns with all statuses for admin review
 */
export const getAllCampaigns = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can access this' });
    }

    const { status, search } = req.query;
    const query = {};

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // Filter by search term (title or fundraiser name)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
      ];
    }

    const campaigns = await Campaign.find(query)
      .populate('fundraiser', 'username email name profilePicture')
      .populate('verifiedBy', 'username name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      campaigns,
    });
  } catch (error) {
    logger.error('Error getting all campaigns:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get admin dashboard counts
 */
export const getAdminDashboardStats = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can access this' });
    }

    const pendingReviewCount = await Campaign.countDocuments({
      verified: false,
      status: 'pending',
    });
    const activeCampaignsCount = await Campaign.countDocuments({
      verified: true,
      adminPaused: { $ne: true },
    });
    const totalUsersCount = await User.countDocuments();
    const reportsCount = await Campaign.countDocuments({ status: 'rejected' });

    res.json({
      success: true,
      pendingReviewCount,
      activeCampaignsCount,
      totalUsersCount,
      reportsCount,
    });
  } catch (error) {
    logger.error('Error getting admin dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Approve a campaign (admin only)
 */
export const approveCampaign = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can approve campaigns' });
    }

    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        verified: true,
        adminPaused: false,
        verifiedBy: req.user._id,
        verifiedAt: new Date(),
        rejectionReason: null,
      },
      { new: true, runValidators: false } // Avoid full validation on unchanged fields
    );

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    logger.info(`[ADMIN] Campaign ${campaign._id} approved by ${req.user.username}`);

    res.json({
      success: true,
      message: 'Campaign approved successfully',
      campaign,
    });
  } catch (error) {
    logger.error('Error approving campaign:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Reject a campaign (admin only)
 */
export const rejectCampaign = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can reject campaigns' });
    }

    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        verified: false,
        adminPaused: false,
        verifiedBy: req.user._id,
        verifiedAt: new Date(),
        rejectionReason: reason,
      },
      { new: true, runValidators: false } // Avoid full validation on unchanged fields
    );

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    logger.info(`[ADMIN] Campaign ${campaign._id} rejected by ${req.user.username} - Reason: ${reason}`);

    res.json({
      success: true,
      message: 'Campaign rejected successfully',
      campaign,
    });
  } catch (error) {
    logger.error('Error rejecting campaign:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Pause or resume a verified campaign (admin only). Paused campaigns are hidden from public listings and cannot receive donations.
 */
export const setCampaignPaused = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can pause campaigns' });
    }

    const { paused } = req.body;
    if (typeof paused !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Body must include paused: true or false' });
    }

    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    if (!campaign.verified || campaign.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Only verified campaigns that are not rejected can be paused or resumed.',
      });
    }

    campaign.adminPaused = paused;
    await campaign.save();

    logger.info(`[ADMIN] Campaign ${campaign._id} adminPaused=${paused} by ${req.user.username}`);

    res.json({
      success: true,
      message: paused ? 'Campaign paused (restricted).' : 'Campaign resumed.',
      campaign,
    });
  } catch (error) {
    logger.error('Error setting campaign paused:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
