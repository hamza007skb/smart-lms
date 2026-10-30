const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  content: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);