import { useEffect, useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { coursesApi, lessonsApi, quizApi, Course, Lesson, Quiz } from '../api'
import { useAuth } from '../contexts/AuthContext'
import {
  Plus, BookOpen, PlayCircle, FileQuestion, Edit2, Trash2,
  Upload, CheckCircle, XCircle, AlertCircle, LayoutDashboard
} from 'lucide-react'

type Tab = 'courses' | 'lessons' | 'quizzes'

/* ── Modal dùng chung ── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant">
          <h2 className="text-lg font-black tracking-tight">{title}</h2>
          <button
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-red-50 hover:text-primary flex items-center justify-center text-on-surface-variant transition-all"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

/* ── Field nhãn form ── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-on-surface mb-1.5">{label}</label>
      {children}
    </div>
  )
}

// Class dùng chung cho input
const inputCls = "w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all"

export default function TeacherDashboard() {
  const { user, isTeacher } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState<Tab>('courses')
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form khóa học
  const [courseTitle, setCourseTitle] = useState('')
  const [courseDesc, setCourseDesc] = useState('')
  const [coursePublished, setCoursePublished] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [showCourseModal, setShowCourseModal] = useState(false)

  // Form bài học
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonDesc, setLessonDesc] = useState('')
  const [lessonOrder, setLessonOrder] = useState(0)
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  // Form bài kiểm tra
  const [quizTitle, setQuizTitle] = useState('')
  const [quizDesc, setQuizDesc] = useState('')
  const [quizPassScore, setQuizPassScore] = useState(70)
  const [quizQuestions, setQuizQuestions] = useState([
    { text: '', options: ['', '', '', ''], correct_index: 0, order: 0 },
  ])
  const [showQuizModal, setShowQuizModal] = useState(false)

  useEffect(() => {
    // Kiểm tra quyền truy cập
    if (!user) { navigate('/login'); return }
    if (!isTeacher) { navigate('/'); return }
    // Tải tất cả khóa học của giáo viên
    coursesApi.listAll().then((r) => {
      setCourses(r.data)
      if (r.data.length > 0) setSelectedCourse(r.data[0].id)
    }).finally(() => setLoading(false))
  }, [user, isTeacher, navigate])

  // Tải bài học + quiz khi chọn khóa học khác
  // Dùng AbortController để hủy request cũ khi khóa học thay đổi (tránh race condition)
  useEffect(() => {
    if (!selectedCourse) return
    const controller = new AbortController()
    let cancelled = false

    setLessons([])
    setQuizzes([])

    lessonsApi.byCourse(selectedCourse, { signal: controller.signal })
      .then((r) => { if (!cancelled) setLessons(r.data) })
      .catch((err) => { if (!cancelled && err.name !== 'CanceledError' && err.name !== 'AbortError') console.error(err) })

    quizApi.byCourse(selectedCourse, { signal: controller.signal })
      .then((r) => { if (!cancelled) setQuizzes(r.data) })
      .catch((err) => { if (!cancelled && err.name !== 'CanceledError' && err.name !== 'AbortError') console.error(err) })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [selectedCourse])

  const showMsg = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }
  const showErr = (msg: string) => { setError(msg); setTimeout(() => setError(''), 5000) }

  /* ── CRUD Khóa học ── */
  const openCourseModal = (c?: Course) => {
    if (c) {
      setEditingCourse(c); setCourseTitle(c.title); setCourseDesc(c.description ?? ''); setCoursePublished(c.is_published)
    } else {
      setEditingCourse(null); setCourseTitle(''); setCourseDesc(''); setCoursePublished(false)
    }
    setShowCourseModal(true)
  }

  const saveCourse = async (e: FormEvent) => {
    e.preventDefault()
    try {
      if (editingCourse) {
        // Cập nhật khóa học hiện có
        const r = await coursesApi.update(editingCourse.id, { title: courseTitle, description: courseDesc, is_published: coursePublished })
        setCourses((c) => c.map((x) => x.id === editingCourse.id ? r.data : x))
      } else {
        // Tạo khóa học mới
        const r = await coursesApi.create({ title: courseTitle, description: courseDesc, is_published: coursePublished })
        setCourses((c) => [...c, r.data])
        setSelectedCourse(r.data.id)
      }
      setShowCourseModal(false)
      showMsg(editingCourse ? 'Đã cập nhật khóa học!' : 'Đã tạo khóa học mới!')
    } catch { showErr('Không thể lưu khóa học') }
  }

  const deleteCourse = async (id: string) => {
    if (!confirm('Xóa khóa học này?')) return
    await coursesApi.delete(id)
    setCourses((c) => c.filter((x) => x.id !== id))
    if (selectedCourse === id) setSelectedCourse(courses.find((c) => c.id !== id)?.id ?? '')
    showMsg('Đã xóa khóa học')
  }

  /* ── CRUD Bài học ── */
  const saveLesson = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedCourse) return
    try {
      const r = await lessonsApi.create({ course_id: selectedCourse, title: lessonTitle, description: lessonDesc, order: lessonOrder })
      setLessons((l) => [...l, r.data])
      setShowLessonModal(false)
      setLessonTitle(''); setLessonDesc(''); setLessonOrder(lessons.length)
      showMsg('Đã tạo bài học mới!')
    } catch { showErr('Không thể tạo bài học') }
  }

  const deleteLesson = async (id: string) => {
    if (!confirm('Xóa bài học này?')) return
    await lessonsApi.delete(id)
    setLessons((l) => l.filter((x) => x.id !== id))
    showMsg('Đã xóa bài học')
  }

  // Tải video lên cho bài học
  const uploadVideo = async (lessonId: string, file: File) => {
    setUploadingId(lessonId)
    try {
      const r = await lessonsApi.uploadVideo(lessonId, file)
      setLessons((l) => l.map((x) => x.id === lessonId ? r.data : x))
      showMsg('Đã tải video lên!')
    } catch { showErr('Tải video thất bại') }
    finally { setUploadingId(null) }
  }

  /* ── CRUD Bài kiểm tra ── */
  const addQuestion = () =>
    setQuizQuestions((q) => [...q, { text: '', options: ['', '', '', ''], correct_index: 0, order: q.length }])

  const updateQuestion = (i: number, field: string, val: unknown) =>
    setQuizQuestions((q) => q.map((x, xi) => xi === i ? { ...x, [field]: val } : x))

  const updateOption = (qi: number, oi: number, val: string) =>
    setQuizQuestions((q) => q.map((x, xi) => xi === qi ? { ...x, options: x.options.map((o, oi2) => oi2 === oi ? val : o) } : x))

  const saveQuiz = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedCourse) return
    try {
      const r = await quizApi.create({
        course_id: selectedCourse,
        title: quizTitle,
        description: quizDesc,
        pass_score: quizPassScore,
        questions: quizQuestions,
      })
      setQuizzes((q) => [...q, r.data])
      setShowQuizModal(false)
      setQuizTitle(''); setQuizDesc(''); setQuizPassScore(70)
      setQuizQuestions([{ text: '', options: ['', '', '', ''], correct_index: 0, order: 0 }])
      showMsg('Đã tạo bài kiểm tra!')
    } catch { showErr('Không thể tạo bài kiểm tra') }
  }

  const deleteQuiz = async (id: string) => {
    if (!confirm('Xóa bài kiểm tra này?')) return
    await quizApi.delete(id)
    setQuizzes((q) => q.filter((x) => x.id !== id))
    showMsg('Đã xóa bài kiểm tra')
  }

  const activeCourse = courses.find((c) => c.id === selectedCourse)

  if (loading) return <div className="spinner"><div className="spinner-dot" /></div>

  return (
    <div className="min-h-screen bg-surface">
      {/* Tiêu đề trang */}
      <div className="bg-white border-b border-outline-variant px-6 lg:px-10 py-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-primary" /> Bảng điều khiển giáo viên
            </h1>
            <p className="text-sm text-on-surface-variant mt-0.5">Quản lý khóa học, bài học và bài kiểm tra</p>
          </div>
          <button
            id="create-course-btn"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-primary to-primary-container text-white text-sm font-bold rounded-xl shadow-sm hover:opacity-90 active:scale-95 transition-all"
            onClick={() => openCourseModal()}
          >
            <Plus className="w-4 h-4" /> Khóa học mới
          </button>
        </div>
      </div>

      {/* Toast thông báo */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-4">
        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-sm text-green-700">
            <CheckCircle className="w-4 h-4 shrink-0" /> {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">

          {/* ── Sidebar trái: danh sách khóa học ── */}
          <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-outline-variant">
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                Khóa học của bạn ({courses.length})
              </p>
            </div>
            <div className="p-2 space-y-1">
              {courses.length === 0 ? (
                <p className="text-sm text-on-surface-variant px-3 py-4">Chưa có khóa học nào. Hãy tạo ngay!</p>
              ) : (
                courses.map((c) => (
                  <div
                    key={c.id}
                    id={`sidebar-course-${c.id}`}
                    className={`px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                      selectedCourse === c.id
                        ? 'bg-red-50 border border-primary/20 text-primary'
                        : 'hover:bg-surface-container text-on-surface-variant'
                    }`}
                    onClick={() => setSelectedCourse(c.id)}
                  >
                    <p className="font-bold text-sm truncate">{c.title}</p>
                    <p className="text-[11px] mt-0.5 flex items-center gap-1">
                      {c.is_published
                        ? <><CheckCircle className="w-3 h-3 text-green-500" /> Đã xuất bản</>
                        : <><XCircle className="w-3 h-3 text-slate-400" /> Bản nháp</>}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Panel bên phải ── */}
          {selectedCourse && activeCourse ? (
            <div className="space-y-5">
              {/* Header thông tin khóa học đang chọn */}
              <div className="bg-white rounded-2xl border border-outline-variant shadow-sm p-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-black text-lg text-on-surface truncate">{activeCourse.title}</h2>
                  {activeCourse.description && (
                    <p className="text-sm text-on-surface-variant mt-0.5 line-clamp-1">{activeCourse.description}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    id="edit-course-btn"
                    className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant rounded-xl text-sm font-semibold hover:bg-white transition-all"
                    onClick={() => openCourseModal(activeCourse)}
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Sửa
                  </button>
                  <button
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-all"
                    onClick={() => deleteCourse(selectedCourse)}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa
                  </button>
                </div>
              </div>

              {/* Tab điều hướng */}
              <div className="flex gap-1 bg-surface-container rounded-xl p-1">
                {(['courses', 'lessons', 'quizzes'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                      tab === t
                        ? 'bg-white shadow-sm text-on-surface'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                    onClick={() => setTab(t)}
                  >
                    {t === 'courses' ? 'Tổng quan' : t === 'lessons' ? `Bài học (${lessons.length})` : `Bài kiểm tra (${quizzes.length})`}
                  </button>
                ))}
              </div>

              {/* Tab: Tổng quan */}
              {tab === 'courses' && (
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { icon: BookOpen, value: lessons.length, label: 'Bài học' },
                    { icon: FileQuestion, value: quizzes.length, label: 'Bài kiểm tra' },
                    { icon: activeCourse.is_published ? CheckCircle : XCircle,
                      value: activeCourse.is_published ? 'Công khai' : 'Nháp',
                      label: 'Trạng thái' },
                  ].map(({ icon: Icon, value, label }) => (
                    <div key={label} className="bg-white rounded-2xl border border-outline-variant shadow-sm p-5 text-center">
                      <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                      <p className="text-2xl font-black text-on-surface">{value}</p>
                      <p className="text-xs text-on-surface-variant font-semibold mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab: Bài học */}
              {tab === 'lessons' && (
                <div>
                  <div className="flex justify-end mb-4">
                    <button
                      id="add-lesson-btn"
                      className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-primary to-primary-container text-white text-sm font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all"
                      onClick={() => { setLessonTitle(''); setLessonDesc(''); setLessonOrder(lessons.length); setShowLessonModal(true) }}
                    >
                      <Plus className="w-4 h-4" /> Thêm bài học
                    </button>
                  </div>
                  {lessons.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-outline-variant shadow-sm p-10 text-center text-on-surface-variant">
                      <PlayCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="font-semibold">Chưa có bài học nào.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {lessons.map((l) => (
                        <div
                          key={l.id}
                          id={`lesson-row-${l.id}`}
                          className="bg-white rounded-2xl border border-outline-variant shadow-sm flex items-center gap-4 p-4"
                        >
                          {/* Số thứ tự */}
                          <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-xs font-black text-on-surface-variant shrink-0">
                            {l.order + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-on-surface truncate">{l.title}</p>
                            <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                              {l.video_url
                                ? <><CheckCircle className="w-3 h-3 text-green-500" /> Đã có video</>
                                : <><XCircle className="w-3 h-3 text-slate-400" /> Chưa có video</>}
                            </p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {/* Nút tải video */}
                            <label id={`upload-video-${l.id}`} className="cursor-pointer">
                              <input
                                type="file"
                                accept="video/*"
                                className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadVideo(l.id, f) }}
                              />
                              <span className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-outline-variant rounded-xl text-xs font-bold hover:bg-white transition-all">
                                <Upload className="w-3.5 h-3.5" />
                                {uploadingId === l.id ? 'Đang tải…' : 'Tải video'}
                              </span>
                            </label>
                            <button
                              className="flex items-center gap-1 px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all"
                              onClick={() => deleteLesson(l.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Bài kiểm tra */}
              {tab === 'quizzes' && (
                <div>
                  <div className="flex justify-end mb-4">
                    <button
                      id="add-quiz-btn"
                      className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-primary to-primary-container text-white text-sm font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all"
                      onClick={() => setShowQuizModal(true)}
                    >
                      <Plus className="w-4 h-4" /> Thêm bài kiểm tra
                    </button>
                  </div>
                  {quizzes.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-outline-variant shadow-sm p-10 text-center text-on-surface-variant">
                      <FileQuestion className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="font-semibold">Chưa có bài kiểm tra nào.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {quizzes.map((q) => (
                        <div
                          key={q.id}
                          id={`quiz-row-${q.id}`}
                          className="bg-white rounded-2xl border border-outline-variant shadow-sm flex items-center justify-between p-4"
                        >
                          <div>
                            <p className="font-bold text-sm text-on-surface">{q.title}</p>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              {q.questions.length} câu hỏi · Điểm qua: {q.pass_score}%
                            </p>
                          </div>
                          <button
                            className="flex items-center gap-1 px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all"
                            onClick={() => deleteQuiz(q.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Xóa
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-outline-variant shadow-sm p-14 text-center text-on-surface-variant">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-25" />
              <p className="font-semibold">Chọn một khóa học để quản lý</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal tạo/sửa khóa học ── */}
      {showCourseModal && (
        <Modal title={editingCourse ? 'Sửa khóa học' : 'Tạo khóa học mới'} onClose={() => setShowCourseModal(false)}>
          <form onSubmit={saveCourse} className="space-y-4">
            <Field label="Tên khóa học *">
              <input
                id="course-title-input"
                className={inputCls}
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                required
                placeholder="VD: Lập trình Python cơ bản"
              />
            </Field>
            <Field label="Mô tả">
              <textarea
                id="course-desc-input"
                className={`${inputCls} resize-none min-h-[80px]`}
                value={courseDesc}
                onChange={(e) => setCourseDesc(e.target.value)}
                placeholder="Học viên sẽ học được gì?"
              />
            </Field>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                id="course-published-check"
                type="checkbox"
                checked={coursePublished}
                onChange={(e) => setCoursePublished(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm font-semibold text-on-surface">Xuất bản (học viên có thể thấy)</span>
            </label>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" className="px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-sm font-bold hover:bg-white transition-all" onClick={() => setShowCourseModal(false)}>Hủy</button>
              <button id="save-course-btn" type="submit" className="px-4 py-2.5 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all">Lưu</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal tạo bài học ── */}
      {showLessonModal && (
        <Modal title="Tạo bài học mới" onClose={() => setShowLessonModal(false)}>
          <form onSubmit={saveLesson} className="space-y-4">
            <Field label="Tên bài học *">
              <input
                id="lesson-title-input"
                className={inputCls}
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                required
                placeholder="VD: Biến và kiểu dữ liệu"
              />
            </Field>
            <Field label="Mô tả">
              <textarea
                className={`${inputCls} resize-none min-h-[80px]`}
                value={lessonDesc}
                onChange={(e) => setLessonDesc(e.target.value)}
                placeholder="Tóm tắt nội dung bài học"
              />
            </Field>
            <Field label="Thứ tự">
              <input
                className={inputCls}
                type="number"
                min={0}
                value={lessonOrder}
                onChange={(e) => setLessonOrder(Number(e.target.value))}
              />
            </Field>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" className="px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-sm font-bold hover:bg-white transition-all" onClick={() => setShowLessonModal(false)}>Hủy</button>
              <button id="save-lesson-btn" type="submit" className="px-4 py-2.5 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all">Tạo bài học</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal tạo bài kiểm tra ── */}
      {showQuizModal && (
        <Modal title="Tạo bài kiểm tra mới" onClose={() => setShowQuizModal(false)}>
          <form onSubmit={saveQuiz} className="space-y-4">
            <Field label="Tên bài kiểm tra *">
              <input
                id="quiz-title-input"
                className={inputCls}
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                required
                placeholder="VD: Kiểm tra chương 1"
              />
            </Field>
            <Field label="Mô tả">
              <input
                className={inputCls}
                value={quizDesc}
                onChange={(e) => setQuizDesc(e.target.value)}
                placeholder="Mô tả ngắn (không bắt buộc)"
              />
            </Field>
            <Field label="Điểm qua (%)">
              <input
                className={inputCls}
                type="number"
                min={0}
                max={100}
                value={quizPassScore}
                onChange={(e) => setQuizPassScore(Number(e.target.value))}
              />
            </Field>

            <div className="border-t border-outline-variant pt-4">
              <p className="text-sm font-black text-on-surface mb-3">Danh sách câu hỏi</p>
              <div className="space-y-3">
                {quizQuestions.map((q, qi) => (
                  <div key={qi} className="bg-surface-container rounded-xl border border-outline-variant p-4">
                    <p className="text-[10px] font-black text-on-surface-variant uppercase mb-2">Câu hỏi {qi + 1}</p>
                    <input
                      className={`${inputCls} mb-3`}
                      value={q.text}
                      onChange={(e) => updateQuestion(qi, 'text', e.target.value)}
                      placeholder="Nội dung câu hỏi"
                      required
                    />
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex gap-2 mb-2 items-center">
                        <input
                          type="radio"
                          name={`correct-${qi}`}
                          checked={q.correct_index === oi}
                          onChange={() => updateQuestion(qi, 'correct_index', oi)}
                          className="accent-primary"
                        />
                        <input
                          className={`${inputCls} flex-1`}
                          value={opt}
                          onChange={(e) => updateOption(qi, oi, e.target.value)}
                          placeholder={`Đáp án ${String.fromCharCode(65 + oi)}`}
                          required
                        />
                      </div>
                    ))}
                    <p className="text-[10px] text-on-surface-variant mt-1">Chọn radio button để đánh dấu đáp án đúng</p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-3 flex items-center gap-1.5 px-3 py-2 bg-white border border-outline-variant rounded-xl text-xs font-bold hover:bg-surface-container transition-all"
                onClick={addQuestion}
              >
                <Plus className="w-3.5 h-3.5" /> Thêm câu hỏi
              </button>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button type="button" className="px-4 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-sm font-bold hover:bg-white transition-all" onClick={() => setShowQuizModal(false)}>Hủy</button>
              <button id="save-quiz-btn" type="submit" className="px-4 py-2.5 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all">Tạo bài kiểm tra</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
