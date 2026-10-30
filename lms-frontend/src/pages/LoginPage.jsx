import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login }    = useAuth()
  const navigate     = useNavigate()
  const location     = useLocation()
  const from         = location.state?.from?.pathname

  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      const dest  = from || (user.role === 'admin' ? '/admin' : user.role === 'teacher' ? '/teacher' : '/student')
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[var(--off-white)]">
      {/* Decorative left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-14"
           style={{ background: 'var(--plum-900)' }}>
        <div>
          <span className="font-serif text-3xl text-white tracking-tight">
            Academica
          </span>
          <span className="ml-2 text-[var(--plum-300)] text-sm font-light tracking-widest uppercase">
            LMS
          </span>
        </div>
        <div>
          <blockquote className="font-serif italic text-[var(--plum-200)] text-2xl leading-relaxed mb-6">
            "Education is not preparation for life; education is life itself."
          </blockquote>
          <cite className="text-[var(--plum-400)] text-sm not-italic">— John Dewey</cite>
        </div>
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-1 rounded-full flex-1"
                 style={{ background: i === 0 ? 'var(--plum-400)' : 'var(--plum-700)' }} />
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-8 page-enter">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10 text-center">
            <span className="font-serif text-3xl" style={{ color: 'var(--plum-900)' }}>
              Academica
            </span>
            <span className="ml-2 text-[var(--plum-500)] text-sm font-light tracking-widest uppercase">
              LMS
            </span>
          </div>

          <h1 className="font-serif text-4xl mb-2" style={{ color: 'var(--plum-950)' }}>
            Welcome back
          </h1>
          <p className="text-[var(--plum-600)] mb-10 text-sm">
            Sign in to access your dashboard.
          </p>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg text-sm"
                 style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium tracking-wider uppercase mb-2"
                     style={{ color: 'var(--plum-700)' }}>
                Email address
              </label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@university.edu"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={{
                  background:  'var(--cream)',
                  border:      '1.5px solid var(--warm-gray)',
                  color:       'var(--plum-950)',
                  fontFamily:  'DM Sans, sans-serif',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--plum-500)'}
                onBlur={e  => e.target.style.borderColor = 'var(--warm-gray)'}
              />
            </div>

            <div>
              <label className="block text-xs font-medium tracking-wider uppercase mb-2"
                     style={{ color: 'var(--plum-700)' }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all"
                style={{
                  background: 'var(--cream)',
                  border:     '1.5px solid var(--warm-gray)',
                  color:      'var(--plum-950)',
                  fontFamily: 'DM Sans, sans-serif',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--plum-500)'}
                onBlur={e  => e.target.style.borderColor = 'var(--warm-gray)'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-medium text-sm tracking-wide transition-all disabled:opacity-60"
              style={{
                background: loading ? 'var(--plum-400)' : 'var(--plum-800)',
                color:      'white',
              }}
              onMouseEnter={e => { if (!loading) e.target.style.background = 'var(--plum-700)' }}
              onMouseLeave={e => { if (!loading) e.target.style.background = 'var(--plum-800)' }}
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm" style={{ color: 'var(--plum-500)' }}>
            New to Academica?{' '}
            <Link to="/register"
                  className="font-medium underline underline-offset-2"
                  style={{ color: 'var(--plum-700)' }}>
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
