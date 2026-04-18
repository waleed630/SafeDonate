// controllers/categoryController.js
import Category from '../models/Category.js';
import logger from '../utils/logger.js';

/**
 * Get all categories
 */
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1, createdAt: 1 });

    res.json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    logger.error('Error getting all categories:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Create a new category (admin only)
 */
export const createCategory = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can create categories' });
    }

    const { label, slug, icon, badge, description } = req.body;

    if (!label || !slug) {
      return res.status(400).json({ success: false, message: 'Label and slug are required' });
    }

    // Auto-generate slug if not provided
    const finalSlug = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '');

    // Check if category already exists
    const existingCategory = await Category.findOne({ $or: [{ label }, { slug: finalSlug }] });
    if (existingCategory) {
      return res.status(409).json({ success: false, message: 'Category with this label or slug already exists' });
    }

    // Get the highest order
    const highestOrder = await Category.findOne().sort({ order: -1 }).select('order');
    const newOrder = (highestOrder?.order || 0) + 1;

    const category = new Category({
      label: label.trim(),
      slug: finalSlug,
      icon: icon || 'fa-leaf',
      badge: badge || 'text-teal-700',
      description: description || '',
      order: newOrder,
    });

    await category.save();

    logger.info(`[ADMIN] Category created: ${category._id} - ${category.label}`);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    logger.error('Error creating category:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Update a category (admin only)
 */
export const updateCategory = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can update categories' });
    }

    const { label, slug, icon, badge, description, active, order } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Check if new label is unique
    if (label && label !== category.label) {
      const existingLabel = await Category.findOne({ label, _id: { $ne: req.params.id } });
      if (existingLabel) {
        return res.status(409).json({ success: false, message: 'Label already exists' });
      }
    }

    // Check if new slug is unique
    if (slug) {
      const finalSlug = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '');
      const existingSlug = await Category.findOne({ slug: finalSlug, _id: { $ne: req.params.id } });
      if (existingSlug) {
        return res.status(409).json({ success: false, message: 'Slug already exists' });
      }
      category.slug = finalSlug;
    }

    if (label) category.label = label.trim();
    if (icon !== undefined) category.icon = icon;
    if (badge !== undefined) category.badge = badge;
    if (description !== undefined) category.description = description;
    if (active !== undefined) category.active = active;
    if (order !== undefined) category.order = order;

    await category.save();

    logger.info(`[ADMIN] Category updated: ${category._id} - ${category.label}`);

    res.json({
      success: true,
      message: 'Category updated successfully',
      category,
    });
  } catch (error) {
    logger.error('Error updating category:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Delete a category (admin only)
 */
export const deleteCategory = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can delete categories' });
    }

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    await category.deleteOne();

    logger.info(`[ADMIN] Category deleted: ${category._id} - ${category.label}`);

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting category:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Toggle category active status (admin only)
 */
export const toggleCategoryStatus = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can do this' });
    }

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    category.active = !category.active;
    await category.save();

    logger.info(`[ADMIN] Category ${category._id} toggled to ${category.active ? 'active' : 'inactive'}`);

    res.json({
      success: true,
      message: `Category ${category.active ? 'activated' : 'deactivated'} successfully`,
      category,
    });
  } catch (error) {
    logger.error('Error toggling category status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
