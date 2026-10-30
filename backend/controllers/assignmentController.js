// controllers/assignmentController.js
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');

// @desc    Create a new assignment
// @access  Private (Teachers only)
exports.createAssignment = async (req, res) => {
    try {
        const { title, description, courseId, deadline, totalMarks } = req.body;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        const teacherId = req.user._id || req.user.id;
        if (course.teacher.toString() !== teacherId.toString()) {
            return res.status(403).json({ message: 'You can only add assignments to your own courses' });
        }

        let fileUrl = null;
        if (req.file) {
            fileUrl = req.file.path; // Saves the path (e.g., 'uploads/assignments/filename.pdf')
        }

        const assignment = await Assignment.create({
            title,
            description,
            course: courseId,
            teacher: teacherId,
            deadline,
            totalMarks: totalMarks || 10, 
            attachmentUrl: fileUrl        
        });

        res.status(201).json(assignment);
    } catch (error) {
        console.error("Assignment creation error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
exports.getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    res.status(200).json(assignment);
  } catch (error) {
    console.error("Error fetching single assignment:", error);
    res.status(500).json({ message: 'Server error' });
  }
};
exports.getAssignmentsByCourse = async (req, res) => {
    try {
        // Find assignments where the 'course' field matches the ID in the URL
        const assignments = await Assignment.find({ course: req.params.courseId })
            .populate('teacher', 'name')
            .sort({ deadline: 1 }); // Sorts by deadline, closest first

        res.status(200).json(assignments);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// UPDATE an existing assignment (Title, Deadline, Description, and File)
exports.updateAssignment = async (req, res) => {
  try {
    const { title, description, deadline, totalMarks } = req.body;
    
    // 1. Prepare the data we know we are updating
    let updateData = { 
      title, 
      description, 
      deadline, 
      totalMarks 
    };
    
    // 2. If the teacher uploaded a NEW file, add the new path to our update data
    if (req.file) {
      updateData.attachmentUrl = req.file.path; 
    }

    // 3. Find by ID and update
    const updatedAssignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { returnDocument: 'after' }
    );

    if (!updatedAssignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.status(200).json(updatedAssignment);
  } catch (error) {
    console.error("Error updating assignment:", error);
    res.status(500).json({ message: 'Server error updating assignment' });
  }
};