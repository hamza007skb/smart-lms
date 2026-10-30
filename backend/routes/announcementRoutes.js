const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { protect, authorize } = require('../middleware/authMiddleware');

// CREATE Announcement
router.post('/create', protect, authorize('teacher'), require('../middleware/courseAccess'), async (req, res) => {
  try {
    const newAnnouncement = await Announcement.create({
      course: req.body.courseId,
      content: req.body.content
    });
    res.status(201).json({ announcement: newAnnouncement });
  } catch (error) {
    res.status(500).json({ message: 'Server error creating announcement' });
  }
});

// GET Announcements for a course
router.get('/:courseId', protect, require('../middleware/courseAccess'), async (req, res) => {
  try {
    const announcements = await Announcement.find({ course: req.params.courseId }).sort({ createdAt: -1 });
    res.status(200).json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching announcements' });
  }
});

// UPDATE Announcement
router.put('/:id', protect, authorize('teacher'), require('../middleware/resourceAccess')('Announcement'), async (req, res) => {
  try {
    const { content } = req.body; 

    // Find the announcement by its ID and update the text content
    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { content },
      { new: true } // This tells MongoDB to return the newly updated version
    );

    if (!updatedAnnouncement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.status(200).json(updatedAnnouncement);
  } catch (error) {
    console.error("Error updating announcement:", error);
    res.status(500).json({ message: 'Server error updating announcement' });
  }
});

module.exports = router;