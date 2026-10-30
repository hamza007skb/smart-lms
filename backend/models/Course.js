const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  code: { type: String, uppercase: true, trim: true, unique: true, sparse: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  semester: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', default: null },
  creditHours: { type: Number, min: 0.5, max: 12, default: 3 },
  capacity: { type: Number, min: 1, default: 50 },
  enrollmentDeadline: { type: Date, default: null },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  students: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  joinCode: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['active', 'draft', 'closed'],
    default: 'active',
  }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);