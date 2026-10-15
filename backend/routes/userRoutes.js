import express from "express";
const router = express.Router();

import { getOnlineUsers, updateProfile, uploadProfilePicture, getAllUsers, toggleUserStatus, deleteUser } from "../controllers/userController.js";
import protect from "../middleware/authMiddleware.js";
import restrictTo from "../middleware/role.js";
import profileUploadMiddleware from "../middleware/profileUpload.js";
import { blockDemo } from "../middleware/demo.js";

// Protected user routes (for authenticated users). Demo accounts are shared, so their profile stays fixed.
router.put('/profile', protect, blockDemo, updateProfile);
router.post('/profile-picture', protect, blockDemo, profileUploadMiddleware, uploadProfilePicture);

// Public routes
router.get('/online', protect, restrictTo('admin'), getOnlineUsers);

// Admin routes (apply admin restriction only to routes after this)
router.use(protect, restrictTo('admin'));
router.get('/', getAllUsers);
router.post('/:id/toggle-status', blockDemo, toggleUserStatus);
router.delete('/:id', blockDemo, deleteUser);

export default router;