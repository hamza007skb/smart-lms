// models/Result.js
const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    locked: { type: Boolean, default: false },
    published: { type: Boolean, default: false },
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
    assessmentType: {
        type: String,
        enum: ['Quiz', 'Assignment', 'Mid-Term', 'Final Exam'],
        required: true
    },
    marksObtained: {
        type: Number,
        required: true
    },
    totalMarks: {
        type: Number,
        required: true
    },
    remarks: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);