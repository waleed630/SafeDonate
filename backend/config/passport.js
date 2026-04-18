import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// dotenv.config({ path: path.join(__dirname, "../../.env") });

// ====================== GOOGLE OAUTH STRATEGY ======================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "522572457243-kfro32mps56ptpr5m1p1bbi9hhruodpa.apps.googleusercontent.com",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "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4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9",
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists by googleId
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Check if email exists
          const existingEmail = await User.findOne({ email: profile.emails[0].value });
          
          if (existingEmail) {
            // Link Google ID to existing user
            existingEmail.googleId = profile.id;
            await existingEmail.save();
            return done(null, existingEmail);
          }

          // Create new user from Google profile
          user = new User({
            googleId: profile.id,
            email: profile.emails[0].value,
            username: profile.displayName || profile.emails[0].value.split("@")[0],
            name: profile.displayName,
            profilePicture: profile.photos[0]?.value,
            isVerified: true, // Google users are automatically verified
            role: "donor", // Default role for Google OAuth
          });
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
