const mongoose = require('mongoose');
module.exports = mongoose.model('Lecture', new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['pdf', 'video'],
    required: true
  }
}, {
  timestamps: true
}));
