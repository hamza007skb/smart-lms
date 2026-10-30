const router = require('express').Router();
const {
  protect,
  authorize
} = require('../middleware/authMiddleware');
const access = require('../middleware/courseAccess');
const Discussion = require('../models/Discussion');
const Lecture = require('../models/Lecture');
const Timetable = require('../models/Timetable');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '../uploads/lectures');
fs.mkdirSync(dir, {
  recursive: true
});
const upload = multer({
  storage: multer.diskStorage({
    destination: dir,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${require('crypto').randomBytes(4).toString('hex')}${path.extname(file.originalname).toLowerCase()}`)
  }),
  limits: {
    fileSize: 100 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => cb(null, /\.(pdf|mp4|webm)$/i.test(file.originalname))
});
const run = fn => async (req, res) => {
  try {
    await fn(req, res);
  } catch (e) {
    res.status(400).json({
      message: e.message
    });
  }
};
router.use(protect);
router.get('/:courseId', access, run(async (req, res) => {
  const [discussions, lectures, timetable] = await Promise.all([Discussion.find({
    course: req.course._id
  }).populate('author', 'name role').sort({
    createdAt: 1
  }), Lecture.find({
    course: req.course._id
  }).sort({
    createdAt: -1
  }), Timetable.find({
    course: req.course._id
  }).sort({
    day: 1,
    startTime: 1
  })]);
  res.json({
    discussions,
    lectures,
    timetable
  });
}));
router.post('/:courseId/discussions', access, run(async (req, res) => {
  const {
    content,
    parent
  } = req.body;
  if (parent && !(await Discussion.exists({
    _id: parent,
    course: req.course._id
  }))) throw Error('Reply must belong to this course');
  const discussion = await Discussion.create({
    course: req.course._id,
    author: req.user._id,
    content,
    parent: parent || null
  });
  res.status(201).json(await discussion.populate('author', 'name role'));
}));
router.delete('/:courseId/discussions/:discussionId', access, run(async (req, res) => {
  const discussion = await Discussion.findOne({
    _id: req.params.discussionId,
    course: req.course._id
  });
  if (!discussion) return res.status(404).json({
    message: 'Discussion not found'
  });
  if (req.user.role === 'student' && String(discussion.author) !== String(req.user._id)) return res.status(403).json({
    message: 'You can only remove your own comments'
  });
  if (await Discussion.exists({
    parent: discussion._id
  })) {
    discussion.content = '[Comment removed]';
    await discussion.save();
  } else await discussion.deleteOne();
  res.json({
    success: true
  });
}));
router.post('/:courseId/lectures', authorize('teacher', 'admin'), access, upload.single('file'), run(async (req, res) => {
  let {
    title,
    fileUrl,
    type
  } = req.body;
  if (req.file) {
    fileUrl = `uploads/lectures/${req.file.filename}`;
    type = path.extname(req.file.filename) === '.pdf' ? 'pdf' : 'video';
  } else {
    const url = new URL(fileUrl);
    if (url.protocol !== 'https:') throw Error('Material links must use HTTPS');
  }
  res.status(201).json(await Lecture.create({
    course: req.course._id,
    title,
    fileUrl,
    type
  }));
}));
router.delete('/:courseId/lectures/:lectureId', authorize('teacher', 'admin'), access, run(async (req, res) => {
  await Lecture.deleteOne({
    _id: req.params.lectureId,
    course: req.course._id
  });
  res.json({
    success: true
  });
}));
module.exports = router;
