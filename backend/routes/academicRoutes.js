const router = require('express').Router();
const {
  protect,
  authorize
} = require('../middleware/authMiddleware');
const Grade = require('../models/Grade');
const Fee = require('../models/Fee');
const {
  calculate,
  assessments
} = require('../services/grading');
router.use(protect);
router.get('/assessment-config', (req, res) => res.json(assessments));
router.get('/my-record', authorize('student'), async (req, res) => {
  try {
    const [grades, fee] = await Promise.all([Grade.find({
      student: req.user._id,
      published: true,
      locked: true
    }).populate({
      path: 'course',
      populate: {
        path: 'semester'
      }
    }), Fee.findOne({
      student: req.user._id
    })]);
    const groups = new Map();
    let points = 0,
      credits = 0;
    for (const grade of grades) {
      if (!grade.course) continue;
      const course = grade.course;
      const semester = course.semester;
      const key = String(semester?._id || 'unassigned');
      if (!groups.has(key)) groups.set(key, {
        id: key,
        name: semester?.name || 'Unassigned semester',
        status: semester?.status || 'unassigned',
        startDate: semester?.startDate,
        courses: [],
        creditHours: 0,
        qualityPoints: 0
      });
      const result = calculate(grade),
        hours = course.creditHours || 3,
        group = groups.get(key);
      group.courses.push({
        id: course._id,
        name: course.name,
        code: course.code,
        creditHours: hours,
        ...result
      });
      group.creditHours += hours;
      group.qualityPoints += hours * result.gpa;
      points += hours * result.gpa;
      credits += hours;
    }
    const semesters = [...groups.values()].sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0)).map(g => ({
      ...g,
      gpa: g.creditHours ? Number((g.qualityPoints / g.creditHours).toFixed(2)) : 0
    }));
    res.json({
      semesters,
      creditHours: credits,
      cgpa: credits ? Number((points / credits).toFixed(2)) : 0,
      fee
    });
  } catch (e) {
    res.status(400).json({
      message: e.message
    });
  }
});
module.exports = router;
