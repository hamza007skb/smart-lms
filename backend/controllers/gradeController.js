const Grade = require('../models/Grade');
const Result = require('../models/Result');
const {
  assessments,
  calculate
} = require('../services/grading');
exports.getCourseGrades = async (req, res) => {
  try {
    const grades = await Grade.find({
      course: req.params.courseId
    });
    res.json(grades.map(g => ({
      ...g.toObject(),
      ...calculate(g)
    })));
  } catch (e) {
    res.status(400).json({
      message: e.message
    });
  }
};
exports.bulkSaveAssessment = async (req, res) => {
  try {
    const {
      courseId,
      category,
      totalField,
      index,
      totalMarks,
      records
    } = req.body;
    if (!assessments.some(a => a.category === category && a.totalField === totalField && a.index === index)) return res.status(400).json({
      message: 'Invalid assessment'
    });
    if (!Number.isFinite(totalMarks) || totalMarks <= 0 || !Array.isArray(records) || !records.length || records.length !== new Set(records.map(r => r.studentId)).size || records.some(r => !Number.isFinite(r.mark) || r.mark < 0 || r.mark > totalMarks || !req.course.students.some(id => String(id) === r.studentId))) return res.status(400).json({
      message: 'Provide unique enrolled students and valid marks within the total'
    });
    if (await Grade.exists({
      course: courseId,
      locked: true
    })) return res.status(409).json({
      message: 'Final results are locked'
    });
    const marks = index === null ? {
      [category]: 0,
      [totalField]: totalMarks
    } : {
      [`${category}.${index}`]: 0,
      [`${totalField}.${index}`]: totalMarks
    };
    // A locked filter also protects against a save racing final publication.
    for (const record of records) {
      const fields = {
        ...marks
      };
      fields[index === null ? category : `${category}.${index}`] = record.mark;
      // Initialize complete arrays before dotted updates; MongoDB otherwise creates an object.
      await Grade.findOneAndUpdate({
        course: courseId,
        student: record.studentId
      }, {
        $setOnInsert: new Grade({
          course: courseId,
          student: record.studentId
        }).toObject()
      }, {
        upsert: true,
        returnDocument: 'after',
        runValidators: true
      });
      const updated = await Grade.findOneAndUpdate({
        course: courseId,
        student: record.studentId,
        locked: {
          $ne: true
        }
      }, {
        $set: fields
      }, {
        returnDocument: 'after',
        runValidators: true
      });
      if (!updated) return res.status(409).json({
        message: 'Final results were locked; reload the gradebook'
      });
    }
    res.json({
      success: true
    });
  } catch (e) {
    res.status(e.code === 11000 ? 409 : 400).json({
      message: e.code === 11000 ? 'Results changed or were locked; reload before saving' : e.message
    });
  }
};
exports.getStudentGrades = async (req, res) => {
  try {
    const grade = await Grade.findOne({
      course: req.params.courseId,
      student: req.user._id
    });
    res.json(grade ? {
      ...grade.toObject(),
      ...calculate(grade)
    } : {
      ...new Grade().toObject(),
      ...calculate({}),
      updatedAt: null
    });
  } catch (e) {
    res.status(400).json({
      message: e.message
    });
  }
};
exports.publish = async (req, res) => {
  try {
    const course = req.course;
    if (!course.semester || course.semester.status !== 'active') return res.status(409).json({
      message: 'Assign this course to an active semester before publishing final results'
    });
    const grades = await Grade.find({
      course: course._id,
      student: {
        $in: course.students
      }
    });
    if (!course.students.length || grades.length !== course.students.length) return res.status(409).json({
      message: 'Save grades for every enrolled student before publishing'
    });
    await require('../models/Course').updateOne({
      _id: course._id
    }, {
      $set: {
        status: 'closed'
      }
    });
    await Grade.updateMany({
      course: course._id
    }, {
      $set: {
        locked: true,
        published: true,
        publishedAt: new Date()
      }
    });
    await Result.updateMany({
      course: course._id
    }, {
      $set: {
        locked: true,
        published: true
      }
    });
    res.json({
      success: true
    });
  } catch (e) {
    res.status(400).json({
      message: e.message
    });
  }
};
