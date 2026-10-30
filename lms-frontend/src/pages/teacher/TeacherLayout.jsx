import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import TeacherSidebar from '../../components/shared/TeacherSidebar'

export default function TeacherLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--off-white)' }}>
      <TeacherSidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-8 py-4 flex-shrink-0"
                style={{ background: 'white', borderBottom: '1px solid var(--warm-gray)' }}>
          <div />
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: 'var(--plum-100)', color: 'var(--plum-700)' }}>
              Teacher
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-8 page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
