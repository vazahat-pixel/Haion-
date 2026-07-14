import mongoose from 'mongoose';
import { cmsCollectionTypes, createCmsCollectionSchema } from './shared.cms.schema.js';

const cmsCollectionSchema = createCmsCollectionSchema({
  collection: {
    type: String,
    required: true,
    enum: cmsCollectionTypes,
    index: true,
  },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

cmsCollectionSchema.index({ collection: 1, order: 1 });

export default mongoose.model('CmsCollection', cmsCollectionSchema);
