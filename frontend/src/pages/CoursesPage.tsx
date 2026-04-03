import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { coursesApi, Course } from '../api'
import { BookOpen, Search } from 'lucide-react'

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    // Tải tất cả khóa học đã xuất bản
    coursesApi.list().then((r) => setCourses(r.data)).finally(() => setLoading(false))
  }, [])

  // Lọc khóa học theo từ khóa tìm kiếm
  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase()) ||
      c.teacher_name.toLowerCase().includes(search.toLowerCase())
  )

  // Màu gradient cho thumbnail
  const gradients = [
    'from-red-900 to-red-700',
    'from-slate-800 to-slate-600',
    'from-rose-800 to-pink-600',
    'from-red-800 to-orange-600',
    'from-zinc-800 to-slate-600',
    'from-red-700 to-rose-500',
    'from-stone-800 to-stone-600',
    'from-neutral-800 to-neutral-600',
  ]

  return (
    <div className="min-h-screen bg-surface">
      {/* Tiêu đề trang */}
      <div className="bg-white border-b border-outline-variant px-6 lg:px-10 py-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-black tracking-tight text-on-surface mb-2">Tất cả khóa học</h1>
          <p className="text-on-surface-variant mb-6">Duyệt và đăng ký các khóa học trong danh mục của chúng tôi</p>
          {/* Thanh tìm kiếm */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              id="course-search"
              className="w-full bg-surface-container border border-outline-variant rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder="Tìm kiếm khóa học…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
        {loading ? (
          <div className="spinner"><div className="spinner-dot" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-on-surface-variant">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-semibold">
              {search ? `Không tìm thấy kết quả cho "${search}"` : 'Chưa có khóa học nào.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((c, i) => (
              <div
                key={c.id}
                id={`course-${c.id}`}
                className="bg-white rounded-2xl border border-outline-variant shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden group"
                onClick={() => navigate(`/courses/${c.id}`)}
              >
                {/* Thumbnail với badge Miễn phí */}
                <div className={`bg-gradient-to-br ${gradients[i % gradients.length]} h-36 flex items-center justify-center relative`}>
                  <BookOpen className="w-10 h-10 text-white/70" />
                  <div className="absolute top-3 right-3">
                    <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Miễn phí
                    </span>
                  </div>
                </div>
                <div className="p-5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Đã xuất bản
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(c.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <h3 className="font-black text-on-surface leading-snug group-hover:text-primary transition-colors">
                    {c.title}
                  </h3>
                  <p className="text-xs font-semibold text-on-surface-variant">Giảng viên: {c.teacher_name}</p>
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
      </div>
    </div>
  )
}
