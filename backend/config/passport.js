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
export const isGoogleAuthConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

if (!isGoogleAuthConfigured) {
  console.warn("⚠️  GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set - Google login disabled");
}

if (isGoogleAuthConfigured) passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists by googleId
        let user = await User.findOne({ googleId: profile.id });

        if (user && user.isActive === false) {
          return done(null, false);
        }

        if (!user) {
          // Check if email exists
          const existingEmail = await User.findOne({ email: profile.emails[0].value.toLowerCase() });

          if (existingEmail) {
            if (existingEmail.isActive === false) return done(null, false);
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
          // Only a brand-new account may pick its role (donor/fundraiser) in the callback
          user.$locals.isNewOAuthUser = true;
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
