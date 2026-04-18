// routes/donationTrackingRoutes.js
import express from 'express';
const router = express.Router();

import {
  getUserDonationHistory,
  getCampaignDonations,
  getDonationReceipt,
} from '../controllers/donationTrackingController.js';

import protect from '../middleware/authMiddleware.js';

// All routes require login
router.use(protect);

// 1. Donor sees their own donation history
router.get('/history', getUserDonationHistory);

// 2. Campaign-level tracking (all donations for one campaign)
router.get('/campaign/:campaignId', getCampaignDonations);

// 3. View single donation receipt
router.get('/receipt/:id', getDonationReceipt);

export default router;   // ← THIS LINE IS VERY IMPORTANT