require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); 
const app = express();


// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// --- ROUTES ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/courses', require('./routes/courseRoutes')); 
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/submissions', require('./routes/submissionRoutes')); 
app.use('/api/attendance', require('./routes/attendanceRoutes')); //
app.use('/api/results', require('./routes/resultRoutes'));
app.use('/api/grades', require('./routes/gradeRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));

app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/learning', require('./routes/learningRoutes'));
app.use('/api/academic', require('./routes/academicRoutes'));

// Make the uploads folder publicly accessible 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((err, req, res, next) => { res.status(400).json({message:err.message || 'Request failed'}); });

// Basic test route
app.get('/', (req, res) => {
    res.send('Smart LMS API is running...');
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Successfully connected to MongoDB'))
    .catch((error) => console.error('MongoDB connection error:', error));

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});