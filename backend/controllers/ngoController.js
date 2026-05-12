import VerifiedNGO from '../models/VerifiedNGO.js';
import Campaign from '../models/Campaign.js';
import {
  escapeRegex,
  verifyOrganization,
  toMatchedRecord,
} from '../services/ngoVerificationService.js';
import logger from '../utils/logger.js';

export const postVerify = async (req, res) => {
  try {
    const { organization_name, registration_number } = req.body ?? {};
    const result = await verifyOrganization(organization_name, registration_number);
    res.json({
      verified: result.verified,
      verification_level: result.verification_level,
      matched_record: result.matched_record,
      message: result.message,
    });
  } catch (err) {
    logger.error('[NGO VERIFY]', err);
    res.status(500).json({ message: err.message || 'Verification failed' });
  }
};

export const searchVerifiedNgos = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) {
      return res.json({ success: true, results: [] });
    }

    const pattern = new RegExp(escapeRegex(q), 'i');
    const results = await VerifiedNGO.find({
      is_verified: true,
      $or: [{ name: pattern }, { aliases: pattern }],
    })
      .select('name aliases registration_number registry_type category website')
      .limit(15)
      .lean();

    res.json({ success: true, results });
  } catch (err) {
    logger.error('[NGO SEARCH]', err);
    res.status(500).json({ success: false, message: err.message || 'Search failed' });
  }
};

/** NGO campaigns that are not government-verified and not admin-approved as NGO */
export const getAdminNgoRequests = async (req, res) => {
  try {
    const campaigns = await Campaign.find({
      campaign_type: 'ngo',
      'ngo_verification.admin_rejected': { $ne: true },
      status: { $ne: 'rejected' },
      $nor: [
        { 'ngo_verification.level': 'government', 'ngo_verification.verified': true },
        { 'ngo_verification.level': 'admin', 'ngo_verification.verified': true },
      ],
    })
      .populate('fundraiser', 'username email profilePicture')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, campaigns });
  } catch (err) {
    logger.error('[ADMIN NGO REQUESTS]', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to load requests' });
  }
};

export const approveNgoCampaignAdmin = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }
    if (campaign.campaign_type !== 'ngo') {
      return res.status(400).json({ success: false, message: 'Not an NGO campaign' });
    }

    campaign.ngo_verification = campaign.ngo_verification || {};
    campaign.ngo_verification.verified = true;
    campaign.ngo_verification.level = 'admin';
    campaign.ngo_verification.checked_at = new Date();
    campaign.ngo_verification.registry_type = 'Manual';
    campaign.ngo_verification.admin_rejected = false;
    campaign.ngo_verification.admin_rejection_reason = undefined;

    await campaign.save();
    res.json({
      success: true,
      message: 'NGO manually verified by admin',
      campaign,
    });
  } catch (err) {
    logger.error('[ADMIN NGO APPROVE]', err);
    res.status(500).json({ success: false, message: err.message || 'Approve failed' });
  }
};

export const rejectNgoCampaignAdmin = async (req, res) => {
  try {
    const reason = String(req.body?.reason || '').trim();
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason is required' });
    }

    const campaign = await Campaign.findById(req.params.campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }
    if (campaign.campaign_type !== 'ngo') {
      return res.status(400).json({ success: false, message: 'Not an NGO campaign' });
    }

    campaign.ngo_verification = campaign.ngo_verification || {};
    campaign.ngo_verification.verified = false;
    campaign.ngo_verification.level = 'unverified';
    campaign.ngo_verification.admin_rejected = true;
    campaign.ngo_verification.admin_rejection_reason = reason;
    campaign.ngo_verification.checked_at = new Date();

    await campaign.save();
    res.json({ success: true, message: 'NGO verification rejected', campaign });
  } catch (err) {
    logger.error('[ADMIN NGO REJECT]', err);
    res.status(500).json({ success: false, message: err.message || 'Reject failed' });
  }
};

export const addVerifiedNgoFromAdmin = async (req, res) => {
  try {
    const {
      name,
      aliases,
      registration_number,
      registry_type,
      category,
      website,
    } = req.body ?? {};

    if (!name || !registration_number || !registry_type) {
      return res.status(400).json({
        success: false,
        message: 'name, registration_number, and registry_type are required',
      });
    }

    const allowed = ['SECP', 'PCP', 'Provincial', 'Manual'];
    if (!allowed.includes(registry_type)) {
      return res.status(400).json({ success: false, message: 'Invalid registry_type' });
    }

    const aliasList = Array.isArray(aliases)
      ? aliases.map((a) => String(a).trim()).filter(Boolean)
      : String(aliases || '')
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean);

    const doc = await VerifiedNGO.create({
      name: String(name).trim(),
      aliases: aliasList,
      registration_number: String(registration_number).trim(),
      registry_type,
      category: String(category || '').trim(),
      website: String(website || '').trim(),
      is_verified: true,
      verified_at: new Date(),
      added_by: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Organization added to verified registry',
      ngo: toMatchedRecord(doc),
    });
  } catch (err) {
    logger.error('[ADMIN ADD NGO]', err);
    res.status(500).json({ success: false, message: err.message || 'Could not add NGO' });
  }
};
