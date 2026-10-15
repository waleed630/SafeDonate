import express from "express";
const router = express.Router();

import {
  getPaymentMethods,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  createSetupIntent,
} from "../controllers/paymentMethodController.js";
import protect from "../middleware/authMiddleware.js";
import { blockDemo } from "../middleware/demo.js";

// All payment method routes require authentication
router.use(protect);

// Get all payment methods
router.get("/", getPaymentMethods);

// Saved cards on the shared demo donor would be visible to every visitor, so demo accounts can't change them
// Create setup intent to add new payment method
router.post("/setup-intent", blockDemo, createSetupIntent);

// Set payment method as default
router.put("/:paymentMethodId/set-default", blockDemo, setDefaultPaymentMethod);

// Delete payment method
router.delete("/:paymentMethodId", blockDemo, deletePaymentMethod);

export default router;
