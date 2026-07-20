import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ROLES } from '../config/constants.js';

// ── Refresh token stored as SHA-256 hash (not plain JWT) ─────────────────────
// This means: even if DB is dumped, attacker cannot reuse the tokens
const refreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true }, // SHA-256 hash of raw refresh token
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
    },
    avatar: { type: String, default: null },
    dealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', default: null },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    serviceCenterId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCenter', default: null },
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', default: null },
    refreshTokens: { type: [refreshTokenSchema], default: [], select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    lastLogin: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    // ── Account lockout fields (brute-force protection) ──────────────────────
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockedUntil: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.statics.hashPassword = async function (password) {
  return bcrypt.hash(password, 12);
};

// ── Hash a raw refresh token for storage ─────────────────────────────────────
userSchema.statics.hashRefreshToken = function (rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

userSchema.methods.toAuthJSON = function () {
  return {
    id: String(this._id),
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    name: `${this.firstName} ${this.lastName}`,
    phone: this.phone,
    role: this.role,
    avatar: this.avatar,
    dealerId: this.dealerId,
    employeeId: this.employeeId,
    serviceCenterId: this.serviceCenterId,
    warehouseId: this.warehouseId,
  };
};

const User = mongoose.model('User', userSchema);
export default User;
