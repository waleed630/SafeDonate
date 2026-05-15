import asyncHandler from "../utils/asyncHandler.js";
import ContactMessage from "../models/ContactMessage.js";

const ALLOWED_SUBJECTS = [
  "General Inquiry",
  "Report a Campaign",
  "NGO Verification Request",
  "Technical Support",
  "Partnership",
];

export const submitContact = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body || {};

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ success: false, message: "Name is required." });
  }
  if (!email || typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ success: false, message: "Email is required." });
  }
  if (!subject || typeof subject !== "string" || !ALLOWED_SUBJECTS.includes(subject.trim())) {
    return res.status(400).json({ success: false, message: "A valid subject is required." });
  }
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ success: false, message: "Message is required." });
  }

  const emailNorm = email.trim().toLowerCase();
  const simpleEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!simpleEmail.test(emailNorm)) {
    return res.status(400).json({ success: false, message: "Please provide a valid email address." });
  }

  await ContactMessage.create({
    name: name.trim().slice(0, 200),
    email: emailNorm.slice(0, 320),
    subject: subject.trim(),
    message: message.trim().slice(0, 10000),
    status: "unread",
  });

  return res.status(201).json({
    success: true,
    message: "Message received.",
  });
});

export const listContactMessages = asyncHandler(async (_req, res) => {
  const messages = await ContactMessage.find()
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    count: messages.length,
    messages,
  });
});
