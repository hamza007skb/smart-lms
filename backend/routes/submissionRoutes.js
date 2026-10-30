const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { protect, authorize } = require('../middleware/authMiddleware');
const multer = require('multer');
const fs = require('fs');

// 1. Automatically create the uploads folder if it doesn't exist
const uploadDir = 'uploads/submissions/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Configure Multer to save the PDF safely
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
  }
});
const upload = multer({ storage, limits:{fileSize:20*1024*1024},fileFilter:(req,file,cb)=>cb(null,/\.(pdf|docx)$/i.test(file.originalname)) });

// ==========================================
// SUBMISSION ROUTES
// ==========================================

// STUDENT: Submit a new assignment
router.post('/', protect, authorize('student'), upload.single('file'), require('../middleware/resourceAccess')('Assignment', 'assignmentId'), submissionController.submitAssignment);

// STUDENT: Check if they already submitted
router.get('/check/:assignmentId', protect, authorize('student'), require('../middleware/resourceAccess')('Assignment','assignmentId'), submissionController.checkMySubmission);

// TEACHER: Mark submission as reviewed
router.put('/:id/review', protect, authorize('teacher'), require('../middleware/resourceAccess')('Submission'), submissionController.reviewSubmission);

// 🚨 THIS WAS THE MISSING ROUTE! 
// TEACHER: Fetch all submissions for a specific assignment
router.get('/assignment/:assignmentId', protect, authorize('teacher'), require('../middleware/resourceAccess')('Assignment','assignmentId'), submissionController.getAssignmentSubmissions);

router.get('/:id/comparison', protect, authorize('teacher'), require('../middleware/resourceAccess')('Submission'), submissionController.getComparison);
module.exports = router;