const Course = require('../models/Course');
const Submission = require('../models/Submission'); // 🚨 NEW: Imported to fetch AI scores & activity

// ==========================================
// STUDENT CONTROLLERS
// ==========================================

// 1. Get all courses the logged-in student is enrolled in
exports.getStudentCourses = async (req, res) => {
  try {
    const courses = await Course.find({ students: req.user._id })
                                .populate('teacher', 'name')
                                .populate('semester')
                                .sort({ createdAt: -1 });
    
    res.status(200).json(courses);
  } catch (error) {
    console.error("Fetch student courses error:", error);
    res.status(500).json({ message: 'Server error fetching your courses' });
  }
};

// 2. Join a course using a 6-digit code
exports.joinCourse = async (req, res) => {
  try {
    const { joinCode } = req.body;
    
    // Step 1: Find the course by its unique join code (make sure it's uppercase)
    const course = await Course.findOne({ joinCode: String(joinCode || '').trim().toUpperCase() });
    
    if (!course) {
      return res.status(404).json({ message: 'Invalid Join Code. Double-check with your teacher.' });
    }

    const semester = course.semester ? await require('../models/Semester').findById(course.semester) : null;
    if (course.status !== 'active' || (semester && semester.status !== 'active')) return res.status(409).json({message:'Enrollment is closed for this course'});
    if (course.enrollmentDeadline && new Date() > course.enrollmentDeadline) return res.status(409).json({message:'Enrollment deadline has passed'});
    const updated = await Course.findOneAndUpdate({
      _id:course._id, status:'active', students:{$ne:req.user._id},
      $or:[{enrollmentDeadline:null},{enrollmentDeadline:{$gte:new Date()}}],
      $expr:{$lt:[{$size:'$students'},{$ifNull:['$capacity',50]}]}
    },{$addToSet:{students:req.user._id}},{new:true});
    if (!updated) return res.status(409).json({message:'Course is full or you are already enrolled'});
    course.students = updated.students;

    res.status(200).json({ success: true, course });
  } catch (error) {
    console.error("Join course error:", error);
    res.status(500).json({ message: 'Server error joining course' });
  }
};

// ==========================================
// SHARED / GENERAL CONTROLLERS
// ==========================================

// Get single course details
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name')
      .populate('semester')
      .populate('students', 'name rollNumber'); 

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(200).json(course);
  } catch (error) {
    console.error("Fetch single course error:", error);
    res.status(500).json({ message: 'Server error fetching course' });
  }
};

// ==========================================
// TEACHER CONTROLLERS
// ==========================================

// Fetch all courses for the logged-in teacher
exports.getTeacherCourses = async (req, res) => {
  try {
    const teacherId = req.user._id || req.user.id; 

    const courses = await Course.find({ teacher: teacherId }).populate('semester').sort({ createdAt: -1 });
    
    res.status(200).json(courses);
  } catch (error) {
    console.error("Fetch courses error:", error);
    res.status(500).json({ message: 'Server error while fetching courses' });
  }
};

exports.getTeacherDashboardStats = async (req, res) => {
  try {
    const teacherId = req.user._id || req.user.id;

    // 1. Get all courses for this teacher
    const courses = await Course.find({ teacher: teacherId });
    const courseIds = courses.map(c => c._id);
    
    // Calculate total students
    const totalStudents = courses.reduce((acc, c) => acc + (c.students?.length || 0), 0);

    // 2. Get all submissions for all of this teacher's courses
    const submissions = await Submission.find({ course: { $in: courseIds } })
      .populate('student', 'name')
      .populate('course', 'name')
      .sort({ createdAt: -1 });

    // 3. Calculate Average AI Score 
    let totalAiScore = 0;
    let scoredSubmissionsCount = 0;
    
    submissions.forEach(sub => {
      if (sub.similarityScore !== undefined && sub.similarityScore !== null) {
        totalAiScore += sub.similarityScore;
        scoredSubmissionsCount++;
      }
    });

    const avgAiScore = scoredSubmissionsCount > 0 
      ? (totalAiScore / scoredSubmissionsCount).toFixed(1) 
      : 0;

    // 🚨 THE CRITICAL FIX IS HERE 🚨
    // Instead of counting ALL submissions, strictly count the ones where status is 'pending'
    const pendingCount = submissions.filter(sub => sub.status === 'pending').length;

    // 4. Format the 5 most recent activities
    const recentActivity = submissions.slice(0, 5).map(sub => ({
      _id: sub._id,
      name: sub.student?.name || 'Unknown Student',
      course: sub.course?.name || 'Unknown Course',
      time: sub.createdAt,
      action: sub.similarityScore >= 75 
        ? `Flagged submission (${sub.similarityScore}% Match)` 
        : `Submitted assignment (${sub.similarityScore || 0}% Match)`
    }));

    // Send the compiled stats back to React
    res.status(200).json({
      courses: courses.length,
      students: totalStudents,
      pending: pendingCount, // Now sends the mathematically correct number!
      aiScore: `${avgAiScore}%`,
      recentActivity: recentActivity
    });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ message: 'Failed to load dashboard stats' });
  }
};