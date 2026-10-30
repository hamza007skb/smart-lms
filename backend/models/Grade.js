const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  locked: { type: Boolean, default: false },
  published: { type: Boolean, default: false },
  publishedAt: { type: Date, default: null },
  presentation: { type: Number, default: 0, min: 0 },
  presentationTotal: { type: Number, default: 10, min: 1 },
  attendance: { type: Number, default: 0, min: 0 },
  attendanceTotal: { type: Number, default: 10, min: 1 },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Obtained Marks
  quizzes: { type: [Number], default: [0, 0, 0, 0] },
  assignments: { type: [Number], default: [0, 0, 0, 0] },
  midterm: { type: Number, default: 0 },
  final: { type: Number, default: 0 },

  // NEW: Total Marks (Defaults to 10 for quizzes/assignments, 100 for exams)
  quizTotals: { type: [Number], default: [10, 10, 10, 10] },
  assignmentTotals: { type: [Number], default: [10, 10, 10, 10] },
  midtermTotal: { type: Number, default: 100 },
  finalTotal: { type: Number, default: 100 }
  
}, { timestamps: true });
gradeSchema.index({ course: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Grade', gradeSchema);