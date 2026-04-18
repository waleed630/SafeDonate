// services/notificationService.js
import nodemailer from 'nodemailer';
import Notification from '../models/Notification.js';
import logger from '../utils/logger.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send Email Notification
export const sendEmailNotification = async (email, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"SafeDonate" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    });
    logger.info(`Email sent to ${email}`);
  } catch (err) {
    logger.error('Email failed:', err);
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