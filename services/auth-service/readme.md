# Auth Service

## Tổng quan

Auth Service chịu trách nhiệm xác thực người dùng và quản lý danh tính trong hệ thống LMS.

- **Domain:** Tài khoản người dùng, xác thực, phân quyền
- **Dữ liệu sở hữu:** Bảng `users` (id, email, họ tên, mật khẩu đã hash, role)
- **Chức năng:** Đăng ký, đăng nhập, cấp JWT token, validate token, quản lý profile

## Tech Stack

| Thành phần | Lựa chọn |
|------------|----------|
| Ngôn ngữ | Python 3.12 |
| Framework | FastAPI |
| Database | MySQL (SQLAlchemy ORM) |
| Auth | JWT (python-jose), bcrypt (passlib) |

## API Endpoints

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/health` | Không | Kiểm tra trạng thái service |
| POST | `/auth/register` | Không | Đăng ký tài khoản mới |
| POST | `/auth/login` | Không | Đăng nhập, trả về JWT token |
| POST | `/auth/logout` | Có | Đăng xuất (xác nhận phía server) |
| GET | `/auth/me` | Có | Lấy thông tin người dùng hiện tại |
| PUT | `/auth/me` | Có | Cập nhật họ tên hoặc mật khẩu |
| GET | `/auth/validate` | Có | Xác thực JWT token, trả về user info |
| GET | `/auth/users` | Teacher | Danh sách tất cả người dùng (`?role=student\|teacher`) |
| GET | `/auth/users/{user_id}` | Không | Lấy thông tin user theo ID (nội bộ) |

> **Role:** `student` (mặc định) hoặc `teacher`

## Chạy service

```bash
# Từ thư mục gốc dự án
docker compose up auth-service --build
```

## Cấu trúc thư mục

```
auth-service/
├── Dockerfile
├── requirements.txt
├── readme.md
└── src/
    ├── main.py       # Định nghĩa API endpoints
    ├── models.py     # SQLAlchemy model: User
    ├── schemas.py    # Pydantic schemas: đầu vào/đầu ra
    ├── security.py   # JWT tạo/decode, bcrypt, dependency guards
    ├── database.py   # Kết nối DB, session
    └── __init__.py
```

## Biến môi trường

| Biến | Mô tả | Mặc định |
|------|-------|---------|
| `DATABASE_URL` | Chuỗi kết nối MySQL | `mysql+pymysql://...` |
| `JWT_SECRET` | Khóa bí mật ký JWT | `super-secret-lms-jwt-key` |
| `JWT_ALGORITHM` | Thuật toán JWT | `HS256` |
| `JWT_EXPIRE_MINUTES` | Thời gian hết hạn token (phút) | `10080` (7 ngày) |

## Ghi chú

- Mỗi service khác tự decode JWT bằng cùng `JWT_SECRET` — không gọi lại auth-service để validate
- Endpoint `GET /auth/validate` dùng cho debug hoặc service bên ngoài muốn verify token
- Logout stateless: server trả về 200, frontend tự xóa token khỏi `localStorage`
