import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authApi } from '../api'
import { BookOpen, Lock, Mail, User, GraduationCap, AlertCircle } from 'lucide-react'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'student' | 'teacher'>('student')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Đăng ký tài khoản mới, sau đó tự động đăng nhập
      await authApi.register({ email, full_name: fullName, password, role })
      const r = await authApi.login({ email, password })
      await login(r.data.access_token, r.data.role, r.data.user_id)
      navigate('/')
    } catch (err: unknown) {
      // Xử lý lỗi từ server
      const e = err as { response?: { data?: { detail?: { error?: string } | string } } }
      const detail = e.response?.data?.detail
      setError(typeof detail === 'object' ? detail?.error ?? 'Đăng ký thất bại' : detail ?? 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-16">
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-slate-50 pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-outline-variant p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-container rounded-2xl flex items-center justify-center shadow-md mb-4">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-on-surface">Tạo tài khoản</h1>
            <p className="text-sm text-on-surface-variant mt-1">Tham gia cùng hàng nghìn học viên</p>
          </div>

          {/* Thông báo lỗi */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-6 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Họ và tên */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1.5">Họ và tên</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="full-name"
                  className="w-full bg-surface-container border border-outline-variant rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="reg-email"
                  className="w-full bg-surface-container border border-outline-variant rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                  type="email"
                  placeholder="ban@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1.5">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="reg-password"
                  className="w-full bg-surface-container border border-outline-variant rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Chọn vai trò */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1.5">Tôi là…</label>
              <div className="grid grid-cols-2 gap-3">
                {(['student', 'teacher'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    id={`role-${r}`}
                    onClick={() => setRole(r)}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                      role === r
                        ? 'border-primary bg-red-50 text-primary'
                        : 'border-outline-variant bg-surface-container text-on-surface-variant hover:border-primary/30'
                    }`}
                  >
                    {r === 'student'
                      ? <BookOpen className="w-4 h-4" />
                      : <GraduationCap className="w-4 h-4" />}
                    {r === 'student' ? 'Học viên' : 'Giáo viên'}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="register-btn"
              className="w-full py-3.5 bg-gradient-to-br from-primary to-primary-container text-white font-bold rounded-xl shadow-md shadow-red-900/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              disabled={loading}
            >
              {loading ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}
            </button>
          </form>

          <div className="border-t border-slate-100 mt-6 pt-6 text-center text-sm text-on-surface-variant">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
