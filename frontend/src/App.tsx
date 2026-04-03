import './index.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import CoursesPage from './pages/CoursesPage'
import CourseDetailPage from './pages/CourseDetailPage'
import LearnPage from './pages/LearnPage'
import QuizPage from './pages/QuizPage'
import TeacherDashboard from './pages/TeacherDashboard'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function ProtectedTeacher({ children }: { children: React.ReactNode }) {
  const { user, loading, isTeacher } = useAuth()
  if (loading) return <div className="spinner"><div className="spinner-dot" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (!isTeacher) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />
        <Route path="/learn/:lessonId" element={<LearnPage />} />
        <Route path="/quiz/:quizId" element={<QuizPage />} />
        <Route path="/teacher" element={
          <ProtectedTeacher>
            <TeacherDashboard />
          </ProtectedTeacher>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
