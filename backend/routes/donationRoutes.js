// routes/donationRoutes.js
import express from 'express';
const router = express.Router();

import { createDonationSession, getDonationHistory, getRecentDonations,getDonationsByCampaign,  getAllDonations, verifyDonation } from '../controllers/donationController.js';
import { stripeWebhook } from '../controllers/webhookController.js';
import protect from '../middleware/authMiddleware.js';
import restrictTo from '../middleware/role.js';

// Public live donations feed
router.get('/live', getRecentDonations);
router.get('/campaign/:campaignId', getDonationsByCampaign);
router.post('/donate', createDonationSession);
router.get('/verify', verifyDonation);

// Protected routes
router.use(protect);
router.get('/history', restrictTo('donor'), getDonationHistory);
router.get('/recent', restrictTo('admin'), getRecentDonations);
router.get('/admin/all', restrictTo('admin'), getAllDonations);

// Webhook (raw body - no JSON middleware)
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

export default router;