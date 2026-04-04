import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { lessonsApi, progressApi, coursesApi, Lesson, Course } from '../api'
import { useAuth } from '../contexts/AuthContext'
import {
  ArrowLeft, ChevronLeft, ChevronRight,
  CheckCircle2, PlayCircle, BookOpen
} from 'lucide-react'

export default function LearnPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [siblings, setSiblings] = useState<Lesson[]>([])
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastSent, setLastSent] = useState(0)
  const [resumeAt, setResumeAt] = useState(0)   // giây cần tua tới khi video load xong

  useEffect(() => {
    // Chuyển hướng về trang đăng nhập nếu chưa đăng nhập
    if (!user) { navigate('/login'); return }
    if (!lessonId) return

    lessonsApi.get(lessonId).then(async (r) => {
      const l = r.data
      setLesson(l)

      // Tải song song: danh sách bài cùng khóa + thông tin khóa học
      const [sibs, c] = await Promise.all([
        lessonsApi.byCourse(l.course_id),
        coursesApi.get(l.course_id),
      ])
      setSiblings(sibs.data)
      setCourse(c.data)

      // Khôi phục vị trí xem dở — lưu vào state, seek sau khi video load xong
      try {
        const prog = await progressApi.getLesson(lessonId)
        if (prog.data.last_position > 0) {
          setResumeAt(prog.data.last_position)
        }
      } catch { /* Lần đầu xem, bỏ qua */ }
    }).finally(() => setLoading(false))
  }, [lessonId, user, navigate])

  // Gửi cập nhật tiến độ mỗi 10 giây khi đang xem
  const sendProgress = useCallback(async () => {
    if (!videoRef.current || !lesson) return
    const vid = videoRef.current
    const now = Date.now()
    if (now - lastSent < 9500) return // Chống gửi quá nhiều lần
    setLastSent(now)

    const percent = vid.duration ? (vid.currentTime / vid.duration) * 100 : 0
    const status = percent >= 95 ? 'completed' : vid.currentTime > 0 ? 'in_progress' : 'not_started'

    await progressApi.updateLesson(lesson.id, {
      course_id: lesson.course_id,
      status,
      progress_percent: Math.round(percent),
      last_position: Math.floor(vid.currentTime),
    }).catch(() => {})
  }, [lesson, lastSent])

  // Interval gửi tiến độ định kỳ
  useEffect(() => {
    const interval = setInterval(sendProgress, 10000)
    return () => clearInterval(interval)
  }, [sendProgress])

  const currentIndex = siblings.findIndex((s) => s.id === lessonId)
  const prevLesson = currentIndex > 0 ? siblings[currentIndex - 1] : null
  const nextLesson = currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null

  if (loading) return <div className="spinner"><div className="spinner-dot" /></div>
  if (!lesson) return (
    <div className="min-h-screen flex items-center justify-center text-on-surface-variant">
      Không tìm thấy bài học.
    </div>
  )

  return (
    <div className="min-h-screen bg-surface">
      <main className="max-w-[1600px] mx-auto px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        {/* ── Cột trái: Video + thông tin ── */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Breadcrumb + tiến độ */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <button
                className="flex items-center gap-1.5 text-primary font-bold hover:gap-2.5 transition-all duration-200 mb-2"
                onClick={() => course && navigate(`/courses/${course.id}`)}
              >
                <ArrowLeft className="w-4 h-4" />
                {course?.title ?? 'Quay lại khóa học'}
              </button>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-on-surface">
                {lesson.title}
              </h1>
            </div>

            {/* Card tiến độ */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant flex flex-col gap-2 min-w-[220px] shrink-0">
              <div className="flex justify-between items-center text-sm font-bold">
                <span>Tiến độ khóa học</span>
                <span className="text-primary">{currentIndex + 1}/{siblings.length}</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-primary-container h-full rounded-full transition-all duration-500"
                  style={{ width: `${((currentIndex + 1) / Math.max(siblings.length, 1)) * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 font-medium text-right">
                Bài {currentIndex + 1} / {siblings.length}
              </span>
            </div>
          </div>

          {/* Trình phát video */}
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10">
            {lesson.video_url ? (
              <video
                id={`video-player-${lesson.id}`}
                ref={videoRef}
                className="w-full h-full object-contain"
                controls
                src={lesson.video_url}
                onLoadedMetadata={() => {
                  // Tua đến vị trí đã xem dở — chỉ có thể seek sau khi metadata load xong
                  if (resumeAt > 0 && videoRef.current) {
                    videoRef.current.currentTime = resumeAt
                    setResumeAt(0)
                  }
                }}
                onTimeUpdate={sendProgress}
                onEnded={() => {
                  // Đánh dấu hoàn thành khi xem xong
                  if (lesson) {
                    progressApi.updateLesson(lesson.id, {
                      course_id: lesson.course_id,
                      status: 'completed',
                      progress_percent: 100,
                      last_position: Math.floor(videoRef.current?.duration ?? 0),
                    }).catch(() => {})
                  }
                }}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 gap-3">
                <PlayCircle className="w-16 h-16" />
                <p className="text-sm font-medium">Chưa có video cho bài học này</p>
              </div>
            )}
          </div>

          {/* Mô tả bài học */}
          {lesson.description && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant">
              <h2 className="text-lg font-bold mb-3">Tổng quan bài học</h2>
              <p className="text-on-surface-variant leading-relaxed">{lesson.description}</p>
            </div>
          )}

          {/* Điều hướng bài trước/sau */}
          <div className="flex justify-between gap-4">
            <button
              id="prev-lesson-btn"
              className="flex items-center gap-2 px-5 py-3 bg-white border border-outline-variant rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              onClick={() => prevLesson && navigate(`/learn/${prevLesson.id}`)}
              disabled={!prevLesson}
            >
              <ChevronLeft className="w-4 h-4" /> Bài trước
            </button>
            <button
              id="next-lesson-btn"
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl text-sm font-bold shadow-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              onClick={() => nextLesson && navigate(`/learn/${nextLesson.id}`)}
              disabled={!nextLesson}
            >
              Bài tiếp <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Sidebar phải: Danh sách bài học ── */}
        <aside className="w-full lg:w-80 shrink-0">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-outline-variant sticky top-28">
            <div className="p-5 bg-surface-container border-b border-outline-variant">
              <h3 className="font-black text-lg tracking-tight flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" /> Nội dung khóa học
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-0.5">
                {siblings.length} BÀI HỌC
              </p>
            </div>
            <div className="max-h-[600px] overflow-y-auto px-2 py-2 space-y-1">
              {siblings.map((s, i) => {
                const isActive = s.id === lessonId
                return (
                  <div
                    key={s.id}
                    id={`sidebar-lesson-${s.id}`}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer relative overflow-hidden ${
                      isActive
                        ? 'border-2 border-primary/20 bg-white shadow-sm'
                        : 'hover:bg-slate-50'
                    }`}
                    onClick={() => navigate(`/learn/${s.id}`)}
                  >
                    {/* Đường viền trái khi đang phát */}
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r" />}

                    {isActive
                      ? <PlayCircle className="w-5 h-5 text-primary fill-primary/10 shrink-0" />
                      : <CheckCircle2 className="w-5 h-5 text-slate-200 shrink-0" />}

                    <div className="flex-1 overflow-hidden">
                      <p className={`text-sm truncate ${isActive ? 'font-black text-on-surface' : 'font-semibold text-on-surface-variant'}`}>
                        {s.title}
                      </p>
                      <p className={`text-[10px] ${isActive ? 'text-primary font-bold' : 'text-slate-400'}`}>
                        {isActive ? 'ĐANG PHÁT' : `Bài ${i + 1}`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}
