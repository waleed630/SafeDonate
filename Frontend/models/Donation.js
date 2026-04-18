// models/Donation.js
import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  stripeSessionId: {
    type: String,
    required: true,
    unique: true,
  },
  stripePaymentIntentId: String,        // Added for receipt
  receiptUrl: String,                   // Stripe receipt URL (auto-filled)
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.model('Donation', donationSchema);