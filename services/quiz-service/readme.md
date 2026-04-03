# Quiz Service

## Tổng quan

Quiz Service quản lý bài kiểm tra và tự động chấm điểm kết quả làm bài.

- **Domain:** Bài kiểm tra (quiz), câu hỏi (question), lượt làm bài (attempt)
- **Dữ liệu sở hữu:** Bảng `quizzes`, `questions`, `attempts`
- **Chức năng:** Tạo quiz nhiều câu hỏi, nộp bài tự động chấm điểm, lưu lịch sử làm bài

## Tech Stack

| Thành phần | Lựa chọn |
|------------|----------|
| Ngôn ngữ | Python 3.12 |
| Framework | FastAPI |
| Database | MySQL (SQLAlchemy ORM) |
| Auth | JWT decode (python-jose) |

## API Endpoints

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/health` | Không | Kiểm tra trạng thái service |
| GET | `/quiz/course/{course_id}` | Không | Danh sách quiz theo khóa học |
| GET | `/quiz/{quiz_id}` | Không | Chi tiết quiz (ẩn đáp án đúng) |
| POST | `/quiz` | Teacher | Tạo quiz kèm câu hỏi (một request) |
| POST | `/quiz/{quiz_id}/submit` | Có | Nộp bài, nhận kết quả tự động chấm |
| GET | `/quiz/{quiz_id}/attempts` | Có | Lịch sử làm bài của học viên |
| DELETE | `/quiz/{quiz_id}` | Teacher | Xóa quiz và toàn bộ dữ liệu liên quan |

## Cơ chế chấm điểm

```
Điểm = (số câu đúng / tổng số câu) × 100
Kết quả = "Đạt" nếu Điểm ≥ pass_score
```

## Chạy service

```bash
# Từ thư mục gốc dự án
docker compose up quiz-service --build
```

## Cấu trúc thư mục

```
quiz-service/
├── Dockerfile
├── requirements.txt
├── readme.md
└── src/
    ├── main.py       # API endpoints + auto-grading logic
    ├── models.py     # SQLAlchemy models: Quiz, Question, Attempt
    ├── schemas.py    # Pydantic schemas: QuizCreate, AttemptSubmit, AttemptResponse
    ├── security.py   # JWT decode, require_teacher dependency
    ├── database.py   # Kết nối DB, session
    └── __init__.py
```

## Biến môi trường

| Biến | Mô tả | Mặc định |
|------|-------|---------|
| `DATABASE_URL` | Chuỗi kết nối MySQL | `mysql+pymysql://...` |
| `JWT_SECRET` | Khóa bí mật để decode JWT | `super-secret-lms-jwt-key` |
| `JWT_ALGORITHM` | Thuật toán JWT | `HS256` |

## Ghi chú

- `correct_index` (đáp án đúng) **không bao giờ trả về** cho client — chỉ dùng nội bộ khi chấm điểm
- Giáo viên tạo quiz với tất cả câu hỏi trong **một request duy nhất** (`POST /quiz`)
- Học viên có thể làm bài nhiều lần — mỗi lần tạo một `Attempt` mới, lịch sử được lưu đầy đủ
- `pass_score` là ngưỡng điểm phần trăm để coi là đạt (mặc định 70%)
