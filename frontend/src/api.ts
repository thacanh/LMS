import axios, { type AxiosRequestConfig } from 'axios'

// All requests go to the Nginx gateway
const API_BASE = '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Chỉ reject lỗi, KHÔNG tự động xóa token hay redirect
// Việc xử lý 401 do AuthContext và từng component quyết định
// (tránh mất dữ liệu khi user đang làm quiz hoặc nhập form)
api.interceptors.response.use(
  (r) => r,
  (err) => Promise.reject(err)
)

export default api

/* ── Types ───────────────────────────────── */
export interface User {
  id: string
  email: string
  full_name: string
  role: 'student' | 'teacher'
  created_at: string
}

export interface Course {
  id: string
  title: string
  description: string | null
  teacher_id: string
  teacher_name: string
  thumbnail_url: string | null
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: string
  course_id: string
  title: string
  description: string | null
  video_url: string | null
  duration: number
  order: number
  created_at: string
  updated_at: string
}

export interface Progress {
  id: string
  user_id: string
  lesson_id: string
  course_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  progress_percent: number
  last_position: number
  updated_at: string
  created_at: string
}

export interface Quiz {
  id: string
  course_id: string
  title: string
  description: string | null
  pass_score: number
  created_at: string
  questions: Question[]
}

export interface Question {
  id: string
  text: string
  options: string[]
  order: number
}

export interface Attempt {
  id: string
  quiz_id: string
  user_id: string
  answers: Record<string, number>
  score: number
  passed: boolean
  submitted_at: string
}

/* ── Auth API ─────────────────────────────── */
export const authApi = {
  register: (data: { email: string; full_name: string; password: string; role: string }) =>
    api.post<User>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ access_token: string; token_type: string; role: string; user_id: string }>('/auth/login', data),
  me: () => api.get<User>('/auth/me'),
}

/* ── Courses API ──────────────────────────── */
export const coursesApi = {
  list: () => api.get<Course[]>('/courses'),
  listAll: () => api.get<Course[]>('/courses/all'),
  get: (id: string) => api.get<Course>(`/courses/${id}`),
  create: (data: Partial<Course>) => api.post<Course>('/courses', data),
  update: (id: string, data: Partial<Course>) => api.put<Course>(`/courses/${id}`, data),
  delete: (id: string) => api.delete(`/courses/${id}`),
}

/* ── Lessons API ──────────────────────────── */
export const lessonsApi = {
  byCourse: (courseId: string, config?: AxiosRequestConfig) => api.get<Lesson[]>(`/lessons/course/${courseId}`, config),
  get: (id: string) => api.get<Lesson>(`/lessons/${id}`),
  create: (data: Partial<Lesson>) => api.post<Lesson>('/lessons', data),
  update: (id: string, data: Partial<Lesson>) => api.put<Lesson>(`/lessons/${id}`, data),
  delete: (id: string) => api.delete(`/lessons/${id}`),
  uploadVideo: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<Lesson>(`/lessons/${id}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  streamUrl: (id: string) => `/api/lessons/${id}/stream`,
}

/* ── Progress API ─────────────────────────── */
export const progressApi = {
  getLesson: (lessonId: string) => api.get<Progress>(`/progress/lesson/${lessonId}`),
  updateLesson: (lessonId: string, data: { course_id: string; status: string; progress_percent: number; last_position: number }) =>
    api.put<Progress>(`/progress/lesson/${lessonId}`, data),
  getCourse: (courseId: string) => api.get<{ course_id: string; total_lessons: number; completed_lessons: number; overall_percent: number }>(`/progress/course/${courseId}`),
  continueLeaning: () => api.get<Progress | null>('/progress/continue'),
  all: () => api.get<Progress[]>('/progress/all'),
}

/* ── Quiz API ─────────────────────────────── */
export const quizApi = {
  byCourse: (courseId: string, config?: AxiosRequestConfig) => api.get<Quiz[]>(`/quiz/course/${courseId}`, config),
  get: (id: string) => api.get<Quiz>(`/quiz/${id}`),
  create: (data: unknown) => api.post<Quiz>('/quiz', data),
  delete: (id: string) => api.delete(`/quiz/${id}`),
  submit: (id: string, answers: Record<string, number>) =>
    api.post<Attempt>(`/quiz/${id}/submit`, { answers }),
  attempts: (id: string) => api.get<Attempt[]>(`/quiz/${id}/attempts`),
}
