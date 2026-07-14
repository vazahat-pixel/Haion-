import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    role: { type: String, default: null },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ['INVENTORY', 'GRN', 'EXPENSE', 'SERVICE', 'DEALER', 'BILLING', 'CUSTOMER', 'SYSTEM'], default: 'SYSTEM' },
    module: { type: String, trim: true },
    resourceId: { type: String, trim: true },
    read: { type: Boolean, default: false },
    link: { type: String, trim: true },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ role: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
