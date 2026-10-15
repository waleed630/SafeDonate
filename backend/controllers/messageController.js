// controllers/messageController.js
import mongoose from 'mongoose';
import Message from '../models/Message.js';
import logger from '../utils/logger.js';

// Get all conversations for the current user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all unique users the current user has conversations with
    const messages = await Message.find({
      $or: [
        { from: userId },
        { to: userId }
      ]
    })
    .populate('from', 'username profilePicture')
    .populate('to', 'username profilePicture')
    .sort({ createdAt: -1 });

    // Group by conversation (unique participants)
    const conversationsMap = new Map();

    messages.forEach((msg) => {
      // Skip messages where user references are missing (deleted users)
      if (!msg.from || !msg.to) return;

      const otherUserId = msg.from._id.toString() === userId.toString() ? msg.to._id : msg.from._id;
      const otherUser = msg.from._id.toString() === userId.toString() ? msg.to : msg.from;
      const key = otherUserId.toString();
      const isUnread =
        msg.to._id.toString() === userId.toString() &&
        !msg.readBy.some(id => id.toString() === userId.toString());

      if (!conversationsMap.has(key)) {
        conversationsMap.set(key, {
          otherUserId: key,
          name: otherUser.username || 'Unknown',
          avatar: otherUser.profilePicture,
          lastMessage: msg.message,
          lastMessageTime: msg.createdAt,
          unread: 0,
        });
      }
      if (isUnread) conversationsMap.get(key).unread += 1;
    });

    const conversations = Array.from(conversationsMap.values());
    res.json({ success: true, conversations });
  } catch (err) {
    logger.error('Get conversations error:', err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }

    const messages = await Message.find({
      $or: [
        { from: userId, to: otherUserId },
        { from: otherUserId, to: userId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('from', 'username profilePicture')
    .populate('to', 'username profilePicture');

    // Opening a chat marks the messages sent to me as read
    await Message.updateMany(
      { from: otherUserId, to: userId, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );

    // Filter out messages with null user references (deleted users)
    const validMessages = messages.filter((msg) => msg.from && msg.to);

    res.json({ success: true, messages: validMessages });
  } catch (err) {
    logger.error('Get chat history error:', err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
