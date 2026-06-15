import mongoose from 'mongoose';
import { ROLES } from '../config/constants.js';

const employeeSchema = new mongoose.Schema(
  {
    empId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    department: { type: String, required: true, trim: true },
    role: { type: String, enum: Object.values(ROLES), required: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE'], default: 'ACTIVE' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    dealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer' },
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

employeeSchema.index({ firstName: 'text', lastName: 'text', empId: 'text', email: 'text' });
employeeSchema.virtual('name').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;
