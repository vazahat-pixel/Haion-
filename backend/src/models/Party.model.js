import mongoose from 'mongoose';

export const PARTY_TYPES = ['SUPPLIER', 'DEALER', 'CUSTOMER', 'EMPLOYEE', 'OTHER'];

const bankAccountSchema = new mongoose.Schema(
  {
    accountNumber: { type: String, required: true, trim: true },
    ifsc: { type: String, trim: true, default: '' },
    accountHolderName: { type: String, trim: true, default: '' },
    bankName: { type: String, trim: true, default: '' },
    branchName: { type: String, trim: true, default: '' },
    upiId: { type: String, trim: true, default: '' },
  },
  { _id: true }
);

const partySchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 30 },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    type: { type: String, required: true, enum: PARTY_TYPES, default: 'SUPPLIER' },
    partyCategory: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    openingBalance: { type: Number, default: 0 },
    gstin: { type: String, trim: true, uppercase: true, default: '' },
    pan: { type: String, trim: true, uppercase: true, default: '' },
    billingAddress: { type: String, trim: true, default: '' },
    shippingAddress: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    creditPeriodDays: { type: Number, default: 30, min: 0 },
    creditLimit: { type: Number, default: 0, min: 0 },
    contactPerson: { type: String, trim: true, default: '' },
    dateOfBirth: { type: Date, default: null },
    bankAccounts: { type: [bankAccountSchema], default: [] },
    notes: { type: String, maxlength: 1000, default: '' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

partySchema.index({ name: 'text', code: 'text', phone: 'text', gstin: 'text', pan: 'text' });
partySchema.index({ type: 1, status: 1 });

const Party = mongoose.model('Party', partySchema);
export default Party;
