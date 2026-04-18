// routes/messageRoutes.js
import express from 'express';
const router = express.Router();

import { getConversations, getChatHistory } from '../controllers/messageController.js';
import protect from '../middleware/authMiddleware.js';

router.use(protect);
router.get('/', getConversations);
router.get('/:otherUserId', getChatHistory);

export default router;