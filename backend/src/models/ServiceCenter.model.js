import mongoose from 'mongoose';

const serviceCenterSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    address: { type: String, default: '' },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    inchargeUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

serviceCenterSchema.index({ name: 'text', code: 'text', city: 1 });

const ServiceCenter = mongoose.model('ServiceCenter', serviceCenterSchema);
export default ServiceCenter;
