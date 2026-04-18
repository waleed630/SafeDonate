// routes/authRoutes.js
import express from "express";
const router = express.Router();

import { registerUser, loginUser, logoutUser, refreshTokenUser } from "../controllers/identity-controller.js";
import protect from "../middleware/authMiddleware.js";
import restrictTo from "../middleware/role.js";
import passport from "passport";
import User from "../models/User.js";
import crypto from "crypto";
import generateToken from "../utils/generateToken.js";   // ← Updated import path
import { getFrontendUrl } from "../utils/getFrontendUrl.js";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";
import logger from "../utils/logger.js";   // ← Added for consistency

// Fix for ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====================== PUBLIC ROUTES ======================
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/refresh-token", refreshTokenUser);

// ====================== GOOGLE OAUTH ======================
router.get("/google", (req, res, next) => {
    // Custom callback to preserve role in session/state
    const role = req.query.role || "donor"; // Default to donor if not specified
    req.session = req.session || {};
    req.session.oauthRole = role;
    
    const frontendUrl = getFrontendUrl(req);

    passport.authenticate("google", { 
        scope: ["profile", "email"],
        state: role, // Pass role as state parameter
        failureRedirect: `${frontendUrl}/register`
    })(req, res, next);
});

router.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: process.env.FRONTEND_URL + "/register",
        session: false,
    }),
    async (req, res) => {
        try {
            // Get role from state or default to donor
            const role = req.query.state || req.user.role || "donor";
            
            // Update user role if it differs
            if (req.user.role !== role) {
                req.user.role = role;
                await req.user.save();
            }

            // Generate tokens
            const { accessToken, refreshToken } = await generateToken(req.user, res);
            
            // Determine dashboard based on role
            const dashboardMap = {
                admin: "/admin/dashboard",
                fundraiser: "/fundraiser/dashboard",
                donor: "/donor/dashboard"
            };
            
            const dashboardUrl = dashboardMap[role] || "/donor/dashboard";
            
            // Redirect to frontend with tokens (encoded in URL for SPA)
            const frontendUrl = getFrontendUrl(req);
            const redirectUrl = `${frontendUrl}${dashboardUrl}?token=${accessToken}&refresh=${refreshToken}&role=${role}`;
            res.redirect(redirectUrl);
        } catch (error) {
            logger.error("Error in Google OAuth callback: %s", error.message);
            const frontendUrl = getFrontendUrl(req);
            res.redirect(`${frontendUrl}/register?error=oauth_failed`);
        }
    }
);

// ====================== PROTECTED ROUTES ======================
router.get("/me", protect, async (req, res) => {
    try {
        // Get full user data including profilePicture
        const user = await User.findById(req.user.id).select('_id username email role profilePicture');
        res.json({
            success: true,
            user: user
        });
    } catch (error) {
        logger.error("Error fetching user data: %s", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

router.get("/admin", protect, restrictTo("admin"), (req, res) => {
    res.json({
        success: true,
        message: "Welcome Admin! You have full access."
    });
});

// ====================== PASSWORD RESET ======================
// Email transporter
const emailUser = process.env.EMAIL_USER || "www.mwaqas.com8@gmail.com";
const emailPass = process.env.EMAIL_PASS || "zpmdlslnsqkfrmat";

// Validate email credentials
if (!emailUser || !emailPass) {
    logger.warn("⚠️ Email credentials not configured. Password reset emails will not be sent.");
    logger.warn("   Please set EMAIL_USER and EMAIL_PASS in your .env file");
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: emailUser,
        pass: emailPass,
    },
});

// Verify transporter connection
transporter.verify((error, success) => {
    if (error) {
        logger.error("❌ Email transporter error:", error.message);
    } else if (success) {
        logger.info("✅ Email transporter ready");
    }
});

router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        // Check if email credentials are configured
        if (!emailUser || !emailPass) {
            logger.error("Email credentials not configured");
            return res.status(500).json({
                success: false,
                message: "Email service is not configured. Please contact support.",
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "You have not signed up yet. Please register first."
            });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
        user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
        await user.save();

        const frontendUrl = getFrontendUrl(req);
        const resetURL = `${frontendUrl}/reset-password/${resetToken}`;

        await transporter.sendMail({
            from: `"SafeDonate" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Reset Your Password - SafeDonate",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 12px; background: #f9f9f9;">
          <h2 style="color: #1a56db; text-align: center;">SafeDonate Password Reset</h2>
          <p style="font-size: 16px; color: #333;">
            We received a request to reset your password for your SafeDonate account.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetURL}" style="background: #1a56db; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Or copy this link:<br>
            <a href="${resetURL}" style="color: #1a56db;">${resetURL}</a>
          </p>
          <hr style="border: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 13px; text-align: center;">
            This link expires in 15 minutes.<br>
            If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
        });

        logger.info(`Password reset link sent to: ${email}`);
        
        // In development, also return the token so it can be used for testing
        const isDevelopment = process.env.NODE_ENV !== 'production';
        const response = {
            success: true,
            message: "Reset link sent to your email"
        };
        
        if (isDevelopment) {
            response.devToken = resetToken;
            response.devResetUrl = `${frontendUrl}/reset-password/${resetToken}`;
            logger.info(`[DEV MODE] Reset URL: ${response.devResetUrl}`);
        }
        
        res.json(response);
    } catch (error) {
        logger.error("Forgot password error - Email sending failed:", {
            message: error.message,
            code: error.code,
            command: error.command,
        });
        
        // Provide helpful error message
        let userMessage = "Failed to send reset email. ";
        if (error.message?.includes("credentials")) {
            userMessage += "Email service is not properly configured. Please contact support.";
        } else if (error.message?.includes("ENOTFOUND")) {
            userMessage += "Network error. Please try again later.";
        } else {
            userMessage += "Please try again later.";
        }
        
        res.status(500).json({ success: false, message: userMessage });
    }
});

router.post("/reset-password/:token", async (req, res) => {
    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({ success: false, message: "Password is required" });
        }

        const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired token" });
        }

        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        // Generate new tokens after successful reset
        const { accessToken, refreshToken } = await generateToken(user, res);

        logger.info(`Password reset successful for: ${user.email}`);

        // Return minimal response to avoid large payload issues
        return res.status(200).json({
            success: true,
            message: "Password reset successful"
        });
    } catch (error) {
        logger.error("Reset password error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

export default router;