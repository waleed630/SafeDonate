// routes/donationRoutes.js
import express from 'express';
const router = express.Router();

import { createDonationSession, getDonationHistory, getRecentDonations, getAllDonations, verifyDonation } from '../controllers/donationController.js';
import protect from '../middleware/authMiddleware.js';
import restrictTo from '../middleware/role.js';

// Public live donations feed
router.get('/live', getRecentDonations);
router.post('/donate', createDonationSession);
router.get('/verify', verifyDonation);

// Protected routes
router.use(protect);
router.get('/history', restrictTo('donor'), getDonationHistory);
router.get('/recent', restrictTo('admin'), getRecentDonations);
router.get('/admin/all', restrictTo('admin'), getAllDonations);

export default router;