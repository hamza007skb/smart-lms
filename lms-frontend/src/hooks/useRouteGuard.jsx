import { useAuth } from '../context/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'

/**
 * Protects any route requiring authentication.
 * Optionally restricts to a specific role: 'student' | 'teacher'
 */
export function RequireAuth({ children, role }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--off-white)]">
        <span className="text-[var(--plum-500)] font-serif text-2xl animate-pulse">
          Loading…
        </span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (role && user.role !== role) {
    // Redirect to the user's correct dashboard
    return <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher' : '/student'} replace />
  }

  return children
}

/**
 * Redirects already-authenticated users away from auth pages.
 */
export function RedirectIfAuth({ children }) {
  const { user, loading } = useAuth()

  if (loading) return null

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher' : '/student'} replace />
  }

  return children
}
