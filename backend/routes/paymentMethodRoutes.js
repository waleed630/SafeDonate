import express from "express";
const router = express.Router();

import {
  getPaymentMethods,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  createSetupIntent,
} from "../controllers/paymentMethodController.js";
import protect from "../middleware/authMiddleware.js";

// All payment method routes require authentication
router.use(protect);

// Get all payment methods
router.get("/", getPaymentMethods);

// Create setup intent to add new payment method
router.post("/setup-intent", createSetupIntent);

// Set payment method as default
router.put("/:paymentMethodId/set-default", setDefaultPaymentMethod);

// Delete payment method
router.delete("/:paymentMethodId", deletePaymentMethod);

export default router;
