const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const multer = require('multer');
const fs = require('fs');

// 1. Automatically create the uploads folder if it doesn't exist
const uploadDir = 'uploads/assignments/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Configure Multer to save the PDF safely
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Replaces spaces with dashes to keep URLs clean
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
  }
});

const upload = multer({ storage, limits:{fileSize:20*1024*1024}, fileFilter:(req,file,cb)=>cb(null, /\.(pdf|docx)$/i.test(file.originalname)) });

// ASSIGNMENT ROUTES

// Create Assignment (with file upload support via Multer)
router.post('/create', protect, authorize('teacher'), upload.single('file'), require('../middleware/courseAccess'), assignmentController.createAssignment);

// Get all assignments for a specific course (Name now perfectly matches your controller)
router.get('/:courseId', protect, require('../middleware/courseAccess'), assignmentController.getAssignmentsByCourse);

// Get a single assignment by its ID
router.get('/single/:id', protect, require('../middleware/resourceAccess')('Assignment'), assignmentController.getAssignmentById);

// Update an assignment
router.put('/:id', protect, authorize('teacher'), require('../middleware/resourceAccess')('Assignment'), upload.single('file'), assignmentController.updateAssignment);
module.exports = router;
