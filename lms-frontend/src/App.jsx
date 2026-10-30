import AdminPortal from './pages/admin/AdminPortal';
import AcademicRecord from './pages/student/AcademicRecord';
import { Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth, RedirectIfAuth } from "./hooks/useRouteGuard";

// Auth pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Teacher pages
import TeacherLayout from "./pages/teacher/TeacherLayout";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import Submissions from "./pages/teacher/Submissions";
import TeacherCourses from "./pages/teacher/TeacherCourses";
import ManageCourse from "./pages/teacher/ManageCourse";
import TakeAttendancePage from "./pages/teacher/TakeAttendancePage";
import ManageResults from "./pages/teacher/ManageResults";

// Student pages
import StudentMarks from './pages/student/StudentMarks'; 
import StudentLayout from "./pages/student/StudentLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentSubmission from "./pages/student/StudentSubmission";
import StudentCourseView from "./pages/student/StudentCourseView";
import StudentAttendance from "./pages/student/StudentAttendance";

export default function App() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth routes — redirect if already logged in */}
      <Route
        path="/login"
        element={
          <RedirectIfAuth>
            <LoginPage />
          </RedirectIfAuth>
        }
      />
      <Route
        path="/register"
        element={
          <RedirectIfAuth>
            <RegisterPage />
          </RedirectIfAuth>
        }
      />

      <Route path="/admin/*" element={<RequireAuth role="admin"><AdminPortal /></RequireAuth>} />
      {/* Teacher routes */}
      <Route
        path="/teacher"
        element={
          <RequireAuth role="teacher">
            <TeacherLayout />
          </RequireAuth>
        }
      >
        <Route index element={<TeacherDashboard />} />
        
        {/* 🚨 THE FIX: Both submission URLs now successfully point to your Submissions page! */}
        <Route path="submissions" element={<Submissions />} />
        <Route path="assignment/:assignmentId/submissions" element={<Submissions />} />
        
        <Route path="courses" element={<TeacherCourses />} />
        <Route path="take-attendance" element={<TakeAttendancePage />} />
        <Route path="course/:id" element={<ManageCourse />} />
        <Route path="course/:id/grades" element={<ManageResults />} />
      </Route>

      {/* Student routes */}
      <Route
        path="/student"
        element={
          <RequireAuth role="student">
            <StudentLayout />
          </RequireAuth>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="courses" element={<StudentDashboard />} />
        <Route path="results" element={<AcademicRecord />} />
        <Route path="course/:id" element={<StudentCourseView />} />
        <Route path="submit/:assignmentId" element={<StudentSubmission />} />
        <Route path="course/:id/attendance" element={<StudentAttendance />} />
        
        {/* Fixed this path so it perfectly matches the nested student structure */}
        <Route path="course/:id/marks" element={<StudentMarks />} />
      </Route>

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}