// routes/analyticsRoutes.js
import express from 'express';
const router = express.Router();

import {
  getFundraiserAnalytics,
  getPlatformAnalytics,
  getPublicAnalytics,
  getTransactionVolume,
  getCampaignAnalytics,
} from '../controllers/analyticsController.js';

import protect from '../middleware/authMiddleware.js';
import restrictTo from '../middleware/role.js';

// Public analytics
router.get('/public', getPublicAnalytics);

// Fundraiser routes
router.get('/fundraiser', protect, restrictTo('fundraiser'), getFundraiserAnalytics);
router.get(
  '/campaign/:campaignId',
  protect,
  restrictTo('fundraiser', 'admin'),
  getCampaignAnalytics,
);

// Admin routes
router.get('/platform', protect, restrictTo('admin'), getPlatformAnalytics);
router.get('/transactions', protect, restrictTo('admin'), getTransactionVolume);

export default router;