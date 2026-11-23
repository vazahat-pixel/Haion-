/**
 * Generic DMS entity: leads, quotes, targets, beats, expenses, queries, app data,
 * and all HRMS records. Each type is described by entities.config.js.
 */
import mongoose from 'mongoose';

const { Schema } = mongoose;

const entitySchema = new Schema(
  {
    type: { type: String, required: true, index: true },
    docNo: { type: String, index: true },
    data: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, default: 'Active', index: true },
    location: { type: Schema.Types.ObjectId, ref: 'DmsLocation', default: null },
    ownerLoginId: { type: String, index: true }, // whose record it is (self-service scope)
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdByName: String,
    actions: [{ _id: false, at: { type: Date, default: Date.now }, by: String, action: String, remark: String, from: String, to: String }],
  },
  { timestamps: true, collection: 'dms_entities' },
);
entitySchema.index({ type: 1, docNo: 1 }, { unique: true, partialFilterExpression: { docNo: { $type: 'string' } } });
entitySchema.index({ type: 1, createdAt: -1 });

export const DmsEntity = mongoose.models.DmsEntity || mongoose.model('DmsEntity', entitySchema);
