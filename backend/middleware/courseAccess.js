const Course = require('../models/Course');
module.exports = async function courseAccess(req, res, next) {
  try {
    const id = req.params.courseId || req.params.id || req.body.courseId;
    const course = await Course.findById(id).populate('semester');
    if (!course) return res.status(404).json({
      message: 'Course not found'
    });
    const allowed = req.user.role === 'admin' || req.user.role === 'teacher' && String(course.teacher) === String(req.user._id) || req.user.role === 'student' && course.students.some(id => String(id) === String(req.user._id));
    if (!allowed) return res.status(403).json({
      message: 'You do not have access to this course'
    });
    if (!['GET', 'HEAD'].includes(req.method) && course.semester?.status === 'ended') return res.status(409).json({
      message: 'This semester has ended; course records are read-only'
    });
    req.course = course;
    next();
  } catch (error) {
    res.status(400).json({
      message: 'Invalid course reference'
    });
  }
};
