const Submission = require('../models/Submission');
const axios = require('axios');
const path = require('path');

// 1. Check if the logged-in student has already submitted
exports.checkMySubmission = async (req, res) => {
  try {
    const submission = await Submission.findOne({
      assignment: req.params.assignmentId,
      student: req.user._id
    });
    
    // Returns true if a submission exists, false if it doesn't
    res.status(200).json({ submitted: !!submission, submission: submission ? {...submission.toObject(),timing:submission.createdAt > req.resource.deadline ? 'late':'on-time'} : null });
  } catch (error) {
    console.error("Error checking submission:", error);
    res.status(500).json({ message: 'Server error checking submission status' });
  }
};

// 2. Catch the PDF file, ask Python for the AI Score, and save the record
exports.submitAssignment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF or DOCX file.' });
    }

    const { assignmentId } = req.body;
    const courseId = req.course._id;
    if (req.body.courseId && String(req.body.courseId)!==String(courseId)) return res.status(400).json({message:'Assignment and course do not match'});

    const existing = await Submission.findOne({ 
      assignment: assignmentId, 
      student: req.user._id 
    });
    
    if (existing) {
      return res.status(400).json({ message: 'You have already submitted this assignment.' });
    }

    // AI INTEGRATION: Fetch all PREVIOUS submissions for this specific assignment
    const previousSubmissions = await Submission.find({ assignment: assignmentId });
    
    // Convert Node.js relative paths to absolute paths so Python can find them
    const backendRootDir = path.resolve(__dirname, '..'); 
    const existingFilePaths = previousSubmissions.map(sub => path.join(backendRootDir, sub.fileUrl));
    const newFilePath = path.join(backendRootDir, req.file.path);

    // AI INTEGRATION: Send the paths to your Python FastAPI server
    let similarityScore = null;
    let matchedStudentId = null; // Variable to hold the copied student's ID

    try {
      const aiResponse = await axios.post('http://127.0.0.1:8000/check-similarity', {
        new_file_path: newFilePath,
        existing_file_paths: existingFilePaths
      }, {timeout:60000});
      
      similarityScore = aiResponse.data.similarity_percentage;
      const highestMatchFile = aiResponse.data.highest_match_file;

      console.log(`AI Similarity Score: ${similarityScore}%`);

      // NEW LOGIC: Match the returned file path to the original student
      if (similarityScore > 0 && highestMatchFile) {
        const matchedSubmission = previousSubmissions.find(sub => 
          path.join(backendRootDir, sub.fileUrl) === highestMatchFile
        );
        
        if (matchedSubmission) {
          matchedStudentId = matchedSubmission.student; 
        }
      }

    } catch (aiError) {
      console.error("Failed to connect to Python AI Engine. Ensure FastAPI is running on port 8000.");
    }

    // Create the new submission with the AI Score AND the Matched Student
    const newSubmission = new Submission({
      assignment: assignmentId,
      student: req.user._id,
      course: courseId,
      fileUrl: req.file.path,
      similarityScore: similarityScore, 
      matchedWith: matchedStudentId 
    });

    await newSubmission.save();

    res.status(201).json({ success: true, submission: newSubmission });
  } catch (error) {
    console.error("Submission error:", error);
    res.status(500).json({ message: 'Server error during file submission' });
  }
};

// 3. Fetch all submissions for a specific assignment (Teacher View)
exports.getAssignmentSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ assignment: req.params.assignmentId })
      .populate('student', 'name rollNumber email') 
      .populate('matchedWith', 'name') // POPULATE the copied student's name for the frontend
      .sort({ createdAt: -1 }); 

    const assignment = req.resource;
    res.status(200).json(submissions.map(s=>({...s.toObject(),timing:s.createdAt > assignment.deadline ? 'late':'on-time'})));
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ message: 'Error fetching submissions' });
  }
};

exports.reviewSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    // Flip the status to reviewed
    submission.status = 'reviewed'; 
    await submission.save();

    res.status(200).json({ success: true, submission });
  } catch (error) {
    console.error("Error marking submission as reviewed:", error);
    res.status(500).json({ message: 'Server error updating status' });
  }
};
// Generate source passages on demand, so comparison text is not duplicated in MongoDB.
exports.getComparison = async (req,res) => {
 try {
  const submission=req.resource;
  const peers=await Submission.find({assignment:submission.assignment,_id:{$ne:submission._id}}).populate('student','name');
  const root=path.resolve(__dirname,'..');
  const response=await axios.post('http://127.0.0.1:8000/compare-passages',{
   new_file_path:path.join(root,submission.fileUrl),existing_file_paths:peers.map(s=>path.join(root,s.fileUrl))
  },{timeout:60000});
  const data=response.data;
  data.matches=data.matches.map(m=>({...m,student:peers.find(s=>path.join(root,s.fileUrl)===m.file)?.student?.name || 'Student',file:undefined}));
  res.json(data);
 }catch(e){res.status(503).json({message:'Document comparison is unavailable. Check the similarity service and that both documents contain readable text.'});}
};
