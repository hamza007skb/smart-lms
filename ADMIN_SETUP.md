# Administration and academic workflows

## Run locally

Use the existing MongoDB connection in `backend/.env` (`MONGO_URI`, `JWT_SECRET`, `PORT=9000`). Start the API with `npm run dev` in `backend`, the frontend with `npm run dev` in `lms-frontend`, and the similarity service with `uvicorn main:app --port 8000` in `backend/AI_Module` with its virtual environment active. Vite proxies both `/api` and `/uploads` to the API. Production hosting needs equivalent proxies.

## First administrator

From `backend`, set `ADMIN_EMAIL`, `ADMIN_NAME`, and `ADMIN_PASSWORD` in your local environment or ignored `.env`, then run:

```sh
npm run admin:create
```

The password must have at least 12 characters. This command creates one account and refuses to overwrite an existing email. Remove the bootstrap password from your environment after use. Sign in through the normal login page; administrators are routed to `/admin`.

Public registration creates students only. Administrators onboard teachers, students, and additional administrators, set initial passwords, assign departments, and manually assign unique roll numbers. Deactivate accounts with linked records rather than deleting their history.

## Academic setup

1. Create department tags.
2. Create teachers and students.
3. Create a planned semester with start/end dates. Starting and ending are explicit admin actions; dates do not trigger background jobs.
4. Create courses with a unique code, assigned teacher, semester, credit hours, capacity, and optional enrollment cutoff. Codes are unique across offerings; use a distinct code for each new offering.
5. Assign timetable slots. Overlapping slots for the same teacher or course in the same semester are rejected. There are no venues.
6. Start the semester. Students can join active courses using their join code until the cutoff or capacity is reached.
7. Teachers manage assignments, lecture PDFs/videos, threaded discussions, attendance, and marks for their assigned courses.
8. Teachers publish final results after saving a grade record for every enrolled student. Publication closes enrollment, publishes and locks grade/result records, and makes course metadata immutable. Check all marks first: unentered assessments count as zero. There is intentionally no teacher unlock action.
9. End the semester after all enrolled students in every course have published final results. Courses remain available for reading but academic writes are blocked.

A semester is a lightweight grouping of course offerings, not a department curriculum or offered-course catalog. Courses without a semester remain readable for compatibility. Assign legacy courses a semester through the admin portal before publishing results.

## Grading policy

The server owns the assessment configuration and calculation in `backend/services/grading.js`:

| Component | Weight |
| --- | ---: |
| Four quizzes | 15% (3.75% each) |
| Four assignments | 10% (2.5% each) |
| Midterm | 25% |
| Final exam | 40% |
| Presentation | 5% |
| Attendance marks | 5% |

Presentation and attendance each receive five percentage points previously allocated to the final exam. Attendance marks are entered by the teacher; the attendance register does not automatically award academic marks. Approved Leave is excluded from the displayed attendance percentage.

Each component contributes `obtained / total × weight`. Letter/GPA bands are A:85+/4.0, A-:80+/3.7, B+:75+/3.3, B:70+/3.0, B-:65+/2.7, C+:60+/2.3, C:55+/2.0, D:50+/1.7, F:below 50/0.0. Classification uses the unrounded total. Display totals are rounded to two decimals.

Semester GPA and CGPA use `sum(course GPA × credit hours) / sum(credit hours)` over published, locked results, including failed courses. There is no repeat-course replacement policy; each offering counts. Current provisional marks remain visible on the course marks page; only published finals appear in the semester record. Uploaded assignments and the four gradebook assignment slots remain independent.

Fees are one flat record per student. Remaining balance is calculated from total minus paid; fees have no semester link or installment schedule. Students see their balance under Results & Fees.

## Similarity and passage comparison

The existing TF-IDF score compares against earlier uploads to the same assignment. Failed analysis is saved as `null` and shown as “Not analyzed,” while the upload remains saved.

Teachers can open “Compare matching passages” in Submissions. This compares against all other students' files for the same assignment and highlights exact normalized word sequences of at least eight words, with the matching student's source excerpts. Highlights are evidence for teacher review, not proof of copying or a paraphrase detector. Extraction requires text-based PDFs or DOCX files; there is no OCR. Node and Python must share access to the uploaded files. Restart FastAPI after updating its code.

On-time/late labels compare the stored submission creation timestamp with the current assignment deadline; editing the deadline can change the label.

## Existing data and checks

Before deploying against an existing database, run `npm run db:check` in `backend`. This read-only check reports duplicate student/course grade records and legacy courses lacking codes or semester assignments. Resolve duplicate records before enabling the new unique grade index; the application does not delete or merge existing academic data. Back up existing data before a production migration. Existing marks use the new weighting policy, and new presentation/attendance marks start at zero.

Run:

```sh
# backend
npm test
# backend/AI_Module (using the installed virtual environment)
python -m unittest test_similarity.py
# lms-frontend
npm run build
```

Automated backend tests use model stubs and schema validation. They do not replace a full MongoDB-backed acceptance run. No existing database, accounts, or marks were modified as part of implementation verification.
