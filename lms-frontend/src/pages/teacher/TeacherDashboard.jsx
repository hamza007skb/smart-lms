import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'

// Helper function to make database timestamps look nice
const formatTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
};

export default function TeacherDashboard() {
  const { user, authFetch } = useAuth()
  const navigate = useNavigate()
  
  const [stats, setStats] = useState({
    courses: 0,
    students: 0,
    pending: 0, 
    aiScore: '0%' 
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch compiled stats directly from our new backend endpoint
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Ensure this URL matches the route you created in Step 1!
        const res = await authFetch('/api/courses/dashboard-stats'); 
        if (res.ok) {
          const data = await res.json();
          setStats({
            courses: data.courses,
            students: data.students,
            pending: data.pending,
            aiScore: data.aiScore
          });
          setRecentActivity(data.recentActivity);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [authFetch]);
  
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const goToTakeAttendance = () => navigate('/teacher/take-attendance')

  if (loading) {
    return <div className="p-10 text-center text-sm" style={{ color: 'var(--plum-500)' }}>Loading dashboard data...</div>
  }

  return (
    <div className="max-w-5xl relative">
      <h1 className="font-serif text-4xl mb-1" style={{ color: 'var(--plum-950)' }}>
        {getGreeting()}, {user?.name?.split(' ')[0] || 'Professor'}
      </h1>
      <p className="text-sm mb-10" style={{ color: 'var(--plum-500)' }}>
        Here's what's happening in your courses today.
      </p>

      {/* Dynamic Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="rounded-xl p-5" style={{ background: 'white', border: '1px solid var(--warm-gray)' }}>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--plum-400)' }}>Active Courses</p>
          <p className="font-serif text-3xl mb-0.5" style={{ color: 'var(--plum-900)' }}>{stats.courses}</p>
          <p className="text-xs" style={{ color: 'var(--plum-400)' }}>This semester</p>
        </div>
        <div className="rounded-xl p-5" style={{ background: 'white', border: '1px solid var(--warm-gray)' }}>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--plum-400)' }}>Total Students</p>
          <p className="font-serif text-3xl mb-0.5" style={{ color: 'var(--plum-900)' }}>{stats.students}</p>
          <p className="text-xs" style={{ color: 'var(--plum-400)' }}>Enrolled</p>
        </div>
        <div className="rounded-xl p-5" style={{ background: 'white', border: '1px solid var(--warm-gray)' }}>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--plum-400)' }}>Pending Submissions</p>
          <p className="font-serif text-3xl mb-0.5" style={{ color: 'var(--plum-900)' }}>{stats.pending}</p>
          <p className="text-xs" style={{ color: 'var(--plum-400)' }}>Awaiting review</p>
        </div>
        <div className="rounded-xl p-5" style={{ background: 'white', border: '1px solid var(--warm-gray)' }}>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--plum-400)' }}>Avg AI Score</p>
          <p className="font-serif text-3xl mb-0.5" style={{ color: 'var(--plum-900)' }}>{stats.aiScore}</p>
          <p className="text-xs" style={{ color: 'var(--plum-400)' }}>Similarity index</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
        
        {/* Take Attendance */}
        <div onClick={goToTakeAttendance}
            className="flex items-center justify-between p-5 rounded-xl transition-all group cursor-pointer"
            style={{ background: 'white', border: '1px solid var(--warm-gray)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--plum-400)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--warm-gray)'}>
          <div>
            <p className="font-medium mb-1" style={{ color: 'var(--plum-900)' }}>Take Attendance</p>
            <p className="text-xs" style={{ color: 'var(--plum-400)' }}>Mark daily registers</p>
          </div>
          <span className="text-2xl transition-transform group-hover:translate-x-1" style={{ color: 'var(--plum-400)' }}>→</span>
        </div>

        {/* Review Submissions */}
        <Link to="/teacher/submissions"
              className="flex items-center justify-between p-5 rounded-xl transition-all group"
              style={{ background: 'white', border: '1px solid var(--warm-gray)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--plum-400)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--warm-gray)'}>
          <div>
            <p className="font-medium mb-1" style={{ color: 'var(--plum-900)' }}>Review Submissions</p>
            <p className="text-xs" style={{ color: 'var(--plum-400)' }}>{stats.pending} assignments pending</p>
          </div>
          <span className="text-2xl transition-transform group-hover:translate-x-1" style={{ color: 'var(--plum-400)' }}>→</span>
        </Link>

        {/* Manage Courses */}
        <Link to="/teacher/courses"
              className="flex items-center justify-between p-5 rounded-xl transition-all group"
              style={{ background: 'white', border: '1px solid var(--warm-gray)' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--plum-400)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--warm-gray)'}>
          <div>
            <p className="font-medium mb-1" style={{ color: 'var(--plum-900)' }}>Manage Courses</p>
            <p className="text-xs" style={{ color: 'var(--plum-400)' }}>{stats.courses} active this semester</p>
          </div>
          <span className="text-2xl transition-transform group-hover:translate-x-1" style={{ color: 'var(--plum-400)' }}>→</span>
        </Link>
      </div>

      {/* Recent activity */}
      <div className="rounded-xl" style={{ background: 'white', border: '1px solid var(--warm-gray)' }}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--warm-gray)' }}>
          <h2 className="font-serif text-xl" style={{ color: 'var(--plum-900)' }}>Recent Activity</h2>
        </div>
        <ul className="divide-y" style={{ '--tw-divide-opacity': 1, borderColor: 'var(--warm-gray)' }}>
          {recentActivity.length === 0 ? (
            <li className="px-6 py-8 text-center text-sm text-[var(--plum-400)]">
              No recent activity to display.
            </li>
          ) : (
            recentActivity.map((a) => (
              <li key={a._id} className="flex items-center justify-between px-6 py-4 hover:bg-[var(--cream)] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                       style={{ background: 'var(--plum-100)', color: 'var(--plum-800)' }}>
                    {a.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--plum-950)' }}>{a.name}</p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--plum-500)' }}>{a.course}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--plum-500)' }}>{formatTime(a.time)}</p>
                  <p className={`text-xs font-bold ${a.action.includes('Flagged') ? 'text-red-600' : 'text-[var(--plum-700)]'}`}>
                    {a.action}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}