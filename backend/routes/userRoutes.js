import express from "express";
const router = express.Router();

import { getOnlineUsers, updateProfile, uploadProfilePicture, getAllUsers, toggleUserStatus, deleteUser } from "../controllers/userController.js";
import protect from "../middleware/authMiddleware.js";
import restrictTo from "../middleware/role.js";
import profileUploadMiddleware from "../middleware/profileUpload.js";

// Protected user routes (for authenticated users)
router.put('/profile', protect, updateProfile);
router.post('/profile-picture', protect, profileUploadMiddleware, uploadProfilePicture);

// Public routes
router.get('/online', protect, restrictTo('admin'), getOnlineUsers);

// Admin routes (apply admin restriction only to routes after this)
router.use(protect, restrictTo('admin'));
router.get('/', getAllUsers);
router.post('/:id/toggle-status', toggleUserStatus);
router.delete('/:id', deleteUser);

export default router;