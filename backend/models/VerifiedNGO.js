import mongoose from 'mongoose';

const verifiedNGOSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    aliases: { type: [String], default: [] },
    registration_number: { type: String, required: true, trim: true },
    registry_type: {
      type: String,
      required: true,
      enum: ['SECP', 'PCP', 'Provincial', 'Manual'],
    },
    category: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
    is_verified: { type: Boolean, default: true },
    verified_at: { type: Date, default: Date.now },
    added_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

verifiedNGOSchema.index({ name: 'text', aliases: 'text' });
verifiedNGOSchema.index({ registration_number: 1 });

export default mongoose.model('VerifiedNGO', verifiedNGOSchema);
