const mongoose = require('mongoose');
module.exports = mongoose.model('Semester', new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['planned', 'active', 'ended'],
    default: 'planned'
  }
}, {
  timestamps: true
}));
