const COURSES = [
  { id: '1', title: 'Data Structures',  teacher: 'Dr. Amina Khan',    enrolled: 48, progress: 72 },
  { id: '2', title: 'Algorithms',        teacher: 'Prof. Tariq Saeed', enrolled: 35, progress: 55 },
  { id: '3', title: 'Web Engineering',   teacher: 'Dr. Sara Baig',     enrolled: 59, progress: 88 },
]

export default function StudentCourses() {
  return (
    <div className="max-w-4xl">
      <h1 className="font-serif text-4xl mb-1" style={{ color: 'var(--plum-950)' }}>My Courses</h1>
      <p className="text-sm mb-10" style={{ color: 'var(--plum-500)' }}>All your enrolled courses this semester.</p>

      <div className="grid gap-5 md:grid-cols-2">
        {COURSES.map(c => (
          <div key={c.id} className="rounded-xl p-6"
               style={{ background: 'white', border: '1px solid var(--warm-gray)' }}>
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                   style={{ background: 'var(--plum-100)' }}>📚</div>
              <div>
                <p className="font-medium" style={{ color: 'var(--plum-900)' }}>{c.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--plum-400)' }}>{c.teacher}</p>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--plum-500)' }}>
                <span>Completion</span><span>{c.progress}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--plum-100)' }}>
                <div className="h-full rounded-full" style={{ width: `${c.progress}%`, background: 'var(--plum-600)' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
