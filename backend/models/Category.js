// models/Category.js
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, 'Category label is required'],
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      unique: true,
      lowercase: true,
      match: [/^[a-z0-9_-]+$/, 'Slug can only contain lowercase letters, numbers, underscores, and hyphens'],
    },
    icon: {
      type: String,
      default: 'fa-leaf',
    },
    badge: {
      type: String,
      default: 'text-teal-700',
    },
    description: {
      type: String,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Category', categorySchema);
