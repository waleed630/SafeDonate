// controllers/messageController.js
import Message from '../models/Message.js';
import logger from '../utils/logger.js';

export const getChatHistory = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user._id;

    const messages = await Message.find({
      $or: [
        { from: userId, to: otherUserId },
        { from: otherUserId, to: userId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('from', 'username')
    .populate('to', 'username');

    res.json({ success: true, messages });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};