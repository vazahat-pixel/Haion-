import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true, unique: true },
    headOfDepartment: { type: String, trim: true, default: '' },
    designations: { type: [String], default: [] },
    description: { type: String, default: '' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

departmentSchema.index({ code: 1, name: 1 });

const Department = mongoose.model('Department', departmentSchema);
export default Department;
