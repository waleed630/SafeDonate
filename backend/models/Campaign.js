// models/Campaign.js
import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Campaign title is required'],
        trim: true,
        minlength: 8,
        maxlength: 120,
    },
    category: {
        type: String,
        required: true,
        // Removed enum - will validate in controller by fetching from DB
    },
    tags: {
        type: [String],
        // Removed enum - tags come from Tag collection in database
        default: [],
    },
    description: {           // ← Story
        type: String,
        required: [true, 'Story/description is required'],
        minlength: 100,
    },
    images: {                // ← Cloudinary URLs
        type: [String],
        default: [],
    },
    goalAmount: {
        type: Number,
        required: [true, 'Funding goal is required'],
        min: 100,
    },
    raisedAmount: {
        type: Number,
        default: 0,
    },
    donorCount: {
        type: Number,
        default: 0,
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required'],
    },
    fundraiser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    verified: {
        type: Boolean,
        default: false,
    },
    /** Admin-only: hides campaign from public discover & blocks new donations; fundraiser/admin may still view */
    adminPaused: {
        type: Boolean,
        default: false,
    },
    /** True after fundraiser has been notified that raisedAmount >= goalAmount (once per campaign) */
    goalReachedNotified: {
        type: Boolean,
        default: false,
    },
    fraudScore: {
        type: Number,
        default: 0,           // 0-100 (higher = more suspicious)
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    verifiedAt: Date,
    rejectionReason: String,
    updates: [{
        title: { type: String, required: true },
        content: { type: String, required: true },
        postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        postedAt: { type: Date, default: Date.now },
    }],
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true, trim: true, maxlength: 1000 },
        createdAt: { type: Date, default: Date.now },
    }],
    createdAt: { type: Date, default: Date.now },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtuals for frontend
campaignSchema.virtual('progress').get(function () {
    if (this.goalAmount <= 0) return 0;
    return Math.min(100, Math.round((this.raisedAmount / this.goalAmount) * 100));
});
campaignSchema.methods.addDonation = async function (amount) {
    this.raisedAmount += amount;
    this.donorCount += 1;
    await this.save();
};

campaignSchema.virtual('daysLeft').get(function () {
    const now = new Date();
    const diff = this.endDate - now;
    return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
});

export default mongoose.model('Campaign', campaignSchema);