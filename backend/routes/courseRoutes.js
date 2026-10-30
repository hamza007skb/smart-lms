const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/authMiddleware'); 

// --- TEACHER ROUTES ---
router.get('/teacher', protect, authorize('teacher'), courseController.getTeacherCourses);
router.get('/dashboard-stats', protect, authorize('teacher'), courseController.getTeacherDashboardStats);


// --- STUDENT ROUTES ---
router.get('/student', protect, authorize('student'), courseController.getStudentCourses);
router.post('/join', protect, authorize('student'), courseController.joinCourse);

// --- SHARED ROUTES ---

router.get('/:id', protect, require('../middleware/courseAccess'), courseController.getCourseById);

module.exports = router;
