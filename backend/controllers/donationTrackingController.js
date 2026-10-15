// controllers/donationTrackingController.js
import Donation from '../models/Donation.js';
import Campaign from '../models/Campaign.js';
import logger from '../utils/logger.js';

// 1. Donation History per User (Donor)
export const getUserDonationHistory = async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user._id })
      .populate('campaign', 'title category images')
      .sort({ timestamp: -1 });

    res.json({
      success: true,
      count: donations.length,
      donations,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 2. Campaign-level Tracking (All donations for a campaign)
export const getCampaignDonations = async (req, res) => {
  try {
    // Full donor list (with emails) is only for the campaign owner and admins
    const campaign = await Campaign.findById(req.params.campaignId).select('fundraiser');
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }
    const isOwner = String(campaign.fundraiser) === String(req.user._id);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const donations = await Donation.find({ campaign: req.params.campaignId })
      .populate('donor', 'username email')
      .sort({ timestamp: -1 });

    res.json({
      success: true,
      count: donations.length,
      totalRaised: donations
        .filter((d) => d.status === 'completed')
        .reduce((sum, d) => sum + d.amount, 0),
      donations,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 3. Donation Receipt View (Single donation)
export const getDonationReceipt = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('campaign', 'title')
      .populate('donor', 'username email');

    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });

    // Only donor or admin can view receipt. `donor` is populated, so compare its _id
    // (guest donations have no donor at all).
    const donorId = donation.donor?._id?.toString();
    if (donorId !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({
      success: true,
      receipt: {
        donationId: donation._id,
        timestamp: donation.timestamp,
        amount: donation.amount,
        status: donation.status,
        campaignTitle: donation.campaign?.title || 'Campaign',
        donorName: donation.donor?.username || 'Guest',
        stripeReceiptUrl: donation.receiptUrl,   // Direct link to Stripe receipt
        paymentIntentId: donation.stripePaymentIntentId,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};