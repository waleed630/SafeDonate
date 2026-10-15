// routes/authRoutes.js
import express from "express";
const router = express.Router();

import { registerUser, loginUser, logoutUser, refreshTokenUser } from "../controllers/identity-controller.js";
import protect from "../middleware/authMiddleware.js";
import restrictTo from "../middleware/role.js";
import passport from "passport";
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import crypto from "crypto";
import generateToken from "../utils/generateToken.js";   // ← Updated import path
import { getFrontendUrl } from "../utils/getFrontendUrl.js";
import nodemailer from "nodemailer";
import logger from "../utils/logger.js";
import { authLimiter, loginLimiter } from "../middleware/rateLimiter.js";

// ====================== PUBLIC ROUTES ======================
router.post("/register", authLimiter, registerUser);
router.post("/login", loginLimiter, loginUser);
router.post("/logout", logoutUser);
router.post("/refresh-token", refreshTokenUser);

// ====================== GOOGLE OAUTH ======================
const OAUTH_ROLES = ["donor", "fundraiser"];

router.get("/google", (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.redirect(`${getFrontendUrl(req)}/login?error=oauth_unavailable`);
    }

    // Only donor/fundraiser can be chosen here; anything else falls back to donor
    const role = OAUTH_ROLES.includes(req.query.role) ? req.query.role : "donor";
    req.session.oauthRole = role;

    // Authenticate with Google and preserve selected role via state
    passport.authenticate("google", { 
        scope: ["profile", "email"],
        state: role,
    })(req, res, next);
});

router.get(
    "/google/callback",
    (req, res, next) =>
        passport.authenticate("google", {
            failureRedirect: `${getFrontendUrl(req)}/login?error=oauth_failed`,
            session: true,
        })(req, res, next),
    async (req, res) => {
        try {
            // Existing accounts keep their role. A new account may pick donor or fundraiser.
            if (req.user.$locals?.isNewOAuthUser) {
                const requested = req.query.state || req.session?.oauthRole;
                if (OAUTH_ROLES.includes(requested) && req.user.role !== requested) {
                    req.user.role = requested;
                    await req.user.save();
                }
            }
            if (req.session) delete req.session.oauthRole;

            // Tokens go into HttpOnly cookies only, never into the URL
            await generateToken(req.user, res);

            const frontendUrl = getFrontendUrl(req);
            res.redirect(`${frontendUrl}/login?oauth=success`);
        } catch (error) {
            logger.error("Error in Google OAuth callback: %s", error.message);
            const frontendUrl = getFrontendUrl(req);
            res.redirect(`${frontendUrl}/login?error=oauth_failed`);
        }
    }
);

// ====================== PROTECTED ROUTES ======================
router.get("/me", protect, async (req, res) => {
    try {
        // Get full user data including profilePicture
        const user = await User.findById(req.user.id).select(
            '_id username name email role profilePicture completedCampaignsCount completedCampaignDonorsTotal',
        );
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
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

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

router.post("/forgot-password", authLimiter, async (req, res) => {
    try {
        const email = typeof req.body?.email === "string" ? req.body.email.toLowerCase().trim() : "";
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

        res.json({
            success: true,
            message: "Reset link sent to your email"
        });
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

router.post("/reset-password/:token", authLimiter, async (req, res) => {
    try {
        const { password } = req.body;

        if (typeof password !== "string" || password.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
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

        // Sign out every other session, then log this browser in with fresh tokens
        await RefreshToken.deleteMany({ user: user._id });
        await generateToken(user, res);

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