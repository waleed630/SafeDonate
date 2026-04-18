// routes/tagRoutes.js
import express from 'express';
const router = express.Router();

import {
  getAllTags,
  createTag,
  updateTag,
  deleteTag,
} from '../controllers/tagController.js';

import protect from '../middleware/authMiddleware.js';
import restrictTo from '../middleware/role.js';

// Public route - get all tags
router.get('/', getAllTags);

// Protected admin routes
router.use(protect, restrictTo('admin'));

router.post('/', createTag);
router.put('/:id', updateTag);
router.delete('/:id', deleteTag);

export default router;
