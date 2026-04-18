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

        // Normalize email - lowercase and trim
        const normalizedEmail = email.toLowerCase().trim();
        
        // Check if user exists - search for exact email match (case-insensitive handled by schema lowercase)
        let user = await User.findOne({ email: normalizedEmail });
        if (user) {
            logger.warn("User already exists with email: %s", normalizedEmail);
            
            // Check if trying to register with a different role
            const requestedRole = role || "donor";
            if (user.role !== requestedRole) {
                return res.status(400).json({
                    success: false,
                    message: `You have already registered as a ${user.role}. Please login with that role or use a different email.`,
                    existingRole: user.role,
                });
            }
            
            return res.status(400).json({
                success: false,
                message: "This email is already registered. Please login or use a different email.",
            });
        }

        // Username is not required to be unique - only email must be unique

        // Create new user with role from frontend (defaults to "donor" in schema if not provided)
        user = new User({ 
            username: username?.trim() || '',
            email: normalizedEmail, 
            password, 
            role: role || "donor"
        });
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
                role: user.role,
                profilePicture: user.profilePicture
            }
        });
    } catch (e) {
        logger.error("Error in registration: %s", e.message);
        res.status(500).json({ success: false, message: "Server error: " + e.message });
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

        const { email, password, role } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            logger.warn("Invalid credentials for email: %s", email);
            return res.status(400).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        // Check if selected role matches user's actual role (if role is provided)
        if (role && user.role !== role) {
            logger.warn("Role mismatch for email: %s. Expected: %s, Selected: %s", email, user.role, role);
            return res.status(400).json({
                success: false,
                message: `This account is registered as a ${user.role}. Please select "${user.role}" to login.`,
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

        // Return minimal response without large fields (tokens are in HttpOnly cookies)
        const responseData = {
            success: true,
            message: "Login successful",
            user: {
                userId: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture
            }
        };

        res.json(responseData);
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
                profilePicture: user.profilePicture
            }
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