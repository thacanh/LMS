# Lesson Service

## Tổng quan

Lesson Service quản lý bài học và video trong từng khóa học.

- **Domain:** Bài học (lessons), video
- **Dữ liệu sở hữu:** Bảng `lessons` (id, course_id, tiêu đề, đường dẫn video, thứ tự)
- **Chức năng:** CRUD bài học, upload video, streaming video theo HTTP Range Request

## Tech Stack

| Thành phần | Lựa chọn |
|------------|----------|
| Ngôn ngữ | Python 3.12 |
| Framework | FastAPI |
| Database | MySQL (SQLAlchemy ORM) |
| Video storage | Filesystem (volume Docker) |
| Auth | JWT decode (python-jose) |

## API Endpoints

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/health` | Không | Kiểm tra trạng thái service |
| GET | `/lessons/course/{course_id}` | Không | Danh sách bài học theo khóa học (sắp xếp theo `order`) |
| GET | `/lessons/{lesson_id}` | Không | Chi tiết một bài học |
| POST | `/lessons` | Teacher | Tạo bài học mới (chưa có video) |
| POST | `/lessons/{lesson_id}/upload` | Teacher | Upload video cho bài học |
| GET | `/lessons/{lesson_id}/stream` | Không | Stream video (HTTP Range Request, hỗ trợ tua) |
| PUT | `/lessons/{lesson_id}` | Teacher | Cập nhật metadata bài học |
| DELETE | `/lessons/{lesson_id}` | Teacher | Xóa bài học và file video |

## Chạy service

```bash
# Từ thư mục gốc dự án
docker compose up lesson-service --build
```

## Cấu trúc thư mục

```
lesson-service/
├── Dockerfile
├── requirements.txt
├── readme.md
└── src/
    ├── main.py       # API endpoints + video streaming logic
    ├── models.py     # SQLAlchemy model: Lesson
    ├── schemas.py    # Pydantic schemas: LessonCreate, LessonUpdate, LessonResponse
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
| `VIDEO_STORAGE_PATH` | Thư mục lưu file video | `/app/videos` |

## Ghi chú

- Video được lưu trên filesystem với tên UUID ngẫu nhiên để tránh trùng
- `video_url` trả về dạng `/api/lessons/{id}/stream` — frontend dùng làm `src` cho `<video>`
- Streaming hỗ trợ **HTTP 206 Partial Content** để video có thể tua (seek) mà không cần tải lại
- Gateway tắt buffer (`proxy_buffering off`) cho endpoint `/stream` để video mượt
- Khi xóa bài học, file video trên disk cũng bị xóa theo
