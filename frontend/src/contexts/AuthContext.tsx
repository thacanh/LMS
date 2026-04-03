import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi, User } from '../api'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, role: string, userId: string) => Promise<void>
  logout: () => void
  isTeacher: boolean
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      authApi.me()
        .then((r) => setUser(r.data))
        .catch((err) => {
          // Chỉ đăng xuất khi server trả về 401 (token không hợp lệ/hết hạn)
          // Không đăng xuất khi lỗi mạng, server đang restart, hoặc 5xx
          const status = err?.response?.status
          if (status === 401) {
            localStorage.clear()
            setToken(null)
          }
          // Nếu không có response (mất mạng, server restart) → giữ nguyên token
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (newToken: string, _role: string, _userId: string) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    const r = await authApi.me()
    setUser(r.data)
  }

  const logout = () => {
    localStorage.clear()
    setToken(null)
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isTeacher: user?.role === 'teacher', loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
