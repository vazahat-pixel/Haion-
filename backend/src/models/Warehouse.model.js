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
    // ── Geo-fence fields for real-time attendance ─────────────────────────────
    coordinates: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    geofenceRadiusMeters: { type: Number, default: 250 },
  },
  { timestamps: true }
);

warehouseSchema.index({ name: 'text', code: 'text' });

const Warehouse = mongoose.model('Warehouse', warehouseSchema);
export default Warehouse;
