import mongoose from 'mongoose';
import { imageFieldSchema } from './shared.cms.schema.js';

const pageSectionSchema = new mongoose.Schema(
  {
    page: { type: String, required: true, trim: true, index: true },
    sectionKey: { type: String, required: true, trim: true },
    sectionLabel: { type: String, default: '' },
    isVisible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    content: { type: mongoose.Schema.Types.Mixed, default: {} },
    seo: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      keywords: [{ type: String }],
      ogImage: { type: imageFieldSchema, default: () => ({}) },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

pageSectionSchema.index({ page: 1, sectionKey: 1 }, { unique: true });
pageSectionSchema.index({ page: 1, order: 1 });

export default mongoose.model('PageSection', pageSectionSchema);
