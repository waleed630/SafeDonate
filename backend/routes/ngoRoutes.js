import express from 'express';
import protect, { optionalAuth } from '../middleware/authMiddleware.js';
import restrictTo, { requireAdmin } from '../middleware/role.js';
import {
  postVerify,
  searchVerifiedNgos,
  getAdminNgoRequests,
  approveNgoCampaignAdmin,
  rejectNgoCampaignAdmin,
  addVerifiedNgoFromAdmin,
} from '../controllers/ngoController.js';

const router = express.Router();

router.get('/search', optionalAuth, searchVerifiedNgos);
router.post('/verify', protect, restrictTo('fundraiser', 'admin'), postVerify);

router.get('/admin/requests', protect, requireAdmin, getAdminNgoRequests);
router.post(
  '/admin/campaigns/:campaignId/approve',
  protect,
  requireAdmin,
  approveNgoCampaignAdmin,
);
router.post(
  '/admin/campaigns/:campaignId/reject',
  protect,
  requireAdmin,
  rejectNgoCampaignAdmin,
);
router.post('/admin/registry/add', protect, requireAdmin, addVerifiedNgoFromAdmin);

export default router;
