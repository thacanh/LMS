import { useState, useRef, useEffect, FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { BookOpen, GraduationCap, LogOut, Search, ChevronDown, User, KeyRound, Pencil } from 'lucide-react'

export default function Navbar() {
  const { user, logout, updateUser, isTeacher } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Dropdown trạng thái
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Modal cập nhật profile
  const [showModal, setShowModal] = useState(false)
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Khi mở modal, điền sẵn tên hiện tại
  const openModal = () => {
    setFullName(user?.full_name ?? '')
    setPassword('')
    setSaveMsg('')
    setShowModal(true)
    setDropdownOpen(false)
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveMsg('')
    try {
      const payload: { full_name?: string; password?: string } = {}
      if (fullName.trim() && fullName.trim() !== user?.full_name) payload.full_name = fullName.trim()
      if (password.trim()) payload.password = password.trim()
      if (Object.keys(payload).length === 0) { setSaveMsg('Không có thay đổi nào.'); return }
      await updateUser(payload)
      setSaveMsg('Đã cập nhật thành công!')
      setPassword('')
    } catch {
      setSaveMsg('Cập nhật thất bại. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  const isActive = (path: string) =>
    location.pathname.startsWith(path)
      ? 'text-primary font-bold border-b-2 border-primary pb-0.5'
      : 'text-slate-600 hover:text-primary transition-colors font-medium'

  return (
    <>
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
            /* ── Dropdown người dùng ── */
            <div className="relative" ref={dropdownRef}>
              <button
                id="user-menu-btn"
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 bg-surface-container rounded-full px-3 py-1.5 border border-outline-variant hover:border-primary/40 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  {isTeacher
                    ? <GraduationCap className="w-3.5 h-3.5 text-primary" />
                    : <BookOpen className="w-3.5 h-3.5 text-primary" />}
                </div>
                <span className="text-xs font-bold text-on-surface-variant hidden sm:inline">{user.full_name}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-outline-variant py-1.5 z-50">
                  {/* Thông tin */}
                  <div className="px-4 py-2.5 border-b border-outline-variant">
                    <p className="text-sm font-bold text-on-surface truncate">{user.full_name}</p>
                    <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {user.role === 'teacher' ? 'Giáo viên' : 'Học viên'}
                    </span>
                  </div>
                  {/* Cập nhật profile */}
                  <button
                    id="update-profile-btn"
                    onClick={openModal}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-slate-400" />
                    Cập nhật thông tin
                  </button>
                  {/* Đăng xuất */}
                  <button
                    id="logout-btn"
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-b-2xl"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
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

      {/* ── Modal cập nhật profile ── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black tracking-tight">Cập nhật thông tin</h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-red-50 hover:text-primary flex items-center justify-center text-on-surface-variant transition-all"
              >✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Họ tên */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">
                  <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Họ và tên</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all"
                  placeholder="Nhập họ và tên mới"
                />
              </div>

              {/* Mật khẩu mới */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">
                  <span className="flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5" /> Mật khẩu mới</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all"
                  placeholder="Để trống nếu không đổi"
                />
              </div>

              {saveMsg && (
                <p className={`text-sm font-medium ${saveMsg.includes('thành công') ? 'text-green-600' : 'text-red-500'}`}>
                  {saveMsg}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-br from-primary to-primary-container text-white text-sm font-bold shadow-sm hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
