// middleware/authMiddleware.js  ← renamed for clarity (optional)
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import logger from "../config/logger.js";   // ← Use your existing logger

const protect = async (req, res, next) => {
    try {
        let token = null;

        // 1️⃣ Priority: Authorization header (Bearer token)
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }
        // 2️⃣ Fallback: HttpOnly cookie (your generateToken style)
        else if (req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. No token provided."
            });
        }

        // 3️⃣ Verify JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4️⃣ Load user (exclude sensitive fields)
        const user = await User.findById(decoded.userId).select("-password -passwordResetToken -passwordResetExpires");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        // 5️⃣ Attach to request
        req.user = user;
        next();
    } catch (err) {
        logger.error(`Auth Error: ${err.name} - ${err.message} | URL: ${req.originalUrl}`);

        let message = "Unauthorized. Invalid token.";

        if (err.name === "TokenExpiredError") {
            message = "Session expired. Please login again.";
        } else if (err.name === "JsonWebTokenError") {
            message = "Invalid token.";
        }

        return res.status(401).json({
            success: false,
            message
        });
    }
};

export default protect;