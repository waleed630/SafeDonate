// controllers/identity-controller.js
import logger from "../utils/logger.js";
import { validateRegistration, validateLogin } from "../utils/validation.js";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import RefreshToken from "../models/RefreshToken.js";

// 🟢 User Registration
const registerUser = async (req, res) => {
    logger.info("Registration endpoint hit...");
    try {
        const { error } = validateRegistration(req.body);
        if (error) {
            logger.warn("Validation error: %s", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const { email, password, username, role } = req.body;

        // Check if user exists
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            logger.warn("User already exists: %s", email);
            return res.status(400).json({
                success: false,
                message: "User already exists",
            });
        }

        // Create new user (role may be provided by frontend; defaults to "donor" in schema)
        user = new User({ username, email, password, role });
        await user.save();

        // Generate tokens
        const { accessToken, refreshToken } = await generateToken(user, res);

        logger.info("User registered successfully: %s (role: %s)", user._id, user.role);

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                userId: user._id,
                username: user.username,
                email: user.email,
                role: user.role,           // ← IMPORTANT for SafeDonate
            },
            accessToken,
            refreshToken,
        });
    } catch (e) {
        logger.error("Error in registration: %s", e.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// 🟢 User Login
const loginUser = async (req, res) => {
    logger.info("Login endpoint hit...");
    try {
        const { error } = validateLogin(req.body);
        if (error) {
            logger.warn("Validation error: %s", error.details[0].message);
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            logger.warn("Invalid credentials for email: %s", email);
            return res.status(400).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        // Google OAuth user check
        if (!user.password) {
            return res.status(400).json({
                success: false,
                message: "This account was created with Google. Please use 'Continue with Google' to sign in.",
            });
        }

        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            logger.warn("Invalid password for email: %s", email);
            return res.status(400).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        // Generate tokens
        const { accessToken, refreshToken } = await generateToken(user, res);

        logger.info("User logged in successfully: %s (role: %s)", user._id, user.role);

        res.json({
            success: true,
            message: "Login successful",
            user: {
                userId: user._id,
                username: user.username,
                email: user.email,
                role: user.role,           // ← IMPORTANT for SafeDonate
            },
            accessToken,
            refreshToken,
        });
    } catch (e) {
        logger.error("Error in Login: %s", e.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// 🟢 Refresh Token
const refreshTokenUser = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ success: false, message: "No refresh token" });
        }

        const storedToken = await RefreshToken.findOne({ token: refreshToken });
        if (!storedToken || storedToken.expiresAt < new Date()) {
            return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
        }

        const user = await User.findById(storedToken.user);
        if (!user) {
            return res.status(401).json({ success: false, message: "User not found" });
        }

        // Delete old token
        await RefreshToken.deleteOne({ _id: storedToken._id });

        // Generate new tokens
        const { accessToken, refreshToken: newRefreshToken } = await generateToken(user, res);

        res.json({
            success: true,
            user: {
                userId: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
            accessToken,
            refreshToken: newRefreshToken,
        });
    } catch (e) {
        logger.error("Error in refresh token: %s", e.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// 🟢 Logout
const logoutUser = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            await RefreshToken.deleteOne({ token: refreshToken });
        }

        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");

        res.json({ success: true, message: "Logged out successfully" });
    } catch (e) {
        logger.error("Error in logout: %s", e.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export { registerUser, loginUser, refreshTokenUser, logoutUser };