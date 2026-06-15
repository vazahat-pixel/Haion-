import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    assignee: { type: String },
    assigneeUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
    status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'], default: 'PENDING' },
    dueDate: { type: Date },
    description: { type: String },
  },
  { timestamps: true }
);

const Task = mongoose.model('Task', taskSchema);
export default Task;
