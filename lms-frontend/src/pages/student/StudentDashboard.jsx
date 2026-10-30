import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const { user, authFetch } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for the Join Course Modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, [authFetch]);

  // Fetch only the courses this student is enrolled in
  const fetchCourses = async () => {
    try {
      const res = await authFetch('/api/courses/student');
      if (res.ok) {
        setCourses(await res.json());
      }
    } catch (error) {
      console.error("Failed to load courses", error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleJoinCourse = async (e) => {
    e.preventDefault();
    setIsJoining(true);
    setJoinError('');

    try {
      const res = await authFetch('/api/courses/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to join course");

      setShowJoinModal(false);
      setJoinCode('');
      fetchCourses();
      alert(`Successfully joined ${data.course.name}!`);
      
    } catch (error) {
      setJoinError(error.message);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="max-w-5xl relative">
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="font-serif text-4xl mb-1" style={{ color: 'var(--plum-950)' }}>
          {getGreeting()}, {user?.name?.split(' ')[0] || 'Student'}
        </h1>
        <p className="text-sm" style={{ color: 'var(--plum-500)' }}>
          You have {courses.length} active {courses.length === 1 ? 'course' : 'courses'} this semester.
        </p>
      </div>

      {/* Courses Section Header */}
      <div className="flex justify-between items-center mb-6 border-b pb-4" style={{ borderColor: 'var(--warm-gray)' }}>
        <h2 className="font-serif text-2xl" style={{ color: 'var(--plum-900)' }}>My Enrolled Courses</h2>
        <button 
          onClick={() => setShowJoinModal(true)}
          className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-[var(--cream)]"
          style={{ borderColor: 'var(--plum-300)', color: 'var(--plum-800)' }}
        >
          + Join Course
        </button>
      </div>

      {/* Dynamic Courses Grid */}
      {loading ? (
        <div className="p-8 text-center text-sm" style={{ color: 'var(--plum-500)' }}>Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="p-12 text-center rounded-xl border-2 border-dashed" style={{ borderColor: 'var(--plum-200)' }}>
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--plum-900)' }}>You are not enrolled in any courses yet.</p>
          <p className="text-xs" style={{ color: 'var(--plum-500)' }}>Ask your teacher for a 6-digit Join Code.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <Link 
              to={`/student/course/${course._id}`} 
              key={course._id} 
              className="flex flex-col p-6 rounded-xl border bg-white transition-all hover:shadow-md hover:-translate-y-1 group"
              style={{ borderColor: 'var(--warm-gray)' }}
            >
              <div className="flex-grow">
                {/* Course Name on Top */}
                <h3 className="font-serif text-xl mb-1" style={{ color: 'var(--plum-950)' }}>
                  {course.name}
                </h3>
                {/* Professor Name Below */}
                <p className="text-sm mb-4" style={{ color: 'var(--plum-600)' }}>
                  {course.teacher?.name ? `Prof. ${course.teacher.name}` : 'Course Instructor'}
                </p>
              </div>
              
              {/* Clean Enter Button at the bottom of the card */}
              <div className="mt-4 pt-4 border-t flex justify-between items-center" style={{ borderColor: 'var(--plum-100)' }}>
                <span className="text-sm font-medium" style={{ color: 'var(--plum-800)' }}>Enter Classroom</span>
                <span className="text-xl transition-transform group-hover:translate-x-1" style={{ color: 'var(--plum-400)' }}>→</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* JOIN COURSE MODAL */}
      {showJoinModal && (
        // 🚨 THE FIX: Changed bg-[var(--plum-950)] to bg-black/50 so it actually looks like a transparent overlay!
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-2xl border border-[var(--plum-200)]">
            <h3 className="font-serif text-xl mb-2" style={{ color: 'var(--plum-950)' }}>Join a Course</h3>
            <p className="text-xs mb-6" style={{ color: 'var(--plum-500)' }}>Enter the 6-character code provided by your instructor.</p>
            
            {joinError && (
              <div className="mb-4 p-3 rounded text-xs bg-red-50 text-red-700 border border-red-200">
                {joinError}
              </div>
            )}

            <form onSubmit={handleJoinCourse}>
              <input 
                type="text" 
                required
                maxLength="6"
                placeholder="e.g. A1B2C3"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full p-3 border rounded-lg text-center font-mono text-lg tracking-[0.2em] uppercase mb-6 outline-none focus:border-[var(--plum-500)]"
              />
              
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 py-2 text-sm font-medium rounded-lg border hover:bg-gray-50"
                  style={{ color: 'var(--plum-700)' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isJoining || joinCode.length < 6}
                  className="flex-1 py-2 text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-50"
                  style={{ background: 'var(--plum-800)' }}
                >
                  {isJoining ? 'Joining...' : 'Join Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}