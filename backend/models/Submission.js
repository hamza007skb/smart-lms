const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Assignment', 
    required: true 
  },
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  fileUrl: { 
    type: String, 
    required: true 
  },
  similarityScore: { 
    type: Number 
  },
  matchedWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);