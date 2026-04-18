// scripts/debug-password-reset.js
import dotenv from "dotenv";
import mongoose from "mongoose";
import logger from "../config/logger.js";
import User from "../models/User.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

async function debugResetTokens() {
    logger.status("🔍 SafeDonate - Password Reset Token Debugger\n");

    if (!process.env.MONGO_URI) {
        logger.error("❌ MONGO_URI is not set in .env file!");
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        logger.status("✅ Connected to MongoDB\n");

        const users = await User.find({
            passwordResetToken: { $exists: true, $ne: null }
        }).select("email passwordResetToken passwordResetExpires createdAt");

        if (users.length === 0) {
            logger.status("✅ No users have active password reset tokens.");
        } else {
            logger.status(`🔎 Found ${users.length} user(s) with reset token:\n`);

            users.forEach((user, index) => {
                logger.info(`User ${index + 1}:`);
                logger.info(`   Email              : ${user.email}`);
                logger.info(`   Reset Token        : ${user.passwordResetToken}`);
                logger.info(`   Expires At         : ${user.passwordResetExpires}`);
                logger.info(`   Token Age          : ${Math.floor((Date.now() - new Date(user.passwordResetExpires).getTime()) / 1000 / 60)} minutes ago`);
                logger.info("   ────────────────────────────────");
            });

            // Optional: Clear all tokens (uncomment if needed)
            // console.log("\n🧹 Clearing all reset tokens...");
            // await User.updateMany({}, { $unset: { passwordResetToken: 1, passwordResetExpires: 1 } });
            // console.log("✅ All reset tokens cleared.");
        }
    } catch (err) {
        logger.error("❌ Error:", err.message);
    } finally {
        await mongoose.disconnect();
        logger.status("\n🔌 Disconnected from MongoDB. Script finished.");
        process.exit(0);
    }
}

debugResetTokens();