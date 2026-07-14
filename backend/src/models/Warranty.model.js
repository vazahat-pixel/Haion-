import mongoose from 'mongoose';

const warrantySchema = new mongoose.Schema(
  {
    serialNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    product: { type: String, required: true },
    sku: { type: String, uppercase: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, required: true },
    bill: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill', required: true },
    billNo: { type: String, required: true },
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
    status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'CLAIMED', 'VOID'], default: 'ACTIVE' },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, required: true },
    warrantyMonths: { type: Number, default: 12 },
  },
  { timestamps: true }
);

warrantySchema.index({ dealer: 1, status: 1 });
warrantySchema.index({ serialNo: 'text', customerName: 'text', billNo: 'text' });

const Warranty = mongoose.model('Warranty', warrantySchema);
export default Warranty;
