// Read-only preflight. This does not migrate, delete, or change existing records.
require('dotenv').config();
const mongoose = require('mongoose');
(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    autoIndex: false
  });
  const Grade = require('../models/Grade'),
    Course = require('../models/Course');
  const duplicates = await Grade.aggregate([{
    $group: {
      _id: {
        course: '$course',
        student: '$student'
      },
      count: {
        $sum: 1
      }
    }
  }, {
    $match: {
      count: {
        $gt: 1
      }
    }
  }]);
  const legacy = await Course.countDocuments({
    $or: [{
      code: {
        $exists: false
      }
    }, {
      semester: null
    }]
  });
  console.log(JSON.stringify({
    duplicateGradePairs: duplicates,
    legacyCoursesNeedingCodeOrSemester: legacy
  }, null, 2));
  if (duplicates.length) {
    console.error('Resolve duplicate grade pairs before creating the course/student unique index. No records were changed.');
    process.exitCode = 1;
  }
})().catch(e => {
  console.error(e.message);
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
