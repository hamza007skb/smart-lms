// controllers/resultController.js
const Result = require('../models/Result');

// @desc    Enter a result for a student
// @access  Private (Teachers only)
exports.enterResult = async (req, res) => {
    try {
        const { studentId, courseId, assessmentType, marksObtained, totalMarks, remarks } = req.body;

        if (!req.course.students.some(id=>String(id)===String(studentId))) return res.status(400).json({message:'Student is not enrolled'});
        if (await require('../models/Grade').exists({course:courseId,student:studentId,locked:true})) return res.status(409).json({message:'Final result is locked'});
        const result = await Result.create({
            student: studentId,
            course: courseId,
            assessmentType,
            marksObtained,
            totalMarks,
            remarks
        });

        res.status(201).json({ message: 'Result entered successfully', result });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all results for a logged-in student
// @access  Private (Students only)
exports.getMyResults = async (req, res) => {
    try {
        // Find results where the student ID matches the logged-in user
        const results = await Result.find({ student: req.user.id, published: true })
            .populate('course', 'name code')
            .sort({ createdAt: -1 });

        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};