# Course Service

## Tổng quan

Course Service quản lý toàn bộ thông tin khóa học trong hệ thống LMS.

- **Domain:** Khóa học (courses)
- **Dữ liệu sở hữu:** Bảng `courses` (id, tiêu đề, mô tả, giáo viên, trạng thái xuất bản)
- **Chức năng:** CRUD khóa học, phân quyền giáo viên/học viên, lọc khóa học đã xuất bản

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
| GET | `/courses` | Không | Danh sách khóa học đã xuất bản (`?skip=0&limit=20`) |
| GET | `/courses/all` | Teacher | Tất cả khóa học của giáo viên (kể cả bản nháp) |
| GET | `/courses/{course_id}` | Không | Chi tiết một khóa học |
| POST | `/courses` | Teacher | Tạo khóa học mới |
| PUT | `/courses/{course_id}` | Teacher | Cập nhật khóa học (chỉ chủ sở hữu) |
| DELETE | `/courses/{course_id}` | Teacher | Xóa khóa học (chỉ chủ sở hữu) |

## Chạy service

```bash
# Từ thư mục gốc dự án
docker compose up course-service --build
```

## Cấu trúc thư mục

```
course-service/
├── Dockerfile
├── requirements.txt
├── readme.md
└── src/
    ├── main.py       # Định nghĩa API endpoints
    ├── models.py     # SQLAlchemy model: Course
    ├── schemas.py    # Pydantic schemas: CourseCreate, CourseUpdate, CourseResponse
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

- `GET /courses` trả về **chỉ các khóa học đã xuất bản** — học viên không thấy bản nháp
- `GET /courses/all` trả về **tất cả khóa học của giáo viên** đang đăng nhập (lọc theo `teacher_id`)
- Mỗi khóa học lưu `teacher_id` và `teacher_name` từ JWT payload tại thời điểm tạo
