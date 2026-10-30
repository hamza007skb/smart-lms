const mongoose = require('mongoose');
module.exports = mongoose.model('Discussion', new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 10000
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Discussion',
    default: null
  }
}, {
  timestamps: true
}));
