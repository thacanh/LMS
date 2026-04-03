import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { coursesApi, progressApi, Course, Progress } from '../api'
import { useAuth } from '../contexts/AuthContext'
import { Play, BookOpen, ChevronRight, Zap, Users, Award } from 'lucide-react'
import Footer from '../components/Footer'

export default function HomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [continueLesson, setContinueLesson] = useState<Progress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Tải danh sách khóa học
    coursesApi.list().then((r) => setCourses(r.data)).finally(() => setLoading(false))
    // Tải bài học đang học dở (nếu đã đăng nhập)
    if (user) {
      progressApi.continueLeaning().then((r) => setContinueLesson(r.data)).catch(() => {})
    }
  }, [user])

  // Danh sách màu gradient cho thumbnail khóa học
  const gradients = [
    'from-red-900 to-red-700',
    'from-slate-800 to-slate-600',
    'from-rose-800 to-pink-600',
    'from-red-800 to-orange-600',
    'from-zinc-800 to-slate-600',
    'from-red-700 to-rose-500',
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Hero ── */}
      <section className="relative bg-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-slate-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative max-w-6xl mx-auto px-6 lg:px-10 py-20 lg:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full mb-6 uppercase tracking-wider">
              <Zap className="w-3 h-3" /> Nền tảng học trực tuyến hiện đại
            </span>
            <h1 className="text-5xl lg:text-6xl font-black tracking-tight text-on-surface mb-6 leading-tight">
              Học không có<br />
              <span className="text-primary">giới hạn.</span>
            </h1>
            <p className="text-lg text-on-surface-variant leading-relaxed mb-10 max-w-xl">
              Khám phá các khóa học chất lượng, xem video HD, theo dõi tiến độ và kiểm tra kỹ năng với bài quiz tương tác.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                id="hero-explore-btn"
                className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-br from-primary to-primary-container text-white font-bold rounded-xl shadow-lg shadow-red-900/20 hover:shadow-xl hover:opacity-90 active:scale-95 transition-all"
                onClick={() => navigate('/courses')}
              >
                Khám phá khóa học <ChevronRight className="w-4 h-4" />
              </button>
              {!user && (
                <button
                  className="flex items-center gap-2 px-6 py-3.5 bg-white text-on-surface font-bold rounded-xl border border-outline-variant shadow-sm hover:bg-surface-container transition-all"
                  onClick={() => navigate('/register')}
                >
                  Đăng ký miễn phí
                </button>
              )}
              {continueLesson && (
                <button
                  id="continue-learning-btn"
                  className="flex items-center gap-2 px-6 py-3.5 bg-white text-primary font-bold rounded-xl border-2 border-primary/30 hover:bg-red-50 transition-all"
                  onClick={() => navigate(`/learn/${continueLesson.lesson_id}`)}
                >
                  <Play className="w-4 h-4 fill-primary" /> Tiếp tục học
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Thống kê ── */}
      <div className="bg-surface-container border-y border-outline-variant">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8">
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { icon: BookOpen, value: courses.length.toString(), label: 'Khóa học có sẵn' },
              { icon: Users, value: 'HD', label: 'Chất lượng video' },
              { icon: Award, value: '∞', label: 'Thời gian truy cập' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <Icon className="w-5 h-5 text-primary mb-1" />
                <p className="text-2xl font-black text-on-surface">{value}</p>
                <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Khóa học nổi bật ── */}
      <main className="flex-1 max-w-6xl mx-auto px-6 lg:px-10 py-14 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Khóa học nổi bật</h2>
            <p className="text-on-surface-variant text-sm mt-0.5">Được chọn lọc kỹ càng để tăng tốc sự nghiệp của bạn</p>
          </div>
          <button
            className="flex items-center gap-1 text-sm font-bold text-primary hover:underline"
            onClick={() => navigate('/courses')}
          >
            Xem tất cả <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="spinner"><div className="spinner-dot" /></div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 text-on-surface-variant">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-semibold">Chưa có khóa học nào.</p>
            <p className="text-sm mt-1">{user ? 'Hãy quay lại sau!' : 'Đăng nhập với tư cách giáo viên để tạo khóa học.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.slice(0, 6).map((c, i) => (
              <div
                key={c.id}
                id={`course-card-${c.id}`}
                className="bg-white rounded-2xl border border-outline-variant shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden group"
                onClick={() => navigate(`/courses/${c.id}`)}
              >
                {/* Thumbnail */}
                <div className={`bg-gradient-to-br ${gradients[i % gradients.length]} h-36 flex items-center justify-center`}>
                  <BookOpen className="w-10 h-10 text-white/80" />
                </div>
                <div className="p-5 flex flex-col gap-2">
                  <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider w-fit">
                    Miễn phí
                  </span>
                  <h3 className="font-bold text-on-surface leading-snug group-hover:text-primary transition-colors">
                    {c.title}
                  </h3>
                  <p className="text-xs text-on-surface-variant font-medium">Giảng viên: {c.teacher_name}</p>
                  {c.description && (
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {c.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
