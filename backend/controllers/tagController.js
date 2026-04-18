// controllers/tagController.js
import Tag from '../models/Tag.js';
import logger from '../utils/logger.js';

/**
 * Get all tags
 */
export const getAllTags = async (req, res) => {
  try {
    const tags = await Tag.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tags.length,
      tags,
    });
  } catch (error) {
    logger.error('Error getting all tags:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Create a new tag (admin only)
 */
export const createTag = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can create tags' });
    }

    const { label, slug, description } = req.body;

    if (!label || !slug) {
      return res.status(400).json({ success: false, message: 'Label and slug are required' });
    }

    // Auto-generate slug if not provided
    const finalSlug = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Check if tag already exists
    const existingTag = await Tag.findOne({ $or: [{ label }, { slug: finalSlug }] });
    if (existingTag) {
      return res.status(409).json({ success: false, message: 'Tag with this label or slug already exists' });
    }

    const tag = new Tag({
      label: label.trim(),
      slug: finalSlug,
      description: description || '',
    });

    await tag.save();

    logger.info(`[ADMIN] Tag created: ${tag._id} - ${tag.label}`);

    res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      tag,
    });
  } catch (error) {
    logger.error('Error creating tag:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Update a tag (admin only)
 */
export const updateTag = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can update tags' });
    }

    const { label, slug, description } = req.body;
    const tag = await Tag.findById(req.params.id);

    if (!tag) {
      return res.status(404).json({ success: false, message: 'Tag not found' });
    }

    // Check if new label/slug is unique
    if (label && label !== tag.label) {
      const existingLabel = await Tag.findOne({ label, _id: { $ne: req.params.id } });
      if (existingLabel) {
        return res.status(409).json({ success: false, message: 'Label already exists' });
      }
    }

    if (slug) {
      const finalSlug = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const existingSlug = await Tag.findOne({ slug: finalSlug, _id: { $ne: req.params.id } });
      if (existingSlug) {
        return res.status(409).json({ success: false, message: 'Slug already exists' });
      }
      tag.slug = finalSlug;
    }

    if (label) tag.label = label.trim();
    if (description !== undefined) tag.description = description;

    await tag.save();

    logger.info(`[ADMIN] Tag updated: ${tag._id} - ${tag.label}`);

    res.json({
      success: true,
      message: 'Tag updated successfully',
      tag,
    });
  } catch (error) {
    logger.error('Error updating tag:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Delete a tag (admin only)
 */
export const deleteTag = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can delete tags' });
    }

    const tag = await Tag.findById(req.params.id);

    if (!tag) {
      return res.status(404).json({ success: false, message: 'Tag not found' });
    }

    await tag.deleteOne();

    logger.info(`[ADMIN] Tag deleted: ${tag._id} - ${tag.label}`);

    res.json({
      success: true,
      message: 'Tag deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting tag:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
