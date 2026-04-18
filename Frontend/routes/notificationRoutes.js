// routes/notificationRoutes.js
import express from 'express';
const router = express.Router();

import { getUserNotifications, markAsRead, sendEmail } from '../controllers/notificationController.js';
import protect from '../middleware/authMiddleware.js';
import restrictTo from '../middleware/role.js';

router.use(protect);
router.get('/', getUserNotifications);
router.post('/read', markAsRead);
router.post('/send-email', restrictTo('admin'), sendEmail);

export default router;