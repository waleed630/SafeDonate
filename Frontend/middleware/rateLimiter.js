// middleware/rateLimiter.js
import rateLimit from "express-rate-limit";

const createLimiter = (options) => rateLimit({
    windowMs: options.windowMs,
    max: options.max,
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

export { authLimiter, loginLimiter };