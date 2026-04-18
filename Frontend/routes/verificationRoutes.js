// routes/verificationRoutes.js
import express from 'express';
const router = express.Router();

import {
  verifyCampaign,
  getPendingCampaigns,
  testFullFraudScore,
  testAIFraudScoreOnly

} from '../controllers/verificationController.js';

import protect from '../middleware/authMiddleware.js';
import restrictTo from '../middleware/role.js';

// Admin only
router.use(protect, restrictTo('admin'));

router.get('/pending', getPendingCampaigns);

router.post('/test-full-score/:campaignId', testFullFraudScore);
router.post('/test-ai-score', testAIFraudScoreOnly);

router.post('/:id/verify', verifyCampaign);

export default router;