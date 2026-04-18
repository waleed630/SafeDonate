// routes/authRoutes.js
import express from "express";
const router = express.Router();

import { registerUser, loginUser, logoutUser, refreshTokenUser } from "../controllers/identity-controller.js";
import protect from "../middleware/authMiddleware.js";
import restrictTo from "../middleware/role.js";
import { loginLimiter, authLimiter } from "../middleware/rateLimiter.js";
import passport from "passport";
import User from "../models/User.js";
import crypto from "crypto";
import generateToken from "../utils/generateToken.js";   // ← Updated import path
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import logger from "../utils/logger.js";   // ← Added for consistency

// Fix for ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

// ====================== PUBLIC ROUTES ======================
router.post("/register", authLimiter, registerUser);
router.post("/login", loginLimiter, loginUser);
router.post("/logout", logoutUser);
router.post("/refresh-token", refreshTokenUser);

// ====================== GOOGLE OAUTH ======================
router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: "http://localhost:8080/login",
        session: false,
    }),
    async (req, res) => {
        await generateToken(req.user, res);
        res.redirect("http://localhost:8080");   // or /dashboard
    }
);

// ====================== PROTECTED ROUTES ======================
router.get("/me", protect, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

router.get("/admin", protect, restrictTo("admin"), (req, res) => {
    res.json({
        success: true,
        message: "Welcome Admin! You have full access."
    });
});

// ====================== PASSWORD RESET ======================
// Email transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

router.post("/forgot-password", authLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
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

        const resetURL = `http://localhost:8080/reset-password/${resetToken}`;

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
        res.json({ success: true, message: "Reset link sent to your email" });
    } catch (error) {
        logger.error("Forgot password error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

router.post("/reset-password/:token", async (req, res) => {
    try {
        const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired token" });
        }

        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        // Generate new tokens after successful reset
        const { accessToken, refreshToken } = await generateToken(user, res);

        logger.info(`Password reset successful for: ${user.email}`);

        res.json({
            success: true,
            message: "Password reset successful",
            accessToken,
            refreshToken,
        });
    } catch (error) {
        logger.error("Reset password error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

export default router;