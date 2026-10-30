import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(() => localStorage.getItem('lms_token'))
  const [loading, setLoading] = useState(true)

  // On mount, rehydrate user from stored token
  useEffect(() => {
    const stored = localStorage.getItem('lms_user')
    if (stored && token) {
      try { setUser(JSON.parse(stored)) } catch { logout() }
    }
    setLoading(false)
  }, [])

const login = useCallback(async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    })
    
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || 'Login failed')
    }
    
    const data = await res.json()
    
    // ADD THIS: Safely extract the user object whether the backend nests it or not
    const userData = data.user || data; 

    // Update the rest of the lines to use 'userData' instead of 'data.user'
    localStorage.setItem('lms_token', data.token)
    localStorage.setItem('lms_user',  JSON.stringify(userData))
    setToken(data.token)
    setUser(userData)
    
    return userData // Now this will successfully return { role: "teacher" } !
  }, [])
  const register = useCallback(async (email, password, role, name) => {
    const res = await fetch('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password, role, name }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.message || 'Registration failed')
    }
    const data = await res.json()
    localStorage.setItem('lms_token', data.token)
    localStorage.setItem('lms_user',  JSON.stringify(data.user || data))
    setToken(data.token)
    setUser(data.user || data)
    return data.user || data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('lms_token')
    localStorage.removeItem('lms_user')
    setToken(null)
    setUser(null)
  }, [])

  // Attach token to every fetch automatically via a helper
  const authFetch = useCallback(async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    }
    const res = await fetch(url, { ...options, headers })
    if (res.status === 401) { logout(); throw new Error('Session expired') }
    return res
  }, [token, logout])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
