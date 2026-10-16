// middleware/rateLimiter.js
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

// Browser traffic reaches us through Vercel's /api rewrite and then Render's proxy, so
// req.ip can be a proxy address shared by every visitor. Vercel overwrites
// X-Forwarded-For with the real client IP as its first entry, so key on that.
const clientKey = (req) => {
    const forwarded = req.headers["x-forwarded-for"];
    const first = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : "";
    return ipKeyGenerator(first || req.ip);
};

const createLimiter = (options) => rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    keyGenerator: clientKey,
    message: {
        success: false,
        message: "Too many requests from this IP, please try again later."
    },
    standardHeaders: true,     // Return rate limit info in headers
    legacyHeaders: false,      // Disable X-RateLimit-* headers
    skip: (req) => process.env.NODE_ENV === "development", // ← Skip in localhost
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Too many requests from this IP, please try again later."
        });
    }
});

// General auth endpoints (register, forgot-password)
const authLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,   // 15 minutes
    max: 20                     // Reduced from 100 → safer for crowdfunding
});

// Login-specific (most critical)
const loginLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,   // 15 minutes (tighter window)
    max: 8                      // 8 attempts per 15 min (strong protection)
});

const contactLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 25,
});

export { authLimiter, loginLimiter, contactLimiter };