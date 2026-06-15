import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    capacity: { type: Number, default: 0 },
    managerName: { type: String, default: '' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

warehouseSchema.index({ name: 'text', code: 'text' });

const Warehouse = mongoose.model('Warehouse', warehouseSchema);
export default Warehouse;
