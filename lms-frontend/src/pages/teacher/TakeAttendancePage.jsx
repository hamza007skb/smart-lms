import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import TakeAttendance from './TakeAttendance'

export default function TakeAttendancePage() {
  const { authFetch } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await authFetch('/api/courses/teacher')
        if (!res.ok) throw new Error('Failed to load courses')
        const data = await res.json()
        setCourses(data)
      } catch (err) {
        console.error(err)
        setError(err.message || 'Error')
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [authFetch])

  if (loading) return <div className="p-6">Loading courses...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="max-w-4xl">
      <h1 className="font-serif text-2xl mb-4" style={{ color: 'var(--plum-950)' }}>Take Attendance</h1>

      {!selectedCourse ? (
        <div className="space-y-3">
          <p className="text-sm text-[var(--plum-500)]">Select a course to mark attendance for:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {courses.length === 0 ? (
              <div className="p-4 bg-white rounded-lg border" style={{ borderColor: 'var(--plum-200)' }}>No active courses.</div>
            ) : (
              courses.map(c => (
                <button
                  key={c._id}
                  onClick={() => setSelectedCourse(c)}
                  className="text-left p-4 rounded-lg bg-white border hover:bg-[var(--cream)] transition-colors"
                  style={{ borderColor: 'var(--plum-100)', color: 'var(--plum-900)' }}
                >
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-[var(--plum-400)] mt-1">{c.code || ''}</div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl" style={{ color: 'var(--plum-950)' }}>{selectedCourse.name}</h2>
              <p className="text-sm text-[var(--plum-500)]">Mark attendance for enrolled students.</p>
            </div>
            <div>
              <button onClick={() => setSelectedCourse(null)} className="px-3 py-1 rounded-md border hover:bg-gray-100">Back</button>
            </div>
          </div>

          <TakeAttendance course={selectedCourse} onCancel={() => setSelectedCourse(null)} />
        </div>
      )}
    </div>
  )
}
