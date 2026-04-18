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
    addUpdate,
    getAllCampaigns,
    getAdminDashboardStats,
    approveCampaign,
    rejectCampaign
} from '../controllers/campaignController.js';

import protect from '../middleware/authMiddleware.js';
import restrictTo from '../middleware/role.js';
import logger from '../utils/logger.js';

// Public GET routes
router.get('/', getCampaigns);

// Protected GET route - apply protect middleware directly, must come BEFORE catch-all /:id
router.get('/my', protect, getUserCampaigns);

// Public GET single campaign - defined after /my to avoid catching /my
router.get('/:id', getCampaign);

// Protected routes (apply auth middleware to POST/PUT/DELETE)
router.use(protect);

// Admin routes (must come before other protected routes)
router.get('/admin/stats', restrictTo('admin'), getAdminDashboardStats);
router.get('/admin/all', restrictTo('admin'), getAllCampaigns);
router.post('/admin/:id/approve', restrictTo('admin'), approveCampaign);
router.post('/admin/:id/reject', restrictTo('admin'), rejectCampaign);

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

// Campaign deletion
router.delete('/:id', deleteCampaign);

// Campaign updates/comments
router.post('/:id/updates', restrictTo('fundraiser'), addUpdate);

export default router;