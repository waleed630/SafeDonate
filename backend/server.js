// server.js
import "./config/env.js"; // must stay first: loads .env before other modules read process.env
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import passport from "passport";
import cookieParser from "cookie-parser";
import session from "express-session";
import { Server } from "socket.io";               
import http from "http";

import authRoutes from "./routes/authRoutes.js";
import campaignRoutes from './routes/campaignRoutes.js';
import logger from "./config/logger.js";
import { morganMiddleware } from "./config/logger.js";
import errorHandler from "./middleware/errorHandler.js";
import User from "./models/User.js";
import Tag from "./models/Tag.js";
import Category from "./models/Category.js";
import donationRoutes from './routes/donationRoutes.js';
import donationTrackingRoutes from './routes/donationTrackingRoutes.js';
import initializeSocket from "./socket/socketHandler.js";
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import paymentMethodRoutes from './routes/paymentMethodRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import tagRoutes from './routes/tagRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import ngoRoutes from './routes/ngoRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import { stripeWebhook } from './controllers/webhookController.js';
import { isDemoModeEnabled, maskEmailsForDemo } from './middleware/demo.js';
import { resetDemoData } from './services/demoData.js';

// ===== REQUIRED CONFIG =====
if (!process.env.JWT_SECRET) {
    logger.error("JWT_SECRET is not set. Add it to backend/.env before starting the server.");
    process.exit(1);
}

await import("./config/passport.js");

const app = express();
// Hosts like Render sit behind a proxy; needed for secure cookies and correct client IPs in rate limits
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);
const server = http.createServer(app);
// ====================== CORS ======================
const frontendUrl = process.env.FRONTEND_URL;
const allowedOrigins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:3000",
    // Vite / modern frontend dev server
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    frontendUrl,
].filter(Boolean);

const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true }
});
initializeSocket(io);

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

// Stripe webhook MUST use raw body (before express.json) and MUST NOT require JWT
app.post(
    '/api/donations/webhook/stripe',
    express.raw({ type: 'application/json' }),
    stripeWebhook
);

// Images are uploaded as multipart (multer, 5MB per file), so JSON bodies can stay small
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));
app.use(morganMiddleware);

// ====================== SESSION (REQUIRED FOR OAUTH) ======================
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// ====================== PASSPORT ======================
app.use(passport.initialize());
app.use(passport.session());

// Demo accounts never see other people's email addresses
app.use(maskEmailsForDemo);

// ====================== ROUTES (Phase 1 - Only Auth) ======================
app.use("/api/auth", authRoutes);
app.use('/api/campaigns', campaignRoutes);
// Longer prefix first — otherwise /api/donations catches /api/donations/tracking/* and returns 404
app.use('/api/donations/tracking', donationTrackingRoutes);
app.use('/api/donations', donationRoutes);
// Real-Time Module (Live System Updates)
app.use("/api/notifications", notificationRoutes);
// analytics
app.use('/api/analytics', analyticsRoutes);
// Verification Module
app.use('/api/verification', verificationRoutes);
app.use("/api/users", userRoutes); // For user-related routes (like online users)
app.use("/api/payment-methods", paymentMethodRoutes); // Payment methods management
app.use("/api/messages", messageRoutes); // Message and chat routes
app.use("/api/tags", tagRoutes); // Campaign tags management
app.use("/api/categories", categoryRoutes); // Campaign categories management
app.use("/api/ngo", ngoRoutes); // Pakistani NGO registry verification
app.use("/api/contact", contactRoutes);
// ====================== HEALTH CHECK ======================
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "SafeDonate API is running! ✅",
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || "development",
    });
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
        const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
        const ADMIN_PASS = process.env.ADMIN_PASS;

        const adminExists = ADMIN_EMAIL ? await User.findOne({ email: ADMIN_EMAIL }) : true;

        if (!ADMIN_EMAIL || !ADMIN_PASS) {
            logger.warn("ADMIN_EMAIL / ADMIN_PASS not set - skipping default admin seeding");
        } else if (!adminExists) {
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
            logger.info(`   Role     : admin`);
            logger.status("   Donor & Fundraiser → Register normally (no default seeding)");
        } else {
            logger.status("✅ Default admin already exists");
        }

        // ====================== DEFAULT TAGS SEEDING ======================
        const defaultTags = [
            { label: 'Urgent', slug: 'urgent', description: 'Campaign needs immediate attention' },
            { label: 'Verified', slug: 'verified', description: 'Campaign verified by admin' },
            { label: 'Featured', slug: 'featured', description: 'Featured campaign on platform' },
            { label: 'Trending', slug: 'trending', description: 'Trending campaign' },
            { label: 'New', slug: 'new', description: 'Newly created campaign' },
        ];

        for (const tagData of defaultTags) {
            const tagExists = await Tag.findOne({ slug: tagData.slug });
            if (!tagExists) {
                await Tag.create(tagData);
                logger.info(`✅ Default tag created: ${tagData.label}`);
            }
        }

        // ====================== DEFAULT CATEGORIES SEEDING ======================
        const defaultCategories = [
            { label: 'Medical', slug: 'medical', icon: 'fa-heart-pulse', badge: 'text-rose-700', order: 0 },
            { label: 'Education', slug: 'education', icon: 'fa-graduation-cap', badge: 'text-blue-700', order: 1 },
            { label: 'Animals', slug: 'animals', icon: 'fa-paw', badge: 'text-amber-700', order: 2 },
            { label: 'Disaster', slug: 'disaster', icon: 'fa-house-chimney-crack', badge: 'text-rose-700', order: 3, active: false },
            { label: 'Creative', slug: 'creative', icon: 'fa-palette', badge: 'text-purple-700', order: 4 },
            { label: 'Environment', slug: 'environment', icon: 'fa-leaf', badge: 'text-teal-700', order: 5, active: false },
        ];

        for (const catData of defaultCategories) {
            const catExists = await Category.findOne({ slug: catData.slug });
            if (!catExists) {
                await Category.create(catData);
                logger.info(`✅ Default category created: ${catData.label}`);
            }
        }

        // ====================== PORTFOLIO DEMO DATA ======================
        if (isDemoModeEnabled()) {
            const resetHours = Number(process.env.DEMO_RESET_HOURS) || 24;
            const runReset = () =>
                resetDemoData().catch((err) => logger.error(`[DEMO] Reset failed: ${err.message}`));
            await runReset();
            setInterval(runReset, resetHours * 60 * 60 * 1000);
            logger.info(`🎭 Demo mode on - sample data resets every ${resetHours}h`);
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