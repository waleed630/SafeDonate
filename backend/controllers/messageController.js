// controllers/messageController.js
import Message from '../models/Message.js';
import logger from '../utils/logger.js';

// Get all conversations for the current user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("📋 Fetching conversations for user:", userId);

    // Get all unique users the current user has conversations with
    const messages = await Message.find({
      $or: [
        { from: userId },
        { to: userId }
      ]
    })
    .populate('from', 'username email profilePicture')
    .populate('to', 'username email profilePicture')
    .sort({ createdAt: -1 });

    console.log("📧 Found messages:", messages.length);

    // Group by conversation (unique participants)
    const conversationsMap = new Map();

    messages.forEach((msg) => {
      // Skip messages where user references are missing (deleted users)
      if (!msg.from || !msg.to) {
        console.warn("⚠️  Skipping message with null user reference:", msg._id);
        return;
      }

      const otherUserId = msg.from._id.toString() === userId.toString() ? msg.to._id : msg.from._id;
      const otherUser = msg.from._id.toString() === userId.toString() ? msg.to : msg.from;
      
      if (!conversationsMap.has(otherUserId.toString())) {
        const unread = !msg.readBy.some(id => id.toString() === userId.toString()) && msg.to._id.toString() === userId.toString() ? 1 : 0;
        conversationsMap.set(otherUserId.toString(), {
          otherUserId: otherUserId.toString(),
          name: otherUser.username || otherUser.email || 'Unknown',
          email: otherUser.email,
          avatar: otherUser.profilePicture,
          lastMessage: msg.message,
          lastMessageTime: msg.createdAt,
          unread: unread,
        });
      }
    });

    const conversations = Array.from(conversationsMap.values());
    console.log("✅ Returning conversations:", conversations.length);
    res.json({ success: true, conversations });
  } catch (err) {
    logger.error('Get conversations error:', err);
    console.error("❌ Error details:", err.message);
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user._id;

    console.log("💬 Fetching chat history between:", userId, "and", otherUserId);

    const messages = await Message.find({
      $or: [
        { from: userId, to: otherUserId },
        { from: otherUserId, to: userId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('from', 'username profilePicture')
    .populate('to', 'username profilePicture');

    console.log("📬 Found messages:", messages.length);

    // Filter out messages with null user references
    const validMessages = messages.filter((msg) => {
      if (!msg.from || !msg.to) {
        console.warn("⚠️  Skipping message with null user reference:", msg._id);
        return false;
      }
      return true;
    });

    console.log("✅ Returning valid messages:", validMessages.length);
    res.json({ success: true, messages: validMessages });
  } catch (err) {
    logger.error('Get chat history error:', err);
    console.error("❌ Error details:", err.message);
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
};