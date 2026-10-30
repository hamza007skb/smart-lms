const {
  test,
  afterEach
} = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const {
  assessments,
  calculate
} = require('../services/grading');
const Course = require('../models/Course');
const Grade = require('../models/Grade');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Fee = require('../models/Fee');
const access = require('../middleware/courseAccess');
const controller = require('../controllers/gradeController');
const courseController = require('../controllers/courseController');
const authController = require('../controllers/authController');
function response() {
  return {
    code: 200,
    status(code) {
      this.code = code;
      return this;
    },
    json(value) {
      this.value = value;
      return this;
    }
  };
}
const originals = [];
function stub(object, key, fn) {
  originals.push([object, key, object[key]]);
  object[key] = fn;
}
afterEach(() => {
  while (originals.length) {
    const [o, k, f] = originals.pop();
    o[k] = f;
  }
});
test('assessment weights total 100 and include presentation and attendance', () => {
  assert.equal(assessments.reduce((s, a) => s + a.weight, 0), 100);
  assert(assessments.some(a => a.category === 'presentation'));
});
test('weighted total, letter grade and GPA use unrounded marks', () => {
  const full = {
    quizzes: [10, 10, 10, 10],
    quizTotals: [10, 10, 10, 10],
    assignments: [10, 10, 10, 10],
    assignmentTotals: [10, 10, 10, 10],
    midterm: 100,
    midtermTotal: 100,
    final: 100,
    finalTotal: 100,
    presentation: 10,
    presentationTotal: 10,
    attendance: 10,
    attendanceTotal: 10
  };
  assert.deepEqual(calculate(full), {
    total: 100,
    letterGrade: 'A',
    gpa: 4
  });
  assert.deepEqual(calculate({}), {
    total: 0,
    letterGrade: 'F',
    gpa: 0
  });
  const eighty = structuredClone(full);
  for (const key of ['quizzes', 'assignments']) eighty[key] = [8, 8, 8, 8];
  Object.assign(eighty, {
    midterm: 80,
    final: 80,
    presentation: 8,
    attendance: 8
  });
  assert.deepEqual(calculate(eighty), {
    total: 80,
    letterGrade: 'A-',
    gpa: 3.7
  });
  assert.equal(calculate({
    final: 1000,
    finalTotal: 100
  }).total, 40);
});
test('new schema fields validate roles, leave, credit hours and fees', () => {
  const student = new mongoose.Types.ObjectId(),
    course = new mongoose.Types.ObjectId();
  assert.equal(new Attendance({
    course,
    date: '2026-10-25',
    records: [{
      student,
      status: 'Leave'
    }]
  }).validateSync(), undefined);
  assert(new Attendance({
    course,
    date: '2026-10-25',
    records: [{
      student,
      status: 'Excused'
    }]
  }).validateSync());
  assert.equal(new User({
    name: 'Admin',
    email: 'admin@example.test',
    password: 'hashed',
    role: 'admin'
  }).validateSync(), undefined);
  assert(new Course({
    name: 'Course',
    teacher: student,
    joinCode: 'ABC123',
    creditHours: 0
  }).validateSync());
  assert.equal(new Fee({
    student,
    totalFee: 500,
    paidAmount: 125
  }).toJSON().remainingBalance, 375);
  assert(Grade.schema.indexes().some(([index, options]) => index.course === 1 && index.student === 1 && options.unique));
});
test('course access rejects another teacher and unenrolled student', async () => {
  stub(Course, 'findById', () => ({
    populate: async () => ({
      _id: 'course',
      teacher: 'owner',
      students: ['enrolled']
    })
  }));
  for (const user of [{
    _id: 'other',
    role: 'teacher'
  }, {
    _id: 'other',
    role: 'student'
  }]) {
    const res = response();
    let next = false;
    await access({
      params: {
        courseId: 'course'
      },
      user,
      method: 'GET'
    }, res, () => next = true);
    assert.equal(res.code, 403);
    assert.equal(next, false);
  }
});
test('ended semester permits reading but rejects writes', async () => {
  stub(Course, 'findById', () => ({
    populate: async () => ({
      _id: 'course',
      teacher: 'owner',
      students: [],
      semester: {
        status: 'ended'
      }
    })
  }));
  const res = response();
  await access({
    params: {
      courseId: 'course'
    },
    user: {
      _id: 'owner',
      role: 'teacher'
    },
    method: 'POST'
  }, res, () => assert.fail());
  assert.equal(res.code, 409);
  let next = false;
  await access({
    params: {
      courseId: 'course'
    },
    user: {
      _id: 'owner',
      role: 'teacher'
    },
    method: 'GET'
  }, response(), () => next = true);
  assert.equal(next, true);
});
test('public registration cannot create teachers or administrators', async () => {
  for (const role of ['teacher', 'admin']) {
    const res = response();
    await authController.register({
      body: {
        role
      }
    }, res);
    assert.equal(res.code, 403);
  }
});
test('enrollment checks deadline before modifying a course', async () => {
  stub(Course, 'findOne', async () => ({
    _id: 'course',
    status: 'active',
    enrollmentDeadline: new Date('2000-01-01')
  }));
  stub(Course, 'findOneAndUpdate', () => assert.fail('Expired course must not be updated'));
  const res = response();
  await courseController.joinCourse({
    body: {
      joinCode: 'ABC123'
    },
    user: {
      _id: 'student'
    }
  }, res);
  assert.equal(res.code, 409);
});
test('capacity check and duplicate prevention are part of the enrollment update', async () => {
  stub(Course, 'findOne', async () => ({
    _id: 'course',
    status: 'active',
    capacity: 2,
    students: []
  }));
  stub(Course, 'findOneAndUpdate', async (filter, update) => {
    assert.deepEqual(filter.$expr, {
      $lt: [{
        $size: '$students'
      }, {
        $ifNull: ['$capacity', 50]
      }]
    });
    assert.equal(filter.students.$ne, 'student');
    assert.deepEqual(update, {
      $addToSet: {
        students: 'student'
      }
    });
    return null;
  });
  const res = response();
  await courseController.joinCourse({
    body: {
      joinCode: 'ABC123'
    },
    user: {
      _id: 'student'
    }
  }, res);
  assert.equal(res.code, 409);
});
test('locked results reject teacher edits before database writes', async () => {
  stub(Grade, 'exists', async () => true);
  stub(Grade, 'findOneAndUpdate', () => assert.fail());
  const res = response();
  await controller.bulkSaveAssessment({
    body: {
      courseId: 'course',
      category: 'presentation',
      totalField: 'presentationTotal',
      index: null,
      totalMarks: 10,
      records: [{
        studentId: 'student',
        mark: 8
      }]
    },
    course: {
      students: ['student']
    }
  }, res);
  assert.equal(res.code, 409);
});
test('invalid marks and arbitrary assessment fields are rejected', async () => {
  const base = {
    courseId: 'course',
    category: 'presentation',
    totalField: 'presentationTotal',
    index: null,
    totalMarks: 10,
    records: [{
      studentId: 'student',
      mark: 11
    }]
  };
  for (const body of [base, {
    ...base,
    category: 'locked'
  }, {
    ...base,
    records: [{
      studentId: 'outsider',
      mark: 5
    }]
  }]) {
    const res = response();
    await controller.bulkSaveAssessment({
      body,
      course: {
        students: ['student']
      }
    }, res);
    assert.equal(res.code, 400);
  }
});
test('publishing requires a grade record for every enrolled student', async () => {
  stub(Grade, 'find', async () => []);
  stub(Grade, 'updateMany', () => assert.fail());
  const res = response();
  await controller.publish({
    course: {
      _id: 'course',
      semester: {
        status: 'active'
      },
      students: ['student']
    }
  }, res);
  assert.equal(res.code, 409);
});
test('publication locks and publishes grade and legacy result records', async () => {
  stub(Course, 'updateOne', async () => ({}));
  stub(Grade, 'find', async () => [{}]);
  const writes = [];
  stub(Grade, 'updateMany', async (filter, update) => writes.push(update));
  const Result = require('../models/Result');
  stub(Result, 'updateMany', async (filter, update) => writes.push(update));
  const res = response();
  await controller.publish({
    course: {
      _id: 'course',
      semester: {
        status: 'active'
      },
      students: ['student']
    }
  }, res);
  assert.equal(res.code, 200);
  assert.equal(writes.length, 2);
  for (const w of writes) {
    assert.equal(w.$set.locked, true);
    assert.equal(w.$set.published, true);
  }
});
function handler(router, path, method = 'post') {
  return router.stack.find(s => s.route?.path === path && s.route.methods[method]).route.stack.at(-1).handle;
}
test('admin onboarding hashes teacher passwords and never returns the hash', async () => {
  const router = require('../routes/adminRoutes');
  let stored;
  stub(User, 'create', async data => {
    stored = data;
    return {
      toObject: () => ({
        ...data,
        _id: 'teacher'
      })
    };
  });
  const res = response();
  await handler(router, '/users')({
    body: {
      name: 'Teacher',
      email: 'teacher@example.test',
      role: 'teacher',
      password: 'a-secure-password'
    }
  }, res);
  assert.equal(res.code, 201);
  assert.equal(stored.role, 'teacher');
  assert.notEqual(stored.password, 'a-secure-password');
  assert.equal(await require('bcryptjs').compare('a-secure-password', stored.password), true);
  assert.equal(res.value.password, undefined);
});
test('admin cannot disable their own account', async () => {
  const router = require('../routes/adminRoutes');
  stub(User, 'findById', async () => ({
    _id: 'admin',
    role: 'admin'
  }));
  const res = response();
  await handler(router, '/users/:id', 'put')({
    params: {
      id: 'admin'
    },
    user: {
      _id: 'admin'
    },
    body: {
      active: false
    }
  }, res);
  assert.equal(res.code, 400);
});
test('ending a semester is blocked until all enrolled results are published', async () => {
  const router = require('../routes/adminRoutes'),
    Semester = require('../models/Semester');
  let saved = false;
  stub(Semester, 'findById', async () => ({
    _id: 'semester',
    status: 'active',
    save: async () => saved = true
  }));
  stub(Course, 'find', async () => [{
    _id: 'course',
    name: 'Algorithms',
    students: ['one', 'two']
  }]);
  stub(Grade, 'countDocuments', async () => 1);
  const res = response();
  await handler(router, '/semesters/:id/:operation')({
    params: {
      id: 'semester',
      operation: 'end'
    }
  }, res);
  assert.equal(res.code, 400);
  assert.equal(saved, false);
  assert.match(res.value.message, /Algorithms/);
});
test('semester lifecycle starts planned semesters and closes completed courses', async () => {
  const router = require('../routes/adminRoutes'),
    Semester = require('../models/Semester');
  const semester = {
    _id: 'semester',
    status: 'planned',
    save: async () => {}
  };
  stub(Semester, 'findById', async () => semester);
  const start = response();
  await handler(router, '/semesters/:id/:operation')({
    params: {
      id: 'semester',
      operation: 'start'
    }
  }, start);
  assert.equal(semester.status, 'active');
  assert.equal(start.code, 200);
  stub(Course, 'find', async () => [{
    _id: 'course',
    students: ['student']
  }]);
  stub(Grade, 'countDocuments', async () => 1);
  let closed = false;
  stub(Course, 'updateMany', async (filter, update) => {
    closed = update.$set.status === 'closed';
  });
  const end = response();
  await handler(router, '/semesters/:id/:operation')({
    params: {
      id: 'semester',
      operation: 'end'
    }
  }, end);
  assert.equal(semester.status, 'ended');
  assert.equal(closed, true);
  assert.equal(end.code, 200);
});
test('flat fee endpoint rejects overpayment', async () => {
  const router = require('../routes/adminRoutes');
  stub(User, 'exists', async () => true);
  stub(Fee, 'findOneAndUpdate', () => assert.fail());
  const res = response();
  await handler(router, '/fees/:studentId', 'put')({
    params: {
      studentId: 'student'
    },
    body: {
      totalFee: 100,
      paidAmount: 101
    }
  }, res);
  assert.equal(res.code, 400);
});
test('academic record groups semesters and weights CGPA by credit hours', async () => {
  const router = require('../routes/academicRoutes');
  const full = {
    quizzes: [10, 10, 10, 10],
    quizTotals: [10, 10, 10, 10],
    assignments: [10, 10, 10, 10],
    assignmentTotals: [10, 10, 10, 10],
    midterm: 100,
    midtermTotal: 100,
    final: 100,
    finalTotal: 100,
    presentation: 10,
    presentationTotal: 10,
    attendance: 10,
    attendanceTotal: 10
  };
  stub(Grade, 'find', filter => {
    assert.equal(filter.published, true);
    assert.equal(filter.locked, true);
    return {
      populate: async () => [{
        ...full,
        course: {
          _id: 'a',
          name: 'Algorithms',
          creditHours: 3,
          semester: {
            _id: 'fall',
            name: 'Fall',
            startDate: '2026-09-01'
          }
        }
      }, {
        course: {
          _id: 'b',
          name: 'Calculus',
          creditHours: 1,
          semester: {
            _id: 'spring',
            name: 'Spring',
            startDate: '2026-01-01'
          }
        }
      }]
    };
  });
  stub(Fee, 'findOne', async () => null);
  const res = response();
  await handler(router, '/my-record', 'get')({
    user: {
      _id: 'student'
    }
  }, res);
  assert.equal(res.value.creditHours, 4);
  assert.equal(res.value.cgpa, 3);
  assert.equal(res.value.semesters[0].name, 'Fall');
  assert.equal(res.value.semesters[0].gpa, 4);
  assert.equal(res.value.semesters[1].gpa, 0);
});
test('saving a quiz initializes complete arrays before applying marks', async () => {
  stub(Grade, 'exists', async () => false);
  const writes = [];
  stub(Grade, 'findOneAndUpdate', async (filter, update) => {
    writes.push({
      filter,
      update
    });
    return {};
  });
  const res = response();
  await controller.bulkSaveAssessment({
    body: {
      courseId: new mongoose.Types.ObjectId(),
      category: 'quizzes',
      totalField: 'quizTotals',
      index: 2,
      totalMarks: 20,
      records: [{
        studentId: '507f1f77bcf86cd799439011',
        mark: 16
      }]
    },
    course: {
      students: ['507f1f77bcf86cd799439011']
    }
  }, res);
  assert.equal(res.code, 200);
  assert.deepEqual([...writes[0].update.$setOnInsert.quizzes], [0, 0, 0, 0]);
  assert.equal(writes[1].update.$set['quizzes.2'], 16);
  assert.deepEqual(writes[1].filter.locked, {
    $ne: true
  });
});
