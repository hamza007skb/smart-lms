# Smart LMS — Academica

Academica is a learning management system with administrator, teacher, and student portals. It supports courses, semesters, assignments, document similarity checks, lectures, discussions, attendance, grading, semester results, timetable slots, and student fee tracking.

## Contents

1. [Architecture and responsibilities](#1-architecture-and-responsibilities)
2. [Requirements](#2-requirements)
3. [First-time setup](#3-first-time-setup)
4. [Start the servers](#4-start-the-servers)
5. [Create the first administrator](#5-create-the-first-administrator)
6. [Daily startup and shutdown](#6-daily-startup-and-shutdown)
7. [Complete academic workflow](#7-complete-academic-workflow)
8. [Administrator guide](#8-administrator-guide)
9. [Teacher guide](#9-teacher-guide)
10. [Student guide](#10-student-guide)
11. [Grading and CGPA](#11-grading-and-cgpa)
12. [Data structure and checks](#12-data-structure-and-checks)
13. [Troubleshooting](#13-troubleshooting)
14. [Current scope and limitations](#14-current-scope-and-limitations)

## 1. Architecture and responsibilities

Run three application servers alongside MongoDB. Each application server needs its own terminal tab.

| Component | What it does | Local address |
| --- | --- | --- |
| React frontend | Login, role-based portals, forms, navigation, tables, and comparison UI | http://localhost:5173 |
| Express backend | Authentication, permissions, business rules, database operations, uploads, and API responses | http://localhost:9000 |
| Python FastAPI service | Extract text, calculate TF-IDF similarity, and identify matching passages | http://localhost:8000 |
| MongoDB | Store users, academic records, enrollment, marks, fees, and file references | Local instances normally use port 27017; Atlas uses its connection string |

```text
Browser / React frontend (5173)
        |
        | /api and /uploads through the Vite development proxy
        v
Express API (9000)
        |-- MongoDB: application records
        |-- backend/uploads/: uploaded files
        `-- FastAPI (8000): similarity and passage comparison
```

The admin portal uses `/admin`, teachers use `/teacher`, and students use `/student`. All three portals belong to the same frontend; they do not need separate servers or ports.

### Repository structure

```text
Smart-Lms/
├── README.md                         # This guide
├── ADMIN_SETUP.md                    # Additional admin/policy notes
├── backend/
│   ├── server.js                     # Express entry point
│   ├── .env                          # Private local configuration
│   ├── controllers/                  # Request handling and business rules
│   ├── routes/                       # API endpoints
│   ├── middleware/                   # Authentication and access checks
│   ├── models/                       # Mongoose database schemas
│   ├── services/grading.js            # Weights, totals, letters, and GPA
│   ├── scripts/                      # Admin creation and data preflight
│   ├── tests/                        # Backend tests
│   ├── uploads/                      # Assignment, submission, lecture files
│   └── AI_Module/
│       ├── main.py                   # FastAPI document analysis
│       ├── requirements.txt          # Python dependencies
│       ├── test_similarity.py        # Similarity tests
│       └── .venv/                    # Local Python environment
└── lms-frontend/
    ├── vite.config.js                # Development proxy configuration
    └── src/
        ├── App.jsx                   # Frontend routes
        ├── context/AuthContext.jsx   # Session and authenticated requests
        ├── components/               # Shared UI and comparison tools
        └── pages/                    # Admin, teacher, student, login screens
```

## 2. Requirements

Install these before setup:

- **Node.js 22 LTS and npm:** a suitable baseline for the current backend dependencies, including Mongoose.
- **Python 3.11:** use this version for compatibility with the pinned Python requirements.
- **MongoDB:** an accessible local instance or MongoDB Atlas database.
- A browser and terminal. The commands below target **macOS with zsh**.

Check the runtimes:

```bash
node --version
npm --version
python3.11 --version
```

> Commands use the current checkout at `/Users/skb/Desktop/waaj/smart-lms/Smart-Lms`. If you move the project, replace that prefix with its new location.

## 3. First-time setup

### Step 1 — Install backend dependencies

```bash
cd /Users/skb/Desktop/waaj/smart-lms/Smart-Lms/backend
npm install
```

### Step 2 — Configure environment variables

Create or edit `backend/.env`. Preserve existing working credentials.

For local MongoDB:

```dotenv
MONGO_URI=mongodb://127.0.0.1:27017/smart_lms
JWT_SECRET=replace_with_a_long_random_secret
PORT=9000
```

For Atlas, use your database's connection string as `MONGO_URI`, including the database name. Ensure your database user and Atlas network access allow your machine to connect.

To generate a JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copy the generated value into `JWT_SECRET`. Keep `.env` private. Changing this secret invalidates existing tokens.

### Step 3 — Install frontend dependencies

```bash
cd /Users/skb/Desktop/waaj/smart-lms/Smart-Lms/lms-frontend
npm install
```

The local frontend needs no API URL variable: Vite already proxies `/api` and `/uploads` to port **9000**.

### Step 4 — Set up Python

```bash
cd /Users/skb/Desktop/waaj/smart-lms/Smart-Lms/backend/AI_Module
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

If a working environment already exists at this location, activate it without recreating it. If the project was moved and `.venv` no longer works, recreate it in the new location and reinstall requirements. Virtual environments contain location-dependent paths.

### Step 5 — Make MongoDB available

- **Local MongoDB:** start the MongoDB service using the method appropriate to your installation.
- **Atlas:** no local MongoDB process is required; confirm database credentials and network access.

For an existing database, run the read-only preflight before starting the API:

```bash
cd /Users/skb/Desktop/waaj/smart-lms/Smart-Lms/backend
npm run db:check
```

This reports duplicate student/course grade pairs and courses missing codes or semesters. Resolve duplicate grade records before enabling the unique grade index. The command does not migrate or delete data.

## 4. Start the servers

Open **three terminal tabs**. Leave each command running in its own tab.

### Terminal 1 — Python similarity service, port 8000

```bash
cd /Users/skb/Desktop/waaj/smart-lms/Smart-Lms/backend/AI_Module
source .venv/bin/activate
python -m uvicorn main:app --reload --port 8000
```

Expected output includes:

```text
Uvicorn running on http://127.0.0.1:8000
```

Verify the service at http://localhost:8000/. Its interactive API documentation is at http://localhost:8000/docs.

### Terminal 2 — Express API, port 9000

```bash
cd /Users/skb/Desktop/waaj/smart-lms/Smart-Lms/backend
npm run dev
```

Confirm both messages appear; their order can vary:

```text
Server is running on port 9000
Successfully connected to MongoDB
```

The listening message alone does not confirm database connectivity. Open http://localhost:9000/ to see `Smart LMS API is running...`.

### Terminal 3 — React frontend, port 5173

```bash
cd /Users/skb/Desktop/waaj/smart-lms/Smart-Lms/lms-frontend
npm run dev -- --port 5173 --strictPort
```

Open **http://localhost:5173** to use the app.

The explicit command keeps the frontend on 5173 and reports an error if the port is occupied. Plain `npm run dev` also works, but Vite can choose another available port.

### Verify the running services

From an extra terminal:

```bash
curl http://localhost:9000/
curl http://localhost:8000/
```

Both should return health responses, and the frontend should show the login page. The API address does not serve the portal UI.

## 5. Create the first administrator

There is no automatically seeded admin or guaranteed demo account. Create the first administrator once, after configuring MongoDB.

1. Open another terminal tab.
2. Run the following **zsh** commands.
3. Enter an email, display name, and password of at least **12 characters** when prompted. Password input is hidden.

```bash
cd /Users/skb/Desktop/waaj/smart-lms/Smart-Lms/backend
read "ADMIN_EMAIL?Admin email: "
read "ADMIN_NAME?Admin display name: "
read -s "ADMIN_PASSWORD?Admin password (at least 12 characters): "
echo
export ADMIN_EMAIL ADMIN_NAME ADMIN_PASSWORD
npm run admin:create
unset ADMIN_EMAIL ADMIN_NAME ADMIN_PASSWORD
```

4. Confirm `Administrator created` appears.
5. Open http://localhost:5173/login and enter those credentials.
6. The app redirects you to `/admin`.

The script refuses to overwrite an existing email. Public registration creates **students only**. Admins create teacher accounts and additional administrators through **Users**.

## 6. Daily startup and shutdown

After first-time setup, do not reinstall dependencies, recreate the environment, or recreate the admin each day.

1. Ensure MongoDB is available.
2. Start Python in Terminal 1.
3. Start Express in Terminal 2.
4. Start React in Terminal 3.
5. Open http://localhost:5173 and sign in.

Use the three command blocks in [Start the servers](#4-start-the-servers).

To stop the app, press **Ctrl+C in each server terminal**. Run `deactivate` afterward in the Python terminal if desired. Database records and files remain saved. A separately managed local MongoDB service stays running until you stop it through its own service controls.

## 7. Complete academic workflow

```text
Admin creates departments and user accounts
  → Admin plans a semester
  → Admin creates courses and assigns teachers, credits, capacity, and cutoffs
  → Admin assigns timetable slots and student fees
  → Admin starts the semester
  → Students join courses using join codes
  → Teachers post assignments, announcements, and lecture materials
  → Students discuss, access materials, and submit work
  → Python analyzes submissions
  → Teachers inspect matches, mark attendance, and enter grades
  → Teachers publish and lock final results
  → Students view semester GPA and CGPA
  → Admin ends the semester
```

**Example:** Create department `CS`, teacher/student accounts, and a planned `Fall 2026` semester. Create a three-credit course `CS201-F26` and assign its teacher. Start the semester and share the join code. Complete coursework and grading, publish final results, then end the semester after all courses are ready.

Semester dates are reference values. Starting and ending require explicit administrator actions; no background scheduler performs these transitions automatically.

## 8. Administrator guide

Sign in as an administrator to access the following tabs.

| Tab | How to use it | Purpose |
| --- | --- | --- |
| Overview | Read the summary cards and setup guidance | Monitor student, teacher, course, and active-semester counts |
| Users | Add/edit users, roles, departments, roll numbers, passwords, active status | Onboard and manage accounts |
| Courses | Add/edit courses, teachers, semesters, credit hours, capacity, cutoffs | Manage course offerings |
| Departments | Add/edit a name and unique code | Tag users and courses |
| Semesters | Add a planned semester and use start/end actions | Control the academic lifecycle |
| Timetable | Add course/day/start/end slots | Assign course schedules without venues |
| Fees | Set total fee and cumulative paid amount for a student | Track flat balances |

### Onboard teachers and students

1. Open **Users → Add user**.
2. Enter name, email, initial password, and role.
3. Select a department if needed. Enter a unique student roll number where applicable.
4. Save the account and provide its credentials through your usual secure process.
5. Use **Edit** for later changes. Leave the password blank to keep it unchanged.

Portal-created user passwords require at least eight characters. Roll numbers are manually assigned and unique when provided. Users with linked academic records cannot be deleted through the protected deletion flow; deactivate them instead. The update flow prevents disabling your own or the last active administrator account.

### Create and assign courses

1. Open **Courses → Add course**.
2. Enter a name and unique course code, such as `CS201-F26`.
3. Select an active teacher, optional department, and semester.
4. Enter credit hours, capacity, and an optional enrollment deadline.
5. Choose **active** to permit joining once the semester is active; **draft** and **closed** block enrollment.
6. Save and share the generated join code with eligible students.

Teachers cannot create or assign courses. Course codes are unique across offerings: use a new code for a new semester offering. Capacity cannot drop below enrollment. Linked records prevent deletion. Published course metadata is protected; create another offering for the next semester.

### Start and end semesters

1. Add a semester with name, start date, and end date; it starts as **planned**.
2. Assign courses and teachers.
3. Click **Start semester** to make it **active**.
4. Let students join active courses before cutoffs or capacity limits.
5. Ask teachers to publish final results for every enrolled student.
6. Click **End semester** after all courses are ready.

Ending is blocked if required final results are missing. An ended semester closes courses and blocks academic writes while keeping records readable. These actions do not automatically create courses or student fees.

### Assign timetable slots

Open **Timetable → Add time slot**, select a course and weekday, and enter start/end times. Add multiple slots when needed. Overlapping slots for the same teacher or course in the same semester are rejected. Students and teachers see slots inside the course. Replace a slot by deleting it and adding the corrected one.

### Track student fees

Open **Fees → Set student fee**, select a student, and enter total and paid amounts. Use **Edit** to update the cumulative paid amount.

```text
Remaining balance = Total fee − Paid amount
```

Paid amount must be between zero and total fee. This records a balance; it does not process payments, installments, or PDF challans.

## 9. Teacher guide

### Dashboard and courses

The dashboard shows assigned courses, course enrollment counts, pending submissions, average available similarity scores, and recent activity. Students enrolled in multiple courses contribute to multiple enrollment counts.

Open **Courses → Manage course** for an assigned classroom. Contact the admin for course assignment, credit hours, course codes, and semesters.

### Announcements

Create an announcement in the course management screen, enter the message, and post it. Use its edit action to change it. Students read announcements in the course stream.

### Assignments and submissions

1. Create an assignment inside the course.
2. Enter title, instructions, deadline, total marks, and an optional reference attachment.
3. Post it for students.
4. Open assignment submissions, or choose **Submissions** and select course/assignment.
5. Download student work and inspect timing, similarity, and pending/flagged filters.
6. Click **Mark as Reviewed** when finished reviewing.

Assignment attachments and student submissions support PDF/DOCX files up to 20 MB. A student is intended to submit once per assignment. Late uploads are accepted and labeled by comparing their creation time with the current deadline. Editing a deadline can change the label.

**Reviewing a submission does not enter its grade.** Enter marks separately in the gradebook.

### Inspect highlighted matching passages

1. In **Submissions**, select the course and assignment.
2. Review the similarity percentage and matching student, when available.
3. Click **Compare matching passages** next to the submission.
4. Select a matching student from the dialog.
5. Read the highlighted submitted text and corresponding source excerpts.
6. Close the dialog and complete your review.

The percentage uses TF-IDF cosine similarity against earlier uploads to the same assignment. The comparison dialog checks all other submissions to that assignment for exact normalized sequences of at least eight words. Scores of 75% or higher are flagged.

Shared instructions and citations may match. Highlights are evidence for review, not proof of misconduct. This feature does not search the internet or detect AI writing/paraphrases. Text-based PDFs or DOCX files are needed; there is no OCR. Failed analysis can leave the upload saved with an unavailable score.

### Lecture materials

In **Lecture materials** inside a course:

1. Enter a lecture title.
2. Upload a PDF, MP4, or WebM file up to 100 MB, or enter an HTTPS link and select PDF/video type.
3. Click **Add lecture**.
4. Use **Remove** to remove a listing when needed.

Students open the material from the same course section. Removing a listing does not imply physical file cleanup.

### Course discussions

In **Course discussions**, post a question/comment or click **Reply** on a comment to create a thread. Teachers can remove discussion content in their courses. A removed comment with replies keeps a placeholder to preserve the thread.

### Attendance

1. Open **Take Attendance** and select the course.
2. Choose a new date or an existing register.
3. Click student statuses to cycle **Present → Absent → Leave**.
4. Save; saving an existing date replaces that date's records.
5. Review history and present counts.

Approved Leave is excluded from the student's displayed attendance percentage. A missing entry on a saved course sheet is reported as absent. Attendance marks in the gradebook are entered separately; the register does not award academic marks automatically.

### Enter and publish grades

1. Open the course gradebook/results action.
2. Select a quiz, assignment slot, midterm, final, presentation, or attendance assessment.
3. Set total marks and enter each student's obtained marks.
4. Save and repeat for remaining assessments.
5. Review weighted totals, letters, and GPA.
6. Click **Publish final results** and confirm only when final.

Publication requires an active semester and a saved grade record for every enrolled student. It closes enrollment and publishes/locks grade and legacy result records. Unentered assessments count as zero. There is no teacher unlock action.

Uploaded assignments and the four gradebook assignment slots are independent: enter the corresponding marks manually.

## 10. Student guide

### Register and join courses

1. Use an admin-created account, or choose **Create an account** to register as a student.
2. Sign in and click **Join Course** on the dashboard.
3. Enter the teacher/admin-provided join code.
4. Open the course card or sidebar course link.

Joining requires an active course and, when assigned, an active semester. The server also checks cutoff, capacity, and existing enrollment. Contact the admin if these conditions block joining.

### Use the classroom

Inside the course, read announcements and assignments, download attachments, open lectures, view timetable slots, post/reply in discussions, and open **My Attendance** or **My Marks**. You can remove your own comments; replies preserve the thread placeholder when applicable.

### Submit an assignment

1. Open the assignment from the stream.
2. Read instructions/deadline and download reference material.
3. Select a PDF or DOCX file up to 20 MB.
4. Click **Turn In Assignment** and wait for completion.
5. Review confirmation, on-time/late status, and available similarity score.

The UI prevents a second submission once one exists. If analysis is unavailable, the confirmation can still indicate a saved file.

### View attendance and marks

- **My Attendance:** daily statuses, classes attended, and percentage. Leave is excluded from the denominator. A warning appears below 75% when classes exist.
- **My Marks:** assessment marks, totals, weights, course percentage, letter, and GPA. These remain provisional until publication.

### Semester results, CGPA, and fees

Open **Results & Fees** from the sidebar to view:

- Published course results grouped by semester.
- Credit hours, percentages, letter grades, and course GPAs.
- Semester GPA, CGPA, and graded credit hours.
- Assigned total fee, paid amount, and remaining balance.

Only published, locked results contribute to the semester record and CGPA. An empty record can mean results have not yet been published; check My Marks for provisional coursework.

## 11. Grading and CGPA

`backend/services/grading.js` owns the shared configuration and calculations.

| Assessment | Weight |
| --- | ---: |
| Four quizzes | 15% total; 3.75% each |
| Four assignment slots | 10% total; 2.5% each |
| Midterm | 25% |
| Final exam | 40% |
| Presentation | 5% |
| Attendance marks | 5% |
| **Total** | **100%** |

```text
Assessment contribution = (Obtained marks / Total marks) × Weight
Course percentage = Sum of assessment contributions
Semester GPA = Sum(Course GPA × Credits) / Sum(Semester graded credits)
CGPA = Sum(Course GPA × Credits) / Sum(All graded credits)
```

| Course percentage | Letter | GPA |
| --- | --- | ---: |
| 85 or higher | A | 4.0 |
| 80 to below 85 | A− | 3.7 |
| 75 to below 80 | B+ | 3.3 |
| 70 to below 75 | B | 3.0 |
| 65 to below 70 | B− | 2.7 |
| 60 to below 65 | C+ | 2.3 |
| 55 to below 60 | C | 2.0 |
| 50 to below 55 | D | 1.7 |
| Below 50 | F | 0.0 |

Classification uses the unrounded percentage; display totals are rounded to two decimals. Failed published courses count. Each offering counts; there is no repeat-course replacement policy.

**Example:** a three-credit course with GPA 4.0 and a one-credit course with GPA 2.0 give `(3 × 4.0 + 1 × 2.0) / 4 = 3.50`.

## 12. Data structure and checks

| Model/storage | Purpose |
| --- | --- |
| User | Identity, password hash, role, active status, department, roll number |
| Department | Department name/code tags |
| Semester | Name, dates, lifecycle status |
| Course | Teacher, student IDs, semester, department, credits, code, join code, capacity, cutoff |
| Assignment | Instructions, deadline, marks, attachment path |
| Submission | Student/assignment/course, file path, similarity, matching student, review status |
| Announcement | Course stream messages |
| Lecture | PDF/video material listings |
| Discussion | Author/course comments and parent references |
| Attendance | Daily sheets and embedded student statuses |
| Grade | Current gradebook, totals, publication, locking |
| Result | Separate legacy assessment records; current gradebook screens use Grade |
| Timetable | Course/day/time slots |
| Fee | One student total/paid record; derived balance |
| backend/uploads/ | Actual files; database records store their paths |

### Backend tests

```bash
cd /Users/skb/Desktop/waaj/smart-lms/Smart-Lms/backend
npm test
```

Tests use schema validation and model stubs; a full MongoDB-backed acceptance run remains a separate check.

### Similarity tests

```bash
cd /Users/skb/Desktop/waaj/smart-lms/Smart-Lms/backend/AI_Module
source .venv/bin/activate
python -m unittest test_similarity.py
```

### Frontend build

```bash
cd /Users/skb/Desktop/waaj/smart-lms/Smart-Lms/lms-frontend
npm run build
```

Output goes to `lms-frontend/dist/`. `npm run preview` previews the build but does not start Express, Python, or MongoDB. The API/upload proxy is configured for the development server; production and build preview require suitable backend routing.

### Existing data preflight

```bash
cd /Users/skb/Desktop/waaj/smart-lms/Smart-Lms/backend
npm run db:check
```

Back up data before migration. Resolve duplicate grade pairs and assign legacy courses codes/semesters. Existing marks use current weights; presentation/attendance start at zero when not entered. See [ADMIN_SETUP.md](ADMIN_SETUP.md) for additional notes.

## 13. Troubleshooting

| Problem | What to check |
| --- | --- |
| Directory not found | Use the current checkout path and exact `lms-frontend` / `AI_Module` names |
| Node/npm/Python not found | Install the required runtime and reopen Terminal |
| Vite/nodemon not found | Run `npm install` in the appropriate frontend/backend folder |
| Python module/uvicorn missing | Activate `.venv`, install requirements, use `python -m uvicorn` |
| Python packages fail to install | Recreate the environment with Python 3.11 for pinned dependencies |
| Environment breaks after moving | Recreate `.venv` in the new location and reinstall requirements |
| API runs but database actions fail | Check MongoDB success log, service/Atlas access, and `MONGO_URI` |
| Port occupied / EADDRINUSE | Stop the earlier server instance before starting another |
| Frontend chooses 5174 | 5173 is occupied; use the printed URL or stop the conflict and use strictPort |
| API/upload requests fail | Confirm backend is on 9000 and Vite proxy settings match |
| Similarity unavailable | Run Python on 8000, check service logs, readable document text, and shared file access |
| Login fails | Use an account created in this database; no guaranteed demo credentials exist |
| Teacher cannot register | Admin must onboard teachers through Users |
| Join rejected | Check status, semester, cutoff, capacity, spelling, and existing enrollment |
| Publish blocked | Course needs an active semester and grade records for every enrolled student |
| Grade edit blocked | Published results are locked; ended-semester records are read-only |
| End semester blocked | Publish finals for every enrolled student in every course |
| Semester results empty | Only published, locked results appear; use My Marks for provisional grades |
| Delete blocked | Linked records are protected; deactivate a user or close a course |
| Duplicate key error | Check unique emails, roll numbers, codes, semester names, and grade pairs |
