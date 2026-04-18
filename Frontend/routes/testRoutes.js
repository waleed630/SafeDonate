// routes/testRoutes.js
import express from 'express';
const router = express.Router();

import { sendEmailNotification } from '../services/notificationService.js';
import protect from '../middleware/authMiddleware.js';

// Test Email Endpoint
router.post('/test-email', protect, async (req, res) => {
  try {
    const { email, subject, message } = req.body;

    if (!email || !subject || !message) {
      return res.status(400).json({ success: false, message: "Email, subject and message are required" });
    }

    await sendEmailNotification(
      email,
      subject || "Test Email from SafeDonate",
      `<h2>${subject}</h2><p>${message}</p><p>This is a test email from SafeDonate backend.</p>`
    );

    res.json({ 
      success: true, 
      message: `Test email sent successfully to ${email}` 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;