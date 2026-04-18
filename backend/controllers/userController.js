// controllers/userController.js
import { onlineUsers } from '../socket/socketHandler.js';
import User from '../models/User.js';

const getOnlineUsers = async (req, res) => {
  try {
    // This is admin-only or public — adjust restrictTo as needed
    const online = Array.from(onlineUsers.keys()); // from socketHandler (global access needed)
    res.json({ success: true, onlineUsers: online, total: online.length });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Upload profile picture to Cloudinary
const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    console.log('File object keys:', Object.keys(req.file));
    console.log('Full file object:', JSON.stringify(req.file, null, 2));

    // Try multiple ways to get the Cloudinary URL
    let profilePictureUrl = 
      req.file.path || 
      req.file.secure_url || 
      req.file.url ||
      req.file.location;

    // If still no URL, construct it manually from Cloudinary public_id
    if (!profilePictureUrl && req.file.public_id) {
      const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME || "dtt20zowa";
      profilePictureUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/${req.file.public_id}`;
    }

    console.log('Profile picture upload:', {
      userId,
      fileName: req.file.originalname,
      url: profilePictureUrl?.substring(0, 100),
      size: req.file.size,
      publicId: req.file.public_id || req.file.filename
    });

    if (!profilePictureUrl) {
      throw new Error('Could not determine Cloudinary URL for uploaded file');
    }

    // Update user with new profile picture URL
    const user = await User.findByIdAndUpdate(
      userId,
      { profilePicture: profilePictureUrl },
      { returnDocument: 'after', runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    console.log('Profile picture updated for user:', userId);

    res.json({
      success: true,
      message: "Profile picture uploaded successfully",
      user,
      imageUrl: profilePictureUrl
    });
  } catch (err) {
    console.error('Error uploading profile picture:', err);
    res.status(500).json({
      success: false,
      message: "Server error while uploading profile picture",
      error: err.message
    });
  }
};

// Update user profile (name and profile picture)
const updateProfile = async (req, res) => {
  try {
    const { name, profilePicture } = req.body;
    const userId = req.user._id;

    console.log('Profile update request:', {
      userId,
      name,
      hasPicture: !!profilePicture,
      pictureSize: profilePicture ? profilePicture.length : 0
    });

    // Validate input
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Name is required and cannot be empty" 
      });
    }

    // Update user
    const updateData = {
      name: name.trim(),
    };

    // Only add profilePicture if provided
    if (profilePicture) {
      updateData.profilePicture = profilePicture;
    }

    console.log('Update data keys:', Object.keys(updateData));

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { returnDocument: 'after', runValidators: true }
    ).select('-password');

    console.log('User after update:', {
      userId: user?._id,
      name: user?.name,
      hasPicture: !!user?.profilePicture,
      pictureSize: user?.profilePicture ? user.profilePicture.length : 0
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    res.json({ 
      success: true, 
      message: "Profile updated successfully",
      user 
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ 
      success: false, 
      message: "Server error while updating profile",
      error: err.message 
    });
  }
};

// ===== ADMIN FUNCTIONS FOR USER MANAGEMENT =====

/**
 * Get all users (admin only)
 */
const getAllUsers = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can access this' });
    }

    const { role, search } = req.query;
    const query = {};

    // Filter by role if provided
    if (role) {
      query.role = role;
    }

    // Filter by search term (name or email)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Toggle user active/inactive status (admin only)
 */
const toggleUserStatus = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can do this' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Toggle isActive status
    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: user.toObject({ getters: true, virtuals: true }),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Delete user (admin only)
 */
const deleteUser = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can do this' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export { getOnlineUsers, updateProfile, uploadProfilePicture, getAllUsers, toggleUserStatus, deleteUser };