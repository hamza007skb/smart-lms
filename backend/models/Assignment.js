const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  totalMarks: { type: Number, min: 1, default: 10 },
  title: { type: String, required: true },
  description: { type: String },
  deadline: { type: Date, required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileUrl: { type: String }, // Path to the uploaded instruction file (optional)
  attachmentUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);