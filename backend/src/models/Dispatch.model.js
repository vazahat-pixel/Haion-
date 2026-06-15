import mongoose from 'mongoose';

const dispatchLineSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const timelineEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
    variant: { type: String, enum: ['success', 'warning', 'danger', 'default'], default: 'default' },
  },
  { _id: true }
);

const dispatchSchema = new mongoose.Schema(
  {
    dispatchNo: { type: String, required: true, unique: true, uppercase: true },
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    lineItems: { type: [dispatchLineSchema], default: [] },
    status: {
      type: String,
      enum: ['CREATED', 'PICKED', 'PACKED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
      default: 'CREATED',
    },
    eta: { type: Date, default: null },
    timeline: { type: [timelineEventSchema], default: [] },
    dealerConfirmedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

dispatchSchema.virtual('items').get(function () {
  return this.lineItems?.reduce((sum, li) => sum + li.quantity, 0) || 0;
});

dispatchSchema.set('toJSON', { virtuals: true });
dispatchSchema.set('toObject', { virtuals: true });

const Dispatch = mongoose.model('Dispatch', dispatchSchema);
export default Dispatch;
