// services/notificationService.js
import Notification from '../models/Notification.js';
import logger from '../utils/logger.js';
import { sendMail } from '../utils/mailer.js';

// Send Email Notification
export const sendEmailNotification = async (email, subject, html) => {
  try {
    await sendMail({ to: email, subject, html });
    logger.info(`Email sent to ${email}`);
  } catch (err) {
    logger.error(`Email failed: ${err.message}`);
  }
};

// Create In-App Notification + Real-time
export const createNotification = async (userId, type, title, message, campaignId = null) => {
  const notification = new Notification({
    user: userId,
    type,
    title,
    message,
    campaign: campaignId,
  });

  await notification.save();
  return notification;
};