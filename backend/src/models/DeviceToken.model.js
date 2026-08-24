import mongoose from 'mongoose';

/**
 * WEB  — browser push via the service worker
 * APP  — a mobile build that has not told us which OS it is
 * ANDROID / IOS — native builds, so FCM can apply the right per-platform block
 */
export const DEVICE_PLATFORMS = ['WEB', 'APP', 'ANDROID', 'IOS'];

/**
 * One FCM registration token per browser / app install. A user can have many
 * (phone, laptop, office desktop), and the same device can be handed to another
 * user after a logout — so `token` is unique and simply re-pointed at whoever
 * registered it last, rather than duplicated.
 */
const deviceTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, default: null, index: true },
    token: { type: String, required: true, unique: true, trim: true },
    platform: { type: String, enum: DEVICE_PLATFORMS, default: 'WEB' },
    // Which front-end the token was registered from (admin, customer, dealer…).
    panel: { type: String, trim: true, default: '' },
    userAgent: { type: String, trim: true, default: '' },
    lastSeenAt: { type: Date, default: Date.now },
    // Flipped off when FCM reports the token as unregistered/invalid.
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

deviceTokenSchema.index({ user: 1, isActive: 1 });
deviceTokenSchema.index({ role: 1, isActive: 1 });

const DeviceToken = mongoose.model('DeviceToken', deviceTokenSchema);
export default DeviceToken;
