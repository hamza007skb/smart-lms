# Academica LMS — Frontend

React + Vite + Tailwind CSS frontend for the Academica Learning Management System.

## Tech Stack
- **React 18** — functional components + hooks
- **React Router v6** — nested routes + role-based guards
- **Vite** — fast dev server with API proxy
- **Tailwind CSS** — utility-first styling
- **DM Serif Display + DM Sans** — typography

## Color Palette
| Token | Value | Usage |
|---|---|---|
| `--plum-950` | `#1a0d24` | Page text, headings |
| `--plum-800` | `#3a234f` | Primary buttons, sidebar |
| `--plum-600` | `#5e3f7e` | Accents, links |
| `--plum-100` | `#ede7f5` | Badges, chips |
| `--off-white` | `#f9f8f6` | Page background |
| `--cream`     | `#f2f0eb` | Card backgrounds, inputs |

## Project Structure
```
src/
├── App.jsx                        # Router with all route definitions
├── main.jsx                       # Entry point
├── index.css                      # Global styles + CSS variables
├── context/
│   └── AuthContext.jsx            # JWT auth state + helpers
├── hooks/
│   └── useRouteGuard.jsx          # RequireAuth + RedirectIfAuth
├── components/
│   ├── shared/
│   │   ├── TeacherSidebar.jsx
│   │   └── StudentSidebar.jsx
│   ├── teacher/
│   │   └── SimilarityBadge.jsx    # AI score badge (red >75%)
│   └── student/
│       └── FileUploadZone.jsx     # Drag-and-drop uploader
└── pages/
    ├── LoginPage.jsx
    ├── RegisterPage.jsx
    ├── teacher/
    │   ├── TeacherLayout.jsx      # Sidebar shell + <Outlet>
    │   ├── TeacherDashboard.jsx
    │   ├── Submissions.jsx        # Table with AI similarity scores
    │   └── TeacherCourses.jsx
    └── student/
        ├── StudentLayout.jsx
        ├── StudentDashboard.jsx   # Course cards + progress bars
        ├── SubmitAssignment.jsx   # Drag-drop upload form
        └── StudentCourses.jsx
```

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (proxies /api → http://localhost:9000)
npm run dev

# Build for production
npm run build
```

## Connecting to the Backend

All API calls use the `authFetch` helper from `AuthContext`, which automatically
attaches the `Authorization: Bearer <token>` header.

Replace the mock data in these files with real `authFetch` calls:
- `Submissions.jsx` → `GET /api/submissions`
- `TeacherDashboard.jsx` → `GET /api/dashboard/teacher`
- `StudentDashboard.jsx` → `GET /api/dashboard/student`
- `SubmitAssignment.jsx` → `POST /api/submissions` (multipart/form-data)

Expected JWT payload: `{ id, name, email, role: 'teacher' | 'student' }`
