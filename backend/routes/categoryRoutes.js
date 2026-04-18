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

// Public route - get all categories
router.get('/', getAllCategories);

// Protected admin routes
router.use(protect, restrictTo('admin'));

router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);
router.post('/:id/toggle-status', toggleCategoryStatus);

export default router;
