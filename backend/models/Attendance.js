const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  date: {
    type: String,
    required: true
  },
  records: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true // This is what threw the error because it received 'undefined'!
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Leave'],
      required: true
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
