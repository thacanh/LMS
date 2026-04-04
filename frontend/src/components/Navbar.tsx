import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { BookOpen, GraduationCap, LogOut, Search, Bell } from 'lucide-react'

export default function Navbar() {
  const { user, logout, isTeacher } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Kiểm tra link đang active
  const isActive = (path: string) =>
    location.pathname.startsWith(path)
      ? 'text-primary font-bold border-b-2 border-primary pb-0.5'
      : 'text-slate-600 hover:text-primary transition-colors font-medium'

  return (
    <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm flex justify-between items-center px-6 lg:px-10 h-20 w-full border-b border-outline-variant">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-container rounded-lg flex items-center justify-center shadow-sm">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <span className="text-xl font-black tracking-tighter text-primary">LMS</span>
      </Link>

      {/* Điều hướng */}
      <nav className="hidden md:flex gap-6">
        <Link to="/courses" className={isActive('/courses')}>Khóa học</Link>
        {user && isTeacher && (
          <Link to="/teacher" className={isActive('/teacher')}>
            <span className="flex items-center gap-1">
              <GraduationCap className="w-4 h-4" /> Giảng viên
            </span>
          </Link>
        )}
      </nav>

      {/* Phần bên phải */}
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <button className="text-slate-500 hover:bg-slate-100 p-2 rounded-full transition-colors hidden lg:flex">
              <Bell className="w-5 h-5" />
            </button>
            {/* Thông tin người dùng */}
            <div className="hidden lg:flex items-center gap-2 bg-surface-container rounded-full px-3 py-1.5 border border-outline-variant">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                {isTeacher
                  ? <GraduationCap className="w-3.5 h-3.5 text-primary" />
                  : <BookOpen className="w-3.5 h-3.5 text-primary" />}
              </div>
              <span className="text-xs font-bold text-on-surface-variant">{user.full_name}</span>
            </div>
            <button
              id="logout-btn"
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container border border-outline-variant text-sm font-semibold text-on-surface-variant hover:bg-red-50 hover:text-primary hover:border-primary/30 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </>
        ) : (
          <>
            {/* Thanh tìm kiếm */}
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                className="bg-surface-container border border-outline-variant rounded-full pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 w-52 outline-none"
                placeholder="Tìm kiếm khóa học..."
                type="text"
                onClick={() => navigate('/courses')}
                readOnly
              />
            </div>
            <button
              id="signin-btn"
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant bg-white hover:bg-surface-container transition-all"
            >
              Đăng nhập
            </button>
            <button
              id="getstarted-btn"
              onClick={() => navigate('/register')}
              className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-br from-primary to-primary-container shadow-sm hover:shadow-md hover:opacity-90 transition-all"
            >
              Bắt đầu
            </button>
          </>
        )}
      </div>
    </header>
  )
}
