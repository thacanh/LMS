# Progress Service

## Tổng quan

Progress Service theo dõi tiến độ học tập của từng học viên theo từng bài học.

- **Domain:** Tiến độ học (progress)
- **Dữ liệu sở hữu:** Bảng `progress` (user_id, lesson_id, course_id, trạng thái, phần trăm, vị trí video)
- **Chức năng:** Ghi nhận tiến độ xem video, tổng hợp tiến độ khóa học, tiếp tục bài học dở dang

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
| GET | `/progress/lesson/{lesson_id}` | Có | Tiến độ của học viên tại một bài học |
| PUT | `/progress/lesson/{lesson_id}` | Có | Cập nhật tiến độ bài học (upsert, idempotent) |
| GET | `/progress/course/{course_id}` | Có | Tổng hợp tiến độ toàn bộ khóa học |
| GET | `/progress/continue` | Có | Bài học đang học dở dang gần nhất |
| GET | `/progress/all` | Có | Tất cả bản ghi tiến độ của học viên hiện tại |

## Trạng thái bài học

| Giá trị | Mô tả |
|---------|-------|
| `not_started` | Chưa bắt đầu |
| `in_progress` | Đang học |
| `completed` | Đã hoàn thành (xem ≥ 95%) |

## Chạy service

```bash
# Từ thư mục gốc dự án
docker compose up progress-service --build
```

## Cấu trúc thư mục

```
progress-service/
├── Dockerfile
├── requirements.txt
├── readme.md
└── src/
    ├── main.py       # API endpoints + logic tổng hợp tiến độ
    ├── models.py     # SQLAlchemy model: Progress
    ├── schemas.py    # Pydantic schemas: ProgressUpdate, ProgressResponse, CourseProgressResponse
    ├── security.py   # JWT decode, get_current_user dependency
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

- `PUT /progress/lesson/{id}` là **upsert** — tạo mới nếu chưa có, cập nhật nếu đã có
- `progress_percent` chỉ tăng, không giảm (`max(cũ, mới)`) — tránh mất tiến độ khi tua lại video
- Frontend gọi cập nhật tiến độ **mỗi 10 giây** khi đang xem và khi video kết thúc
- `GET /progress/continue` trả về bài học `in_progress` được cập nhật gần nhất — dùng cho nút "Tiếp tục học" ở trang chủ
