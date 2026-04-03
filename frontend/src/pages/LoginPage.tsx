import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authApi } from '../api'
import { BookOpen, Lock, Mail, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const r = await authApi.login({ email, password })
      await login(r.data.access_token, r.data.role, r.data.user_id)
      navigate('/')
    } catch (err: unknown) {
      // Xử lý lỗi từ API
      const e = err as { response?: { data?: { detail?: { error?: string } | string } } }
      const detail = e.response?.data?.detail
      setError(typeof detail === 'object' ? detail?.error ?? 'Đăng nhập thất bại' : detail ?? 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-16">
      {/* Nền trang trí */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-slate-50 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Card đăng nhập */}
        <div className="bg-white rounded-3xl shadow-xl border border-outline-variant p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-container rounded-2xl flex items-center justify-center shadow-md mb-4">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-on-surface">Chào mừng trở lại</h1>
            <p className="text-sm text-on-surface-variant mt-1">Đăng nhập để tiếp tục học</p>
          </div>

          {/* Thông báo lỗi */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-6 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="email"
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
                  id="password"
                  className="w-full bg-surface-container border border-outline-variant rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/50 outline-none transition-all"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              id="login-btn"
              className="w-full py-3.5 bg-gradient-to-br from-primary to-primary-container text-white font-bold rounded-xl shadow-md shadow-red-900/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              disabled={loading}
            >
              {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
          </form>

          <div className="border-t border-slate-100 mt-6 pt-6 text-center text-sm text-on-surface-variant">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline">
              Tạo ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
