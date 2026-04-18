import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const userSchema = new mongoose.Schema(
  {
    username: { 
      type: String, 
      trim: true,
      default: null,
    },
    name: { type: String },
    profilePicture: { type: String },
    isVerified: { type: Boolean, default: false },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,  // ← Add index for faster lookup
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    interests: {
      type: [String],
      enum: [
        "Medical",
        "Education",
        "Animals",
        "Disaster",
        "Creative",
        "Environment",
        "Other",
      ],
      default: [],
    },
    googleId: { type: String, default: null },
    // UPDATED FOR SAFEDONATE — 3 ROLES
    role: {
      type: String,
      enum: ["admin", "donor", "fundraiser"],
      default: "donor",  // ← Changed default from "fundraiser" to "donor"
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    // Stripe integration
    stripeCustomerId: { type: String, default: null, sparse: true },
  },

  { timestamps: true },
);
// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.password || !this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false; // No password set (e.g., Google user)
  return await bcrypt.compare(enteredPassword, this.password);
};
export default mongoose.model("User", userSchema);
