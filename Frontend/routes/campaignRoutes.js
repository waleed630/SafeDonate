// routes/campaignRoutes.js
import express from 'express';
const router = express.Router();

import upload from '../middleware/upload.js';
import {
    createCampaign,
    getCampaigns,
    getCampaign,
    updateCampaign,
    deleteCampaign,
    addUpdate
} from '../controllers/campaignController.js';

import protect from '../middleware/authMiddleware.js';
import restrictTo from '../middleware/role.js';

// Public
router.get('/', getCampaigns);
router.get('/:id', getCampaign);

// Protected
router.use(protect);

router.post('/', restrictTo('fundraiser'), upload, createCampaign);
router.put('/:id', restrictTo('fundraiser'), upload, updateCampaign);
router.delete('/:id', deleteCampaign); // fundraiser or admin
router.post('/:id/updates', restrictTo('fundraiser'), addUpdate);

export default router;