// routes/notificationRoutes.js
import express from 'express';
const router = express.Router();

import { getUserNotifications, markAsRead, sendEmail } from '../controllers/notificationController.js';
import protect from '../middleware/authMiddleware.js';
import restrictTo from '../middleware/role.js';
import { blockDemo } from '../middleware/demo.js';

router.use(protect);
router.get('/', getUserNotifications);
router.post('/read', markAsRead);
router.post('/send-email', restrictTo('admin'), blockDemo, sendEmail);

export default router;