import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function StudentSidebar({ collapsed, onToggle }) {
  const { user, logout, authFetch } = useAuth()
  const navigate = useNavigate()
  
  const [courses, setCourses] = useState([])
  const [isCoursesOpen, setIsCoursesOpen] = useState(true)

  // 1. Fetch the enrolled courses to populate the sidebar
  useEffect(() => {
    const fetchSidebarCourses = async () => {
      try {
        const res = await authFetch('/api/courses/student');
        if (res.ok) setCourses(await res.json());
      } catch (error) {
        console.error("Failed to load courses for sidebar", error);
      }
    };
    fetchSidebarCourses();
  }, [authFetch]);

  // 2. Global Navigation 
  const topNavItems = [
    { to: '/student', label: 'Dashboard', icon: '⊞', end: true },
    { to: '/student/results', label: 'Results & Fees', icon: '🎓' },
  ]

  return (
    <aside className="flex flex-col h-full transition-all duration-300 shadow-xl z-50 relative"
           style={{ width: collapsed ? '80px' : '240px', background: 'var(--plum-950)', flexShrink: 0 }}>
      
      {/* HEADER */}
      <div className="flex items-center justify-between px-5 py-6"
           style={{ borderBottom: '1px solid var(--plum-800)' }}>
        {!collapsed && <span className="font-serif text-2xl text-white font-bold tracking-wide">Academica</span>}
        <button onClick={onToggle} className="ml-auto p-1.5 rounded-lg transition-colors hover:bg-[var(--plum-800)]"
                style={{ color: 'var(--plum-300)' }} aria-label="Toggle sidebar">
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* USER PROFILE */}
      <div className="flex items-center gap-4 px-5 py-5"
           style={{ borderBottom: '1px solid var(--plum-800)' }}>
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-inner"
             style={{ background: 'var(--plum-600)', color: 'var(--cream)' }}>
          {user?.name?.[0]?.toUpperCase() || 'S'}
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate text-white">{user?.name || 'Student'}</p>
            <p className="text-[10px] uppercase tracking-wider font-bold mt-0.5" style={{ color: 'var(--plum-400)' }}>Student Account</p>
          </div>
        )}
      </div>

      {/* NAVIGATION SECTION */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-6">
        
        {/* Top Global Links */}
        <nav className="space-y-1">
          {topNavItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all ${isActive ? 'font-bold shadow-md' : 'font-medium hover:bg-[var(--plum-900)]'}`}
              style={({ isActive }) => ({ background: isActive ? 'var(--plum-800)' : 'transparent', color: isActive ? 'white' : 'var(--plum-300)' })}>
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Dynamic Enrolled Courses List with Dropdown Toggle */}
        <div className="mt-8">
          {!collapsed ? (
            <button 
              onClick={() => setIsCoursesOpen(!isCoursesOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 mb-2 rounded-lg group cursor-pointer outline-none transition-colors hover:bg-[var(--plum-900)]"
            >
              <div className="flex items-center gap-3">
                <span className="text-base flex-shrink-0" style={{ color: 'var(--plum-400)' }}>📚</span>
                <span className="text-xs font-bold uppercase tracking-wider transition-colors group-hover:text-white" style={{ color: 'var(--plum-400)' }}>
                  My Classes
                </span>
              </div>
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${isCoursesOpen ? 'rotate-180 text-white' : ''}`} 
                style={{ color: 'var(--plum-500)' }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          ) : (
            <div className="w-full border-t mb-4 mt-6" style={{ borderColor: 'var(--plum-800)' }}></div>
          )}
          
          {/* THE LIST */}
          <div className={`overflow-hidden transition-all duration-300 ${isCoursesOpen || collapsed ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <nav className="space-y-1.5">
              {courses.length > 0 ? (
                courses.map(course => (
                  <NavLink key={course._id} to={`/student/course/${course._id}`}
                    className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all relative overflow-hidden group ${isActive ? 'font-bold bg-[var(--plum-900)]' : 'font-medium hover:bg-[var(--plum-900)] hover:bg-opacity-50'}`}
                    style={({ isActive }) => ({ color: isActive ? 'white' : 'var(--plum-300)' })}
                  >
                    {({ isActive }) => (
                      <>
                        {/* The Active Highlight Bar on the left edge */}
                        {isActive && !collapsed && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]"></div>
                        )}
                        
                        {/* The Letter Icon */}
                        <span className={`text-xs font-bold flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${isActive ? 'bg-purple-500 text-white shadow-md' : 'bg-[var(--plum-800)] text-[var(--plum-300)] group-hover:bg-[var(--plum-700)] group-hover:text-white'}`}>
                          {course.name.charAt(0).toUpperCase()}
                        </span>
                        
                        {!collapsed && <span className="truncate">{course.name}</span>}
                      </>
                    )}
                  </NavLink>
                ))
              ) : (
                !collapsed && <p className="px-3 py-2 text-xs font-medium italic rounded-lg" style={{ color: 'var(--plum-500)', background: 'var(--plum-900)' }}>You haven't joined any classes yet.</p>
              )}
            </nav>
          </div>
        </div>
      </div>

      {/* LOGOUT BUTTON */}
      <div className="px-4 pb-6 pt-4 border-t" style={{ borderColor: 'var(--plum-800)' }}>
        <button onClick={() => { logout(); navigate('/login') }}
                className="w-full flex items-center justify-center gap-3 px-3 py-3 rounded-xl text-sm transition-all font-bold shadow-sm"
                style={{ background: 'var(--plum-800)', color: 'var(--plum-200)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = '#dc2626' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--plum-200)'; e.currentTarget.style.background = 'var(--plum-800)' }}>
          <span className="flex-shrink-0 text-base">⎋</span>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}