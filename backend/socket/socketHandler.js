// socket/socketHandler.js
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Campaign from '../models/Campaign.js';

export let onlineUsers = new Map(); // userId -> socket.id
const campaignViewers = new Map(); // campaignId -> Set<socketId>
let ioInstance = null;

const MAX_MESSAGE_LENGTH = 2000;

const emitCampaignViewerCount = (io, campaignId) => {
  const key = String(campaignId);
  const count = campaignViewers.get(key)?.size || 0;
  io.emit("campaign:viewers:count", { campaignId: key, count });
};

const parseCookies = (header = '') =>
  Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim().split('='))
      .filter(([key, value]) => key && value)
      .map(([key, ...rest]) => [key, decodeURIComponent(rest.join('='))]),
  );

/**
 * Reads the same HttpOnly accessToken cookie the REST API uses.
 * Guests can still connect (live viewer counts, progress updates) but get no socket.user.
 */
const authenticateSocket = async (socket, next) => {
  try {
    const token =
      parseCookies(socket.handshake.headers?.cookie).accessToken ||
      socket.handshake.auth?.token;
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(String(decoded.userId || decoded.id)).select('_id role isActive');
    if (user && user.isActive !== false) {
      socket.user = { id: String(user._id), role: user.role };
    }
  } catch {
    /* invalid or expired token: treat as guest */
  }
  next();
};

const roomFor = (a, b) => [String(a), String(b)].sort().join("-");

/** Broadcast fresh totals after a real (Stripe-confirmed) donation */
export const broadcastCampaignProgress = async (campaignId) => {
  if (!ioInstance) return;
  const campaign = await Campaign.findById(campaignId).select('raisedAmount goalAmount donorCount');
  if (!campaign) return;
  const percent = campaign.goalAmount > 0
    ? Math.min(100, Math.round((campaign.raisedAmount / campaign.goalAmount) * 100))
    : 0;
  const payload = {
    campaignId: String(campaign._id),
    raised: campaign.raisedAmount,
    goal: campaign.goalAmount,
    percent,
    donorCount: campaign.donorCount,
  };
  ioInstance.emit("campaign:progress", payload);
  ioInstance.emit("progressUpdate", {
    campaignId: payload.campaignId,
    raisedAmount: payload.raised,
    progress: payload.percent,
    donorCount: payload.donorCount,
  });
};

/** Push a saved notification to the user if they're online */
export const pushNotificationToUser = (userId, notification) => {
  if (!ioInstance) return;
  const socketId = onlineUsers.get(String(userId));
  if (socketId) ioInstance.to(socketId).emit("newNotification", notification);
};

const initializeSocket = (io) => {
  ioInstance = io;
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    socket.on("joinCampaignView", ({ campaignId } = {}) => {
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

    socket.on("leaveCampaignView", ({ campaignId } = {}) => {
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

    // ==================== ONLINE USERS TRACKING ====================
    // The user id always comes from the verified cookie, never from the client payload
    socket.on("registerOnline", () => {
      if (!socket.user) return;
      onlineUsers.set(socket.user.id, socket.id);
      io.emit("onlineUsersUpdate", Array.from(onlineUsers.keys()));
    });
    if (socket.user) {
      onlineUsers.set(socket.user.id, socket.id);
    }

    // ==================== CHAT SYSTEM ====================
    socket.on("joinChat", ({ otherUserId } = {}) => {
      if (!socket.user || !mongoose.Types.ObjectId.isValid(otherUserId)) return;
      const room = roomFor(socket.user.id, otherUserId);
      socket.join(room);
      socket.currentRoom = room;
    });

    socket.on("sendMessage", async (data = {}, callback) => {
      const reply = typeof callback === "function" ? callback : () => {};
      try {
        if (!socket.user) {
          return reply({ success: false, message: "Please log in to send messages" });
        }

        const { to, campaignId } = data;
        const text = typeof data.message === "string" ? data.message.trim() : "";

        if (!to || !text) {
          return reply({ success: false, message: "Missing required fields" });
        }
        if (!mongoose.Types.ObjectId.isValid(to) || to === socket.user.id) {
          return reply({ success: false, message: "Invalid recipient" });
        }
        if (text.length > MAX_MESSAGE_LENGTH) {
          return reply({ success: false, message: `Message is too long (max ${MAX_MESSAGE_LENGTH} characters)` });
        }

        const recipientExists = await User.exists({ _id: to });
        if (!recipientExists) {
          return reply({ success: false, message: "Recipient not found" });
        }

        const fromId = new mongoose.Types.ObjectId(socket.user.id);
        const newMessage = new Message({
          from: fromId,
          to: new mongoose.Types.ObjectId(to),
          message: text,
          campaignId: mongoose.Types.ObjectId.isValid(campaignId) ? new mongoose.Types.ObjectId(campaignId) : null,
          readBy: [fromId],
        });

        const savedMessage = await newMessage.save();
        const populatedMessage = await savedMessage.populate('from', 'username profilePicture');
        await populatedMessage.populate('to', 'username profilePicture');

        const room = roomFor(socket.user.id, to);
        io.to(room).emit("receiveMessage", populatedMessage);

        // Recipient may not have this chat open; deliver to their personal socket as well
        const recipientSocket = onlineUsers.get(String(to));
        if (recipientSocket && !io.sockets.adapter.rooms.get(room)?.has(recipientSocket)) {
          io.to(recipientSocket).emit("receiveMessage", populatedMessage);
        }

        reply({ success: true, message: "Message sent successfully", messageId: savedMessage._id });
      } catch (error) {
        console.error("❌ Error sending message:", error.message);
        reply({ success: false, message: "Failed to send message" });
      }
    });

    socket.on("typing", ({ to } = {}) => {
      if (!socket.user || !to) return;
      socket.to(roomFor(socket.user.id, to)).emit("userTyping", { from: socket.user.id });
    });

    // Donation totals and notifications are only changed by the server
    // (Stripe webhook / verification), never by client socket events.

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
