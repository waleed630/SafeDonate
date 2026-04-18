// models/Tag.js
import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, 'Tag label is required'],
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    slug: {
      type: String,
      required: [true, 'Tag slug is required'],
      unique: true,
      lowercase: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Tag', tagSchema);
