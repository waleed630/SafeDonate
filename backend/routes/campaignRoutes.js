// routes/campaignRoutes.js
import express from 'express';
const router = express.Router();

import uploadMiddleware from '../middleware/upload.js';
import {
    createCampaign,
    getCampaigns,
    getUserCampaigns,
    getCampaign,
    updateCampaign,
    deleteCampaign,
    completeCampaign,
    addUpdate,
    getTopCampaignDonations,
    getRecentCampaignDonations,
    getCampaignComments,
    addCampaignComment,
    getAllCampaigns,
    getAdminDashboardStats,
    approveCampaign,
    rejectCampaign,
    setCampaignPaused,
} from '../controllers/campaignController.js';

import protect, { optionalAuth } from '../middleware/authMiddleware.js';
import restrictTo from '../middleware/role.js';
import logger from '../utils/logger.js';

// Public GET routes
router.get('/', getCampaigns);

// Protected GET route - apply protect middleware directly, must come BEFORE catch-all /:id
router.get('/my', protect, restrictTo('fundraiser'), getUserCampaigns);
router.get('/:id/donations/top', optionalAuth, getTopCampaignDonations);
router.get('/:id/donations/recent', optionalAuth, getRecentCampaignDonations);
router.get('/:id/comments', optionalAuth, getCampaignComments);

// Public GET single campaign - optional auth so fundraiser/admin can view admin-paused campaigns
router.get('/:id', optionalAuth, getCampaign);

// Protected routes (apply auth middleware to POST/PUT/DELETE)
router.use(protect);

// Admin routes (must come before other protected routes)
router.get('/admin/stats', restrictTo('admin'), getAdminDashboardStats);
router.get('/admin/all', restrictTo('admin'), getAllCampaigns);
router.post('/admin/:id/approve', restrictTo('admin'), approveCampaign);
router.post('/admin/:id/reject', restrictTo('admin'), rejectCampaign);
router.patch('/admin/:id/pause', restrictTo('admin'), setCampaignPaused);

// Debug middleware to log what we receive
router.use((req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT') {
        logger.info(`[CAMPAIGN ROUTE] ${req.method} request - Body keys: ${Object.keys(req.body || {}).join(', ')}, Files: ${req.files ? req.files.length : 0}`);
    }
    next();
});

// Campaign creation with file upload
router.post('/', uploadMiddleware, restrictTo('fundraiser'), createCampaign);

// Campaign update
router.put('/:id', uploadMiddleware, restrictTo('fundraiser'), updateCampaign);

// Campaign deletion (fundraiser: own campaigns; admin: any campaign, including after approval)
router.delete('/:id', restrictTo('fundraiser', 'admin'), deleteCampaign);

// Fundraiser: mark campaign complete (any progress) — archives counts then deletes campaign + donations
router.post('/:id/complete', restrictTo('fundraiser'), completeCampaign);

// Campaign updates/comments
router.post('/:id/updates', restrictTo('fundraiser'), addUpdate);
router.post('/:id/comments', addCampaignComment);

export default router;