// server.js
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import passport from "passport";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";
import campaignRoutes from './routes/campaignRoutes.js';

import logger from "./config/logger.js";
import { morganMiddleware } from "./config/logger.js";
import errorHandler from "./middleware/errorHandler.js";
//import errorHander from "./middlewares/errorHandler.js"; 
import User from "./models/User.js";                    // ← For admin seeding
import donationRoutes from './routes/donationRoutes.js';
import donationTrackingRoutes from './routes/donationTrackingRoutes.js';
import initializeSocket from "./socket/socketHandler.js";
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import testRoutes from './routes/testRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import userRoutes from './routes/userRoutes.js';   

import path from "path";
import { fileURLToPath } from "url";

import { Server } from "socket.io";               
import http from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, "../.env") });

// Load Passport Google Strategy
import "./config/passport.js";

const app = express();
const server = http.createServer(app);           // ← NEW: Wrap Express with HTTP server
const io = new Server(server, {
  cors: { origin: "*" }
});                                             // ← NEW: Socket.io instance
// Initialize Socket.io (Clean & Professional)
initializeSocket(io);
// ====================== CORS ======================
const allowedOrigins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:3000",
    // Vite / modern frontend dev server
    "http://localhost:5173",
    "http://127.0.0.1:5173",
];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                logger.warn(`Blocked CORS request from origin: ${origin}`);
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

// ====================== SECURITY ======================
app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));
app.use(cookieParser());
app.use((req, res, next) => {
    req.cookies = req.cookies || {};
    next();
});
app.use(express.json());
app.use(morganMiddleware);

// ====================== PASSPORT ======================
app.use(passport.initialize());

// ====================== ROUTES (Phase 1 - Only Auth) ======================
app.use("/api/auth", authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/donations', donationRoutes);

// // Donation Tracking Routes (History, Receipt, Campaign-level)
app.use("/api/donations/tracking", donationTrackingRoutes);
// Real-Time Module (Live System Updates)
app.use("/api/notifications", notificationRoutes);
// analytics
app.use('/api/analytics', analyticsRoutes);
app.use('/api/test', testRoutes);
// Verification Module
app.use('/api/verification', verificationRoutes);
app.use("/api/users", userRoutes); // For user-related routes (like online users)
// ====================== HEALTH CHECK ======================
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "SafeDonate API is running! ✅",
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || "development",
    });
});

// ====================== STRIPE CHECKOUT SUCCESS ROUTE ======================
// Stripe will redirect here after a successful checkout if your `success_url` points to this path.
app.get("/donation/success", async (req, res) => {
    const sessionId = req.query.session_id;

    res.send(`
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Donation Success</title>
          </head>
          <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 2rem;">
            <h1>Donation Successful 🎉</h1>
            <p>Your payment was successful. You can safely close this window or return to the app.</p>
            <p><strong>Checkout Session:</strong> ${sessionId || "(missing session_id)"}</p>
            <p><a href="/">Back to API root</a></p>
          </body>
        </html>
    `);
});

// ====================== ERROR HANDLING ======================
app.use(errorHandler);

// ====================== START SERVER + ADMIN SEEDING ONLY ======================
const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
        logger.info("MongoDB connected successfully");

        // ====================== DEFAULT ADMIN SEEDING ONLY ======================
        const ADMIN_EMAIL = "m.waleedbinlatif@gmail.com";
        const ADMIN_PASS = "Admin@SafeDonate2025";

        const adminExists = await User.findOne({ email: ADMIN_EMAIL });

        if (!adminExists) {
            const admin = new User({
                username: "superadmin",
                name: "Muhammad Waleed Bin Latif",
                email: ADMIN_EMAIL,
                password: ADMIN_PASS,
                role: "admin",
                isVerified: true,
            });
            await admin.save();

            logger.status("✅ DEFAULT ADMIN CREATED (Only Admin is seeded)");
            logger.info(`   Email    : ${ADMIN_EMAIL}`);
            logger.info(`   Password : ${ADMIN_PASS}`);
            logger.info(`   Role     : admin`);
            logger.status("   Donor & Fundraiser → Register normally (no default seeding)");
        } else {
            logger.status("✅ Default admin already exists");
        }

        server.listen(PORT, "0.0.0.0", () => {
            logger.info(`🚀 SafeDonate Server running on http://localhost:${PORT}`);
            logger.info(`🌐 Frontend: http://localhost:5173`);
            logger.info(`🔑 Google OAuth ready`);
        });
    })
    .catch((err) => {
        logger.error("MongoDB connection failed:", err.message);
        logger.error(err);
        process.exit(1);
    });