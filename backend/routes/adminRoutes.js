const router = require('express').Router();
const bcrypt = require('bcryptjs');
const {
  protect,
  authorize
} = require('../middleware/authMiddleware');
const User = require('../models/User');
const Course = require('../models/Course');
const Department = require('../models/Department');
const Semester = require('../models/Semester');
const Fee = require('../models/Fee');
const Timetable = require('../models/Timetable');
const Grade = require('../models/Grade');
const Result = require('../models/Result');
const crypto = require('crypto');
router.use(protect, authorize('admin'));
const action = fn => async (req, res) => {
  try {
    await fn(req, res);
  } catch (e) {
    res.status(e.code === 11000 ? 409 : 400).json({
      message: e.code === 11000 ? 'A record with that unique value already exists' : e.message
    });
  }
};
router.get('/overview', action(async (req, res) => {
  const [users, courses, departments, semesters, fees, timetable] = await Promise.all([User.find().select('-password').populate('department').sort({
    name: 1
  }), Course.find().populate('teacher', 'name').populate('department').populate('semester').sort({
    name: 1
  }), Department.find().sort({
    name: 1
  }), Semester.find().sort({
    startDate: -1
  }), Fee.find().populate('student', 'name rollNumber'), Timetable.find().populate('course', 'name code')]);
  res.json({
    users,
    courses,
    departments,
    semesters,
    fees,
    timetable
  });
}));
async function userData(body, creating) {
  const data = {};
  for (const key of ['name', 'email', 'role', 'active', 'rollNumber', 'department']) if (body[key] !== undefined) data[key] = body[key];
  if (!data.rollNumber) delete data.rollNumber;
  if (data.department === '') data.department = null;
  if (data.department && !(await Department.exists({
    _id: data.department
  }))) throw Error('Department not found');
  if (creating && (!body.password || body.password.length < 8)) throw Error('Password must have at least 8 characters');
  if (body.password) {
    if (body.password.length < 8) throw Error('Password must have at least 8 characters');
    data.password = await bcrypt.hash(body.password, 10);
  }
  return data;
}
router.post('/users', action(async (req, res) => {
  const user = await User.create(await userData(req.body, true));
  const data = user.toObject();
  delete data.password;
  res.status(201).json(data);
}));
router.put('/users/:id', action(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({
    message: 'User not found'
  });
  if (user.role === 'admin' && (req.body.role && req.body.role !== 'admin' || req.body.active === false)) {
    if (String(user._id) === String(req.user._id) || (await User.countDocuments({
      role: 'admin',
      active: {
        $ne: false
      }
    })) <= 1) throw Error('Cannot disable your own or the last administrator account');
  }
  if (req.body.role && req.body.role !== user.role && (await Course.exists({
    $or: [{
      teacher: user._id
    }, {
      students: user._id
    }]
  }))) throw Error('Reassign or remove course memberships before changing role');
  Object.assign(user, await userData(req.body, false));
  await user.save();
  const data = user.toObject();
  delete data.password;
  res.json(data);
}));
router.delete('/users/:id', action(async (req, res) => {
  if (String(req.user._id) === req.params.id) throw Error('Cannot delete your own account');
  const references = await Promise.all(['Course', 'Grade', 'Result', 'Submission', 'Discussion', 'Attendance', 'Fee'].map(name => {
    const filters = {
      Course: {
        $or: [{
          teacher: req.params.id
        }, {
          students: req.params.id
        }]
      },
      Discussion: {
        author: req.params.id
      },
      Attendance: {
        'records.student': req.params.id
      }
    };
    return require(`../models/${name}`).exists(filters[name] || {
      student: req.params.id
    });
  }));
  if (references.some(Boolean)) throw Error('User has linked records. Deactivate the account instead.');
  const user = await User.findById(req.params.id);
  if (user?.role === 'admin' && (await User.countDocuments({
    role: 'admin',
    active: {
      $ne: false
    }
  })) <= 1) throw Error('Cannot delete the last administrator');
  await User.findByIdAndDelete(req.params.id);
  res.json({
    success: true
  });
}));
async function courseData(body) {
  const data = {};
  for (const key of ['name', 'description', 'code', 'teacher', 'department', 'semester', 'creditHours', 'capacity', 'enrollmentDeadline', 'status']) if (body[key] !== undefined) data[key] = body[key];
  for (const key of ['department', 'semester', 'enrollmentDeadline']) if (data[key] === '') data[key] = null;
  if (!data.code?.trim()) throw Error('Course code is required');
  if (!(await User.exists({
    _id: data.teacher,
    role: 'teacher',
    active: {
      $ne: false
    }
  }))) throw Error('Select an active teacher');
  if (data.department && !(await Department.exists({
    _id: data.department
  }))) throw Error('Department not found');
  if (data.semester) {
    const sem = await Semester.findById(data.semester);
    if (!sem || sem.status === 'ended') throw Error('Select a planned or active semester');
  }
  if (!Number.isInteger(Number(data.capacity)) || Number(data.capacity) < 1) throw Error('Capacity must be a positive integer');
  return data;
}
router.post('/courses', action(async (req, res) => {
  res.status(201).json(await Course.create({
    ...(await courseData(req.body)),
    joinCode: crypto.randomBytes(4).toString('hex').slice(0, 6).toUpperCase()
  }));
}));
router.put('/courses/:id', action(async (req, res) => {
  const course = await Course.findById(req.params.id).populate('semester');
  if (!course) return res.status(404).json({
    message: 'Course not found'
  });
  if (await Grade.exists({
    course: course._id,
    published: true
  })) throw Error('Published course details are immutable; create a new course offering');
  if (course.semester?.status === 'ended') throw Error('Ended semester courses are read-only');
  const data = await courseData(req.body);
  if (Number(data.capacity) < course.students.length) throw Error('Capacity cannot be below current enrollment');
  if (course.semester && String(course.semester._id) !== String(data.semester)) throw Error('Create a new course offering to change semesters');
  Object.assign(course, data);
  await course.save();
  res.json(course);
}));
router.delete('/courses/:id', action(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({
    message: 'Course not found'
  });
  const links = await Promise.all(['Assignment', 'Announcement', 'Attendance', 'Grade', 'Result', 'Submission', 'Lecture', 'Discussion', 'Timetable'].map(name => require(`../models/${name}`).exists({
    course: course._id
  })));
  if (course.students.length || links.some(Boolean)) throw Error('Course has linked records; set its status to closed instead');
  await course.deleteOne();
  res.json({
    success: true
  });
}));
router.post('/departments', action(async (req, res) => res.status(201).json(await Department.create({
  name: req.body.name,
  code: req.body.code
}))));
router.put('/departments/:id', action(async (req, res) => res.json(await Department.findByIdAndUpdate(req.params.id, {
  name: req.body.name,
  code: req.body.code
}, {
  new: true,
  runValidators: true
}))));
router.delete('/departments/:id', action(async (req, res) => {
  if ((await User.exists({
    department: req.params.id
  })) || (await Course.exists({
    department: req.params.id
  }))) throw Error('Department is assigned to users or courses');
  await Department.findByIdAndDelete(req.params.id);
  res.json({
    success: true
  });
}));
router.post('/semesters', action(async (req, res) => {
  const {
    name,
    startDate,
    endDate
  } = req.body;
  if (!(new Date(endDate) > new Date(startDate))) throw Error('End date must be after start date');
  res.status(201).json(await Semester.create({
    name,
    startDate,
    endDate
  }));
}));
router.post('/semesters/:id/:operation', action(async (req, res) => {
  const semester = await Semester.findById(req.params.id);
  if (!semester) throw Error('Semester not found');
  if (req.params.operation === 'start') {
    if (semester.status !== 'planned') throw Error('Only planned semesters can be started');
    semester.status = 'active';
  } else if (req.params.operation === 'end') {
    if (semester.status !== 'active') throw Error('Only active semesters can be ended');
    const courses = await Course.find({
      semester: semester._id
    });
    for (const course of courses) {
      const count = await Grade.countDocuments({
        course: course._id,
        student: {
          $in: course.students
        },
        locked: true,
        published: true
      });
      if (count !== course.students.length) throw Error(`Publish final results for every student in ${course.name} before ending the semester`);
    }
    semester.status = 'ended';
    await Course.updateMany({
      semester: semester._id
    }, {
      $set: {
        status: 'closed'
      }
    });
  } else throw Error('Unknown semester operation');
  await semester.save();
  res.json(semester);
}));
router.put('/fees/:studentId', action(async (req, res) => {
  if (!(await User.exists({
    _id: req.params.studentId,
    role: 'student'
  }))) throw Error('Student not found');
  const {
    totalFee,
    paidAmount
  } = req.body;
  if (!Number.isFinite(Number(totalFee)) || !Number.isFinite(Number(paidAmount)) || Number(totalFee) < 0 || Number(paidAmount) < 0 || Number(paidAmount) > Number(totalFee)) throw Error('Paid amount must be between zero and the total fee');
  res.json(await Fee.findOneAndUpdate({
    student: req.params.studentId
  }, {
    totalFee,
    paidAmount
  }, {
    upsert: true,
    new: true,
    runValidators: true
  }));
}));
router.delete('/fees/:id', action(async (req, res) => {
  await Fee.findByIdAndDelete(req.params.id);
  res.json({
    success: true
  });
}));
router.post('/timetable', action(async (req, res) => {
  const {
    course,
    day,
    startTime,
    endTime
  } = req.body;
  const current = await Course.findById(course).populate('semester');
  if (!current || current.semester?.status === 'ended') throw Error('Select a course in an open semester');
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) || endTime <= startTime) throw Error('Select a valid time range');
  const slots = await Timetable.find({
    day,
    startTime: {
      $lt: endTime
    },
    endTime: {
      $gt: startTime
    }
  }).populate('course');
  if (slots.some(s => s.course && (String(s.course._id) === course || String(s.course.teacher) === String(current.teacher)) && String(s.course.semester || '') === String(current.semester?._id || ''))) throw Error('This teacher or course already has an overlapping slot');
  res.status(201).json(await Timetable.create({
    course,
    day,
    startTime,
    endTime
  }));
}));
router.delete('/timetable/:id', action(async (req, res) => {
  await Timetable.findByIdAndDelete(req.params.id);
  res.json({
    success: true
  });
}));
module.exports = router;
