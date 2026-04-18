// controllers/notificationController.js
import Notification from '../models/Notification.js';
import { sendEmailNotification } from '../services/notificationService.js';

const getUserNotifications = async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .populate('campaign', 'title')
    .sort({ createdAt: -1 });

  res.json({ success: true, notifications });
};

 const markAsRead = async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, _id: { $in: req.body.notificationIds || [] } },
    { read: true }
  );
  res.json({ success: true });
};
const sendEmail = async (req, res) => {
  try {
    const { email, subject, message } = req.body;

    if (!email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: "Email, subject and message are required" 
      });
    }

    // Optional: Restrict to Admin only (recommended for safety)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: "Only admins can send test emails" 
      });
    }

    await sendEmailNotification(email, subject, `
      <h2>${subject}</h2>
      <p>${message}</p>
      <p>This email was sent from SafeDonate backend.</p>
      <hr>
      <small>Sent at: ${new Date().toLocaleString()}</small>
    `);

    res.json({ 
      success: true, 
      message: `Email sent successfully to ${email}` 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export  { getUserNotifications, markAsRead, sendEmail };