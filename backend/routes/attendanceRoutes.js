const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

// 1. Save new attendance
router.post('/save', protect, authorize('teacher'), require('../middleware/courseAccess'), attendanceController.saveAttendance);

// 2. Get student's personal attendance (For Student Portal)
router.get('/student/:courseId', protect, authorize('student'), require('../middleware/courseAccess'), attendanceController.getStudentAttendance);

// 3. Get all past dates for a course (For Teacher Dashboard List)
router.get('/course/:courseId/dates', protect, authorize('teacher'), require('../middleware/courseAccess'), attendanceController.getCourseAttendanceDates);

// 4. THE MISSING ROUTE: Get a specific date's records (This fixes the JSON crash!)
router.get('/:courseId/:date', protect, authorize('teacher'), require('../middleware/courseAccess'), attendanceController.getAttendanceByDate);

module.exports = router;