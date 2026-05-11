// socket/socketHandler.js
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import Campaign from '../models/Campaign.js';
import Donation from '../models/Donation.js';
import mongoose from 'mongoose';
import { sendEmailNotification } from '../services/notificationService.js';   // We'll create this
import { notifyCampaignGoalReachedIfNeeded } from '../utils/campaignGoalNotifications.js';
export let  onlineUsers = new Map();
const campaignViewers = new Map(); // campaignId -> Set<socketId>

const emitCampaignViewerCount = (io, campaignId) => {
  const key = String(campaignId);
  const count = campaignViewers.get(key)?.size || 0;
  io.emit("campaign:viewers:count", { campaignId: key, count });
};

const initializeSocket = (io) => {
  // const onlineUsers = new Map(); // userId → socket.id

  io.on("connection", (socket) => {
    socket.on("joinCampaignView", ({ campaignId }) => {
      const key = String(campaignId || "").trim();
      if (!key) return;

      if (socket.currentCampaignView && socket.currentCampaignView !== key) {
        const prevSet = campaignViewers.get(socket.currentCampaignView);
        if (prevSet) {
          prevSet.delete(socket.id);
          if (prevSet.size === 0) {
            campaignViewers.delete(socket.currentCampaignView);
          }
          emitCampaignViewerCount(io, socket.currentCampaignView);
        }
      }

      const viewers = campaignViewers.get(key) || new Set();
      viewers.add(socket.id);
      campaignViewers.set(key, viewers);
      socket.currentCampaignView = key;
      emitCampaignViewerCount(io, key);
    });

    socket.on("leaveCampaignView", ({ campaignId }) => {
      const key = String(campaignId || socket.currentCampaignView || "").trim();
      if (!key) return;
      const viewers = campaignViewers.get(key);
      if (viewers) {
        viewers.delete(socket.id);
        if (viewers.size === 0) {
          campaignViewers.delete(key);
        }
      }
      if (socket.currentCampaignView === key) {
        socket.currentCampaignView = null;
      }
      emitCampaignViewerCount(io, key);
    });

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

    socket.on("sendMessage", async (data, callback) => {
      try {
        const { from, to, message, campaignId } = data;
        
        console.log("📨 Received message:", { from, to, message, campaignId });

        // Validate required fields
        if (!from || !to || !message) {
          console.error("❌ Missing required fields:", { from, to, message });
          if (callback) {
            callback({ success: false, message: "Missing required fields" });
          }
          return;
        }

        // Convert string IDs to MongoDB ObjectIds
        let fromId, toId;
        try {
          fromId = mongoose.Types.ObjectId.isValid(from) ? new mongoose.Types.ObjectId(from) : from;
          toId = mongoose.Types.ObjectId.isValid(to) ? new mongoose.Types.ObjectId(to) : to;
        } catch (err) {
          console.error("❌ Invalid user ID format:", err);
          if (callback) {
            callback({ success: false, message: "Invalid user ID format" });
          }
          return;
        }

        // Create room name from sorted string IDs (not ObjectIds)
        const room = [from.toString(), to.toString()].sort().join("-");
        console.log("💬 Room:", room);

        const newMessage = new Message({ 
          from: fromId, 
          to: toId, 
          message: message.trim(), 
          campaignId: campaignId ? new mongoose.Types.ObjectId(campaignId) : null,
          readBy: [fromId] 
        });

        const savedMessage = await newMessage.save();
        console.log("✅ Message saved:", savedMessage._id);

        // Populate user details before emitting
        const populatedMessage = await savedMessage.populate('from', 'username email profilePicture');
        await populatedMessage.populate('to', 'username email profilePicture');

        // Emit the message to both users in the room
        io.to(room).emit("receiveMessage", populatedMessage);

        // Send success callback to the sender
        if (callback) {
          callback({ success: true, message: "Message sent successfully", messageId: savedMessage._id });
        }
      } catch (error) {
        console.error("❌ Error sending message:", error);
        if (callback) {
          callback({ success: false, message: "Failed to send message: " + error.message });
        }
      }
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
        await notifyCampaignGoalReachedIfNeeded(campaign._id);

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
      if (socket.currentCampaignView) {
        const viewers = campaignViewers.get(socket.currentCampaignView);
        if (viewers) {
          viewers.delete(socket.id);
          if (viewers.size === 0) {
            campaignViewers.delete(socket.currentCampaignView);
          }
        }
        emitCampaignViewerCount(io, socket.currentCampaignView);
      }

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