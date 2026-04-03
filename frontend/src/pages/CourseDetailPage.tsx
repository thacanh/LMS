import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { coursesApi, lessonsApi, quizApi, progressApi, Course, Lesson, Quiz } from '../api'
import { useAuth } from '../contexts/AuthContext'
import {
  ArrowLeft, BookOpen, PlayCircle, FileQuestion,
  CheckCircle2, Lock, ChevronRight, GraduationCap
} from 'lucide-react'

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [progress, setProgress] = useState<{ completed_lessons: number; total_lessons: number; overall_percent: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    // Tải song song: thông tin khóa học, bài học và bài quiz
    Promise.all([
      coursesApi.get(id),
      lessonsApi.byCourse(id),
      quizApi.byCourse(id),
    ]).then(([c, l, q]) => {
      setCourse(c.data)
      setLessons(l.data)
      setQuizzes(q.data)
    }).finally(() => setLoading(false))

    // Tải tiến độ học (chỉ khi đã đăng nhập)
    if (user) {
      progressApi.getCourse(id).then((r) => setProgress(r.data)).catch(() => { })
    }
  }, [id, user])

  if (loading) return <div className="spinner"><div className="spinner-dot" /></div>
  if (!course) return (
    <div className="min-h-screen flex items-center justify-center text-on-surface-variant">
      Không tìm thấy khóa học.
    </div>
  )

  return (
    <div className="min-h-screen bg-surface">
      {/* Banner tiêu đề */}
      <div className="bg-gradient-to-br from-red-900 to-red-700 text-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-12">
          <button
            onClick={() => navigate('/courses')}
            className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-semibold mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách khóa học
          </button>
          <div className="flex gap-3 mb-4">
            <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
              {lessons.length} bài học
            </span>
            <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
              {quizzes.length} bài kiểm tra
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight mb-3">{course.title}</h1>
          {course.description && (
            <p className="text-white/80 max-w-xl leading-relaxed mb-4">{course.description}</p>
          )}
          <p className="text-white/60 text-sm">
            Giảng viên: <strong className="text-white">{course.teacher_name}</strong>
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
        {/* Thanh tiến độ học */}
        {user && progress && progress.total_lessons > 0 && (
          <div className="bg-white rounded-2xl border border-outline-variant p-6 mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-on-surface">Tiến độ của bạn</span>
              <span className="text-sm font-bold text-primary">{Math.round(progress.overall_percent)}%</span>
            </div>
            <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-primary-container h-full rounded-full transition-all duration-500"
                style={{ width: `${progress.overall_percent}%` }}
              />
            </div>
            <p className="text-xs text-on-surface-variant mt-2">
              Đã hoàn thành {progress.completed_lessons}/{progress.total_lessons} bài học
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Danh sách bài học */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-black tracking-tight mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Danh sách bài học
            </h2>
            {lessons.length === 0 ? (
              <div className="bg-white rounded-2xl border border-outline-variant p-10 text-center text-on-surface-variant">
                <PlayCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">Chưa có bài học nào.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
                {lessons.map((l, i) => (
                  <div
                    key={l.id}
                    id={`lesson-item-${l.id}`}
                    className="flex items-center gap-4 px-5 py-4 border-b border-slate-50 last:border-none hover:bg-red-50/50 cursor-pointer transition-colors group"
                    onClick={() => user ? navigate(`/learn/${l.id}`) : navigate('/login')}
                  >
                    {/* Số thứ tự */}
                    <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-xs font-bold text-on-surface-variant shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors truncate">
                        {l.title}
                      </p>
                      {l.description && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{l.description}</p>
                      )}
                    </div>
                    {/* Badge video */}
                    {l.video_url ? (
                      <span className="flex items-center gap-1 bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                        <PlayCircle className="w-3 h-3" /> Video
                      </span>
                    ) : (
                      <Lock className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: Bài kiểm tra */}
          <div>
            <h2 className="text-xl font-black tracking-tight mb-4 flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-primary" /> Bài kiểm tra
            </h2>
            {quizzes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-outline-variant p-8 text-center text-on-surface-variant shadow-sm">
                <FileQuestion className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold">Chưa có bài kiểm tra</p>
              </div>
            ) : (
              <div className="space-y-4">
                {quizzes.map((q) => (
                  <div
                    key={q.id}
                    id={`quiz-card-${q.id}`}
                    className="bg-white rounded-2xl border border-outline-variant p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
                    onClick={() => user ? navigate(`/quiz/${q.id}`) : navigate('/login')}
                  >
                    <h3 className="font-bold text-sm text-on-surface mb-2 group-hover:text-primary transition-colors">
                      {q.title}
                    </h3>
                    <div className="flex gap-2 mb-4">
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {q.questions.length} câu hỏi
                      </span>
                      <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Qua {q.pass_score}%
                      </span>
                    </div>
                    <button className="w-full py-2.5 bg-gradient-to-br from-primary to-primary-container text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                      <GraduationCap className="w-4 h-4" /> Làm bài kiểm tra
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Nút bắt đầu học */}
            {lessons.length > 0 && (
              <button
                className="w-full mt-6 py-4 bg-surface-container rounded-2xl border border-outline-variant flex items-center justify-center gap-2 text-sm font-bold text-on-surface-variant hover:bg-white hover:text-primary hover:border-primary/30 transition-all"
                onClick={() => user ? navigate(`/learn/${lessons[0].id}`) : navigate('/login')}
              >
                <CheckCircle2 className="w-4 h-4" />
                {user ? 'Bắt đầu học' : 'Đăng nhập để học'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
