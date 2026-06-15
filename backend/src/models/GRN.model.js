import mongoose from 'mongoose';

const grnLineSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true },
    name: { type: String, required: true },
    expectedQty: { type: Number, default: 0 },
    receivedQty: { type: Number, default: 0 },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const grnSchema = new mongoose.Schema(
  {
    grnNo: { type: String, required: true, unique: true, uppercase: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    supplier: { type: String, required: true },
    lineItems: { type: [grnLineSchema], default: [] },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'],
      default: 'PENDING_VERIFICATION',
    },
    receivedAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rejectReason: { type: String, default: '' },
  },
  { timestamps: true }
);

grnSchema.virtual('items').get(function () {
  return this.lineItems?.length || 0;
});

grnSchema.set('toJSON', { virtuals: true });
grnSchema.set('toObject', { virtuals: true });

const GRN = mongoose.model('GRN', grnSchema);
export default GRN;
