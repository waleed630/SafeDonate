// socket/socketHandler.js
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import Campaign from '../models/Campaign.js';
import Donation from '../models/Donation.js';
import { sendEmailNotification } from '../services/notificationService.js';   // We'll create this
export let  onlineUsers = new Map();
const initializeSocket = (io) => {
  // const onlineUsers = new Map(); // userId → socket.id

  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // ==================== ONLINE USERS TRACKING ====================
    socket.on("registerOnline", (data) => {
      // Parse if data is a string (from Postman's Socket.io tester)
      let parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      const userId = parsedData?.data?.userId || parsedData?.userId;
      
      if (!userId) {
        console.warn("⚠️  registerOnline event received without userId. Data:", data);
        return;
      }
      onlineUsers.set(userId.toString(), socket.id);
      io.emit("onlineUsersUpdate", Array.from(onlineUsers.keys()));
      console.log("✅ User registered online:", userId);
    });

    // ==================== CHAT SYSTEM (Existing - Kept 100%) ====================
    socket.on("joinChat", ({ userId, otherUserId }) => {
      const room = [userId, otherUserId].sort().join("-");
      socket.join(room);
      socket.currentRoom = room;
    });

    socket.on("sendMessage", async (data) => {
      const { from, to, message, campaignId } = data;
      const room = [from, to].sort().join("-");

      const newMessage = new Message({ from, to, message, campaignId, readBy: [from] });
      await newMessage.save();

      io.to(room).emit("receiveMessage", newMessage);
    });

    socket.on("typing", ({ from, to }) => {
      const room = [from, to].sort().join("-");
      socket.to(room).emit("userTyping", { from });
    });

    // ==================== REAL-TIME DONATION UPDATES (Existing - Kept) ====================
    socket.on("newDonation", async (data) => {
      const { campaignId, amount, donorId } = data;

      const campaign = await Campaign.findById(campaignId);
      if (campaign) {
        campaign.raisedAmount += amount;
        campaign.donorCount += 1;
        await campaign.save();

        // Broadcast instant progress bar update to everyone
        io.emit("progressUpdate", {
          campaignId,
          raisedAmount: campaign.raisedAmount,
          progress: campaign.progress,
          donorCount: campaign.donorCount
        });

        // Send notification to fundraiser
        const notification = new Notification({
          user: campaign.fundraiser,
          type: 'donation',
          title: 'New Donation Received!',
          message: `Someone just donated $${amount}`,
          campaign: campaignId,
        });
        await notification.save();

        const socketId = onlineUsers.get(campaign.fundraiser.toString());
        if (socketId) io.to(socketId).emit("newNotification", notification);
      }
    });

    // ==================== NEW: FEATURE 9 - ENGAGEMENT & COMMUNICATION ====================
    socket.on("sendNotification", async (data) => {
      const { userId, title, message, type, campaignId } = data;

      const notification = new Notification({
        user: userId,
        type,
        title,
        message,
        campaign: campaignId,
      });
      await notification.save();

      // Real-time push to online user
      const socketId = onlineUsers.get(userId.toString());
      if (socketId) {
        io.to(socketId).emit("newNotification", notification);
      }
    });

    socket.on("disconnect", () => {
      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          io.emit("onlineUsersUpdate", Array.from(onlineUsers.keys()));
          break;
        }
      }
    });
  });
};

export default initializeSocket;