import CourseLearning from '../../components/shared/CourseLearning';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function StudentCourseView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]); // NEW: State for real-time announcements
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClassroomData = async () => {
      try {
        // 1. Fetch Course Details
        const courseRes = await authFetch(`/api/courses/${id}`);
        if (courseRes.ok) setCourse(await courseRes.json());

        // 2. Fetch Assignments for this course
        const assignRes = await authFetch(`/api/assignments/${id}`);
        if (assignRes.ok) setAssignments(await assignRes.json());
        
        // 3. NEW: Fetch Announcements for this course
        const annRes = await authFetch(`/api/announcements/${id}`);
        if (annRes.ok) setAnnouncements(await annRes.json());

      } catch (error) {
        console.error("Failed to fetch classroom data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClassroomData();
  }, [id, authFetch]);

  if (loading) return <div className="p-8 text-[var(--plum-500)]">Loading classroom stream...</div>;
  if (!course) return <div className="p-8 text-red-600">Course not found.</div>;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <button onClick={() => navigate('/student')} className="mb-6 text-sm font-medium text-[var(--plum-600)] hover:opacity-70">
        ← Back to Dashboard
      </button>

      {/* Course Header Banner */}
      <div className="p-8 rounded-xl mb-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-end gap-6" style={{ background: 'var(--plum-900)', color: 'white' }}>
        <div className="relative z-10">
          <h1 className="font-serif text-4xl mb-2">{course.name}</h1>
          <p className="text-[var(--plum-200)] text-sm">
            {course.teacher?.name ? `Professor ${course.teacher.name}` : 'Course Instructor'}
          </p>
        </div>
        
        {/* Quick Links to Separate Pages */}
        <div className="relative z-10 flex gap-3 w-full md:w-auto">
          <Link 
            to={`/student/course/${id}/attendance`}
            className="flex-1 md:flex-none px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-medium backdrop-blur-sm transition-colors text-center"
          >
            📊 My Attendance
          </Link>
          <Link 
            to={`/student/course/${id}/marks`}
            className="flex-1 md:flex-none px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-medium backdrop-blur-sm transition-colors text-center"
          >
            🎓 My Marks
          </Link>
        </div>

        {/* Decorative background shape */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
      </div>

      {/* The Classroom Stream */}
      <div className="space-y-6">
        <h2 className="font-serif text-2xl mb-4" style={{ color: 'var(--plum-900)' }}>Classroom Stream</h2>

        {/* DYNAMIC ANNOUNCEMENTS LIST */}
        {announcements.length > 0 && (
          <div className="space-y-4 mb-8">
            {announcements.map((ann) => (
              <div key={ann._id} className="p-6 rounded-xl border bg-white shadow-sm" style={{ borderColor: 'var(--plum-100)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-[var(--plum-100)] text-[var(--plum-800)]">
                    {course.teacher?.name ? course.teacher.name[0].toUpperCase() : 'P'}
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--plum-950)' }}>
                      {course.teacher?.name ? `Prof. ${course.teacher.name}` : 'Professor'} posted an announcement
                    </p>
                    <p className="text-xs uppercase tracking-wider font-bold mt-0.5" style={{ color: 'var(--plum-500)' }}>
                      {new Date(ann.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <p className="text-sm md:pl-13 whitespace-pre-wrap" style={{ color: 'var(--plum-900)' }}>
                  {ann.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* DYNAMIC ASSIGNMENTS LIST */}
        {assignments.length === 0 ? (
          <p className="text-sm text-[var(--plum-500)] py-4 text-center border-2 border-dashed rounded-xl border-[var(--plum-200)]">
            No assignments posted yet.
          </p>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const deadlineDate = new Date(assignment.deadline);
              return (
                <div key={assignment._id} className="p-6 rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow group flex flex-col md:flex-row justify-between items-start md:items-center gap-4" style={{ borderColor: 'var(--warm-gray)' }}>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--cream)] border text-lg" style={{ borderColor: 'var(--plum-200)', color: 'var(--plum-600)' }}>
                      📋
                    </div>
                    <div>
                      <h3 className="font-medium text-lg mb-1" style={{ color: 'var(--plum-950)' }}>{assignment.title}</h3>
                      <div className="flex flex-wrap gap-3 text-xs font-medium">
                        <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                          Due: {deadlineDate.toLocaleDateString()} at {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-gray-50 border" style={{ color: 'var(--plum-500)' }}>
                          Max Marks: {assignment.totalMarks || 100}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Link 
                    to={`/student/submit/${assignment._id}`}
                    className="w-full md:w-auto px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-colors text-center shadow-sm hover:shadow"
                    style={{ background: 'var(--plum-800)' }}
                  >
                    Submit Work →
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <CourseLearning courseId={id} />
    </div>
  );
}