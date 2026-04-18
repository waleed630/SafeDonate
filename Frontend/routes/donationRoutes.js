// routes/donationRoutes.js
import express from 'express';
const router = express.Router();

import { createDonationSession } from '../controllers/donationController.js';
import { stripeWebhook } from '../controllers/webhookController.js';
import protect from '../middleware/authMiddleware.js';
import restrictTo from '../middleware/role.js';

router.post('/donate', protect, restrictTo('donor'), createDonationSession);

// Webhook (raw body - no JSON middleware)
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

export default router;