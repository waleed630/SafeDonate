import express from "express";
import protect from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/role.js";
import { contactLimiter } from "../middleware/rateLimiter.js";
import { submitContact, listContactMessages } from "../controllers/contactController.js";

const router = express.Router();

router.post("/", contactLimiter, submitContact);
router.get("/", protect, requireAdmin, listContactMessages);

export default router;
