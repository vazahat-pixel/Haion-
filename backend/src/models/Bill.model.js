import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, uppercase: true },
    product: { type: String, required: true },
    hsn: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    gstRate: { type: Number, required: true, min: 0, max: 28 },
    amount: { type: Number, required: true, min: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    billNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    dealer: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, required: true, trim: true },
    customerGstin: { type: String, trim: true, uppercase: true, default: '' },
    customerPhone: { type: String, trim: true, default: '' },
    customerAddress: { type: String, trim: true, default: '' },
    customerState: { type: String, trim: true, default: '' },
    lineItems: { type: [lineItemSchema], default: [] },
    amount: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    isInterState: { type: Boolean, default: false },
    status: { type: String, enum: ['DRAFT', 'SENT', 'PAID', 'CANCELLED'], default: 'DRAFT' },
    dueDate: { type: Date },
    notes: { type: String, trim: true },
    sentAt: { type: Date },
    paidAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    teamMember: { type: mongoose.Schema.Types.ObjectId, ref: 'DealerTeamMember' },
  },
  { timestamps: true }
);

billSchema.index({ dealer: 1, status: 1, createdAt: -1 });
billSchema.index({ billNo: 'text', customerName: 'text' });

const Bill = mongoose.model('Bill', billSchema);
export default Bill;
