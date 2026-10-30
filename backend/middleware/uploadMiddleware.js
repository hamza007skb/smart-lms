const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the 'uploads' directory physically exists in your backend
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure where and how to save the incoming PDFs
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    // Add a timestamp so files with the same name don't overwrite each other
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// THIS is the exact word your route file is looking for!
exports.upload = multer({ storage: storage });