// controllers/attendanceController.js
const Attendance = require('../models/Attendance');

// @desc    Mark attendance for a class
// @access  Private (Teachers only)
exports.markAttendance = async (req, res) => {
    try {
        const { courseId, date, records } = req.body;

        const attendance = await Attendance.create({
            course: courseId,
            date: date || Date.now(),
            records // Array of { student: ID, status: 'Present'/'Absent' }
        });

        res.status(201).json({ message: 'Attendance marked successfully', attendance });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Save or Update Attendance for a specific date
exports.saveAttendance = async (req, res) => {
  try {
    const { courseId, date, records } = req.body;

    if (!Array.isArray(records) || new Set(records.map(r=>String(r.student))).size !== records.length || records.some(r=>!req.course.students.some(id=>String(id)===String(r.student)))) return res.status(400).json({message:'Attendance must contain unique enrolled students'});
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({message:'Use a YYYY-MM-DD date'});
    // Check if an attendance sheet already exists for this exact date
    let attendanceSheet = await Attendance.findOne({ course: courseId, date: date });

    if (attendanceSheet) {
      // If it exists, update it
      attendanceSheet.records = records;
      await attendanceSheet.save();
    } else {
      // If it doesn't exist, create a new daily sheet
      attendanceSheet = await Attendance.create({
        course: courseId,
        date: date,
        records: records
      });
    }

    res.status(200).json({ success: true, message: 'Attendance saved successfully!' });
  } catch (error) {
    console.error("Save attendance error:", error);
    res.status(500).json({ message: 'Server error saving attendance' });
  }
};

exports.getStudentAttendance = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const studentId = req.user._id;

    // Fetch all attendance sheets for this course
    const allAttendance = await Attendance.find({ course: courseId }).sort({ date: -1 });

    // Format the data into a clean array for the React frontend
    const studentRecords = allAttendance.map(record => {
      // Look for the student in this specific date's record array
      const studentStatus = record.records.find(r => r.student.toString() === studentId.toString());
      
      return {
        date: record.date,
        status: studentStatus ? studentStatus.status : 'Absent' // Default to absent if not explicitly found
      };
    });

    res.status(200).json(studentRecords);
  } catch (error) {
    console.error("Error fetching student attendance:", error);
    res.status(500).json({ message: 'Server error fetching attendance' });
  }
};

// GET attendance for a specific date (This was the missing function!)
exports.getAttendanceByDate = async (req, res) => {
  try {
    const { courseId, date } = req.params;
    const attendanceSheet = await Attendance.findOne({ course: courseId, date: date });
    
    // If a register exists for this date, send it. If not, send an empty array.
    res.status(200).json(attendanceSheet || { records: [] });
  } catch (error) {
    console.error("Error fetching date:", error);
    res.status(500).json({ message: 'Server error fetching date' });
  }
};

// GET a list of all attendance dates AND their statistics
exports.getCourseAttendanceDates = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    
    // We select both 'date' and 'records' so we can do the math
    const sheets = await Attendance.find({ course: courseId })
                                   .select('date records')
                                   .sort({ date: -1 });
    
    const historyStats = sheets.map(sheet => {
      const total = sheet.records.length;
      const present = sheet.records.filter(r => r.status === 'Present').length;
      
      return {
        date: sheet.date,
        totalStudents: total,
        presentCount: present
      };
    });
    
    res.status(200).json(historyStats);
  } catch (error) {
    console.error("Error fetching attendance dates:", error);
    res.status(500).json({ message: 'Server error fetching past records' });
  }
};