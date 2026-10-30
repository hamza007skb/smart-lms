const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalFee: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true
  }
});
schema.virtual('remainingBalance').get(function () {
  return this.totalFee - this.paidAmount;
});
module.exports = mongoose.model('Fee', schema);
