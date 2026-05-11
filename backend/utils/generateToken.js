// utils/generateToken.js
import jwt from "jsonwebtoken";
import crypto from "crypto";
import RefreshToken from "../models/RefreshToken.js";

const generateToken = async (user, res) => {
    // Always store string ids in JWT so verify + Campaign queries match Mongo consistently
    const uid = String(user._id);
    const payload = {
        id: uid,
        userId: uid,
        username: user.username,
        email: user.email,
        role: user.role
        // ⚠️ NEVER include: profilePicture, bio, or large data in JWT
        // These should be fetched separately via /api/auth/me endpoint
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "15m",
    });

    const refreshToken = crypto.randomBytes(40).toString("hex");

    // Save refresh token in DB (for secure logout + rotation)
    await RefreshToken.create({
        token: refreshToken,
        user: user._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Secure HttpOnly cookies (best practice for SafeDonate)
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // true in prod, false in localhost
        sameSite: "lax",
        path: "/",
        maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { accessToken, refreshToken };
};

export default generateToken;