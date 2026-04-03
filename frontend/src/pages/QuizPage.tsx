import { useEffect, useState, FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { quizApi, Quiz, Attempt } from '../api'
import { useAuth } from '../contexts/AuthContext'
import {
  GraduationCap, Trophy, RotateCcw, ArrowLeft, CheckCircle2, XCircle,
  ClipboardList, AlertCircle
} from 'lucide-react'

export default function QuizPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<Attempt | null>(null)
  const [history, setHistory] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Chuyển hướng về trang đăng nhập nếu chưa đăng nhập
    if (!user) { navigate('/login'); return }
    if (!quizId) return
    // Tải song song: thông tin quiz và lịch sử làm bài
    Promise.all([
      quizApi.get(quizId),
      quizApi.attempts(quizId),
    ]).then(([q, a]) => {
      setQuiz(q.data)
      setHistory(a.data)
    }).finally(() => setLoading(false))
  }, [quizId, user, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!quiz) return
    // Kiểm tra còn câu chưa trả lời
    const unanswered = quiz.questions.filter((q) => answers[q.id] === undefined)
    if (unanswered.length > 0) {
      setError(`Vui lòng trả lời tất cả câu hỏi (còn ${unanswered.length} câu chưa trả lời)`)
      return
    }
    setSubmitting(true)
    try {
      const r = await quizApi.submit(quiz.id, answers)
      setResult(r.data)
      setHistory((h) => [r.data, ...h])
    } catch {
      setError('Nộp bài thất bại. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="spinner"><div className="spinner-dot" /></div>
  if (!quiz) return (
    <div className="min-h-screen flex items-center justify-center text-on-surface-variant">
      Không tìm thấy bài kiểm tra.
    </div>
  )

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Nút quay lại */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-primary font-bold hover:gap-2.5 transition-all mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        {/* Tiêu đề bài kiểm tra */}
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-on-surface mb-2">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-on-surface-variant mb-4">{quiz.description}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
              <ClipboardList className="w-3 h-3 inline mr-1" />{quiz.questions.length} câu hỏi
            </span>
            <span className="bg-orange-50 text-orange-600 text-xs font-bold px-3 py-1 rounded-full">
              Điểm qua: {quiz.pass_score}%
            </span>
            {history.length > 0 && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                history[0].passed
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-600'
              }`}>
                Điểm cao nhất: {Math.max(...history.map(h => h.score)).toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        {result ? (
          /* ── Màn hình kết quả ── */
          <div className="bg-white rounded-3xl border border-outline-variant shadow-sm p-10 text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              result.passed ? 'bg-green-50' : 'bg-red-50'
            }`}>
              {result.passed
                ? <Trophy className="w-10 h-10 text-green-600" />
                : <XCircle className="w-10 h-10 text-red-500" />}
            </div>
            <p className={`text-6xl font-black mb-2 ${result.passed ? 'text-green-600' : 'text-red-500'}`}>
              {result.score.toFixed(0)}%
            </p>
            <p className="text-on-surface-variant mb-8">
              {result.passed ? 'Chúc mừng! Bạn đã vượt qua bài kiểm tra.' : `Bạn cần đạt ${quiz.pass_score}% để qua.`}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                className="flex items-center gap-2 px-5 py-3 bg-surface-container border border-outline-variant rounded-xl text-sm font-bold hover:bg-white transition-all"
                onClick={() => { setResult(null); setAnswers({}) }}
              >
                <RotateCcw className="w-4 h-4" /> Làm lại
              </button>
              <button
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-4 h-4" /> Về khóa học
              </button>
            </div>
          </div>
        ) : (
          /* ── Form làm bài ── */
          <form id="quiz-form" onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            {quiz.questions.map((q, qi) => (
              <div key={q.id} id={`question-${q.id}`} className="bg-white rounded-2xl border border-outline-variant shadow-sm p-6">
                <p className="font-bold text-on-surface mb-4">
                  <span className="text-primary mr-1">Câu {qi + 1}.</span> {q.text}
                </p>
                <div className="space-y-2.5">
                  {q.options.map((opt, oi) => {
                    const selected = answers[q.id] === oi
                    return (
                      <div
                        key={oi}
                        id={`option-${q.id}-${oi}`}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                          selected
                            ? 'border-primary bg-red-50 text-primary'
                            : 'border-outline-variant hover:border-primary/30 hover:bg-red-50/30'
                        }`}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                      >
                        {/* Radio button tuỳ chỉnh */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selected ? 'border-primary bg-primary' : 'border-slate-300'
                        }`}>
                          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className="text-sm font-medium">
                          <span className="font-bold text-on-surface-variant mr-1">{String.fromCharCode(65 + oi)}.</span>
                          {opt}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            <button
              id="submit-quiz-btn"
              className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-white font-bold rounded-xl shadow-md shadow-red-900/20 flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              type="submit"
              disabled={submitting}
            >
              <GraduationCap className="w-5 h-5" />
              {submitting ? 'Đang chấm điểm…' : 'Nộp bài'}
            </button>
          </form>
        )}

        {/* Lịch sử làm bài */}
        {history.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-black tracking-tight mb-4">Lịch sử làm bài</h3>
            <div className="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
              {history.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between px-5 py-4 border-b border-slate-50 last:border-none"
                >
                  <span className="text-sm text-on-surface-variant">
                    {new Date(a.submitted_at).toLocaleString('vi-VN')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${a.passed ? 'text-green-600' : 'text-red-500'}`}>
                      {a.score.toFixed(0)}%
                    </span>
                    {a.passed
                      ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                      : <XCircle className="w-4 h-4 text-red-400" />}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      a.passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                    }`}>
                      {a.passed ? 'Đạt' : 'Chưa đạt'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
