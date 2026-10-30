// routes/resultRoutes.js
const express = require('express');
const router = express.Router();
const { enterResult, getMyResults } = require('../controllers/resultController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('teacher'), require('../middleware/courseAccess'), enterResult);
router.get('/my-results', protect, authorize('student'), getMyResults);

module.exports = router;