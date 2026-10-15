// routes/categoryRoutes.js
import express from 'express';
const router = express.Router();

import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
} from '../controllers/categoryController.js';

import protect from '../middleware/authMiddleware.js';
import restrictTo from '../middleware/role.js';
import { blockDemo } from '../middleware/demo.js';

// Public route - get all categories
router.get('/', getAllCategories);

// Protected admin routes
router.use(protect, restrictTo('admin'));

router.post('/', createCategory);
// Static suffix before generic /:id so paths like .../toggle-status are never treated as an id
router.post('/:id/toggle-status', blockDemo, toggleCategoryStatus);
router.put('/:id', updateCategory);
router.delete('/:id', blockDemo, deleteCategory);

export default router;
