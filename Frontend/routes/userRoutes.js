import express from "express";
const router = express.Router();

import { getOnlineUsers } from "../controllers/userController.js";
import protect from "../middleware/authMiddleware.js";
import restrictTo from "../middleware/role.js";

router.get('/online', protect, restrictTo('admin'), getOnlineUsers);

export default router;