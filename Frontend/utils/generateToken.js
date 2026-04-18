// utils/generateToken.js
import jwt from "jsonwebtoken";
import crypto from "crypto";
import RefreshToken from "../models/RefreshToken.js";

const generateToken = async (user, res) => {
    // Payload for JWT — includes everything needed for SafeDonate
    const payload = {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role,                    // ← No fallback needed (schema guarantees it)
        // You can add more later if needed:
        // name: user.name,
        // isVerified: user.isVerified,
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