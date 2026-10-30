import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function TeacherSidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const navItems = [
    { to: '/teacher',             label: 'Dashboard',       icon: '⊞', end: true },
    { to: '/teacher/submissions', label: 'Submissions',     icon: '📄' },
    { to: '/teacher/courses',     label: 'Courses',         icon: '📚' },
    { to: '/teacher/take-attendance', label: 'Take Attendance', icon: '📝' },
  ]

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside
      className="flex flex-col h-full transition-all duration-300 shadow-xl z-50 relative"
      style={{
        width: collapsed ? '80px' : '240px',
        background: 'var(--plum-950)',
        borderRight: '1px solid var(--plum-900)',
        flexShrink: 0,
      }}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between px-5 py-6"
           style={{ borderBottom: '1px solid var(--plum-800)' }}>
        {!collapsed && (
          <span className="font-serif text-2xl text-white font-bold tracking-wide">Academica</span>
        )}
        <button
          onClick={onToggle}
          className="ml-auto p-1.5 rounded-lg transition-colors hover:bg-[var(--plum-800)]"
          style={{ color: 'var(--plum-300)' }}
          aria-label="Toggle sidebar"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* USER PROFILE */}
      <div className="flex items-center gap-4 px-5 py-5"
           style={{ borderBottom: '1px solid var(--plum-800)' }}>
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-inner"
             style={{ background: 'var(--plum-600)', color: 'var(--cream)' }}>
          {user?.name?.[0]?.toUpperCase() || 'T'}
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate text-white">
              {user?.name || 'Teacher'}
            </p>
            <p className="text-[10px] uppercase tracking-wider font-bold mt-0.5" style={{ color: 'var(--plum-400)' }}>
              Teacher Account
            </p>
          </div>
        )}
      </div>

      {/* NAVIGATION SECTION */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-6">
        <nav className="space-y-1.5">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all relative overflow-hidden group ${
                  isActive ? 'font-bold bg-[var(--plum-900)]' : 'font-medium hover:bg-[var(--plum-900)] hover:bg-opacity-50'
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? 'white' : 'var(--plum-300)'
              })}
            >
              {({ isActive }) => (
                <>
                  {/* The Active Highlight Bar on the left edge */}
                  {isActive && !collapsed && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]"></div>
                  )}
                  
                  <span className={`text-lg flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-[var(--plum-300)] group-hover:text-white'}`}>
                    {item.icon}
                  </span>
                  
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* LOGOUT BUTTON */}
      <div className="px-4 pb-6 pt-4 border-t" style={{ borderColor: 'var(--plum-800)' }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-3 py-3 rounded-xl text-sm transition-all font-bold shadow-sm"
          style={{ background: 'var(--plum-800)', color: 'var(--plum-200)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = '#dc2626' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--plum-200)'; e.currentTarget.style.background = 'var(--plum-800)' }}
        >
          <span className="flex-shrink-0 text-base">⎋</span>
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}