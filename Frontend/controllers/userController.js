// controllers/userController.js (add this function)
import { onlineUsers } from '../socket/socketHandler.js';
 const getOnlineUsers = async (req, res) => {
  try {
    // This is admin-only or public — adjust restrictTo as needed
    const online = Array.from(onlineUsers.keys()); // from socketHandler (global access needed)
    res.json({ success: true, onlineUsers: online, total: online.length });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
export {getOnlineUsers};