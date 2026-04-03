# API Gateway

## Tổng quan

API Gateway là điểm vào duy nhất cho mọi request từ client. Gateway sử dụng **Nginx** để định tuyến request đến đúng microservice.

## Chức năng

| Chức năng | Mô tả |
|-----------|-------|
| **Request routing** | Chuyển tiếp request đến đúng service |
| **Rate limiting** | Chặn spam/brute-force: 60 req/phút (chung), 10 req/phút (auth) |
| **Gzip compression** | Nén response JSON giảm băng thông |
| **CORS** | Cho phép frontend cross-origin request |
| **Access logging** | Ghi log mọi request với thời gian xử lý |
| **Timeout & retry** | Tự retry khi service lỗi, timeout hợp lý |
| **Video streaming** | Hỗ trợ HTTP Range Request cho video, tắt buffer |

## Tech Stack

| Thành phần | Lựa chọn |
|------------|----------|
| Gateway | Nginx Alpine |
| Port | 8000 |

## Bảng định tuyến

| Path ngoài (Client gọi) | Service đích | URL nội bộ |
|-------------------------|-------------|------------|
| `/api/auth/*` | Auth Service | `http://auth-service:5001/auth/*` |
| `/api/courses/*` | Course Service | `http://course-service:5002/courses/*` |
| `/api/lessons/*` | Lesson Service | `http://lesson-service:5003/lessons/*` |
| `/api/lessons/:id/stream` | Lesson Service | streaming (no buffer) |
| `/api/progress/*` | Progress Service | `http://progress-service:5004/progress/*` |
| `/api/quiz/*` | Quiz Service | `http://quiz-service:5005/quiz/*` |
| `/*` (catch-all) | Frontend | `http://frontend:3000` |

## Rate Limiting

| Zone | Giới hạn | Áp dụng cho |
|------|---------|-------------|
| `api_auth` | 10 req/phút | `/api/auth/login`, `/api/auth/register`, `/api/auth/logout` |
| `api_general` | 60 req/phút | Tất cả API còn lại |

Khi bị rate limit → trả về **HTTP 429 Too Many Requests**.

## Health Checks

```bash
curl http://localhost:8000/api/health           # Gateway
curl http://localhost:8000/api/auth/health      # Auth Service
curl http://localhost:8000/api/courses/health   # Course Service
curl http://localhost:8000/api/lessons/health   # Lesson Service
curl http://localhost:8000/api/progress/health  # Progress Service
curl http://localhost:8000/api/quiz/health      # Quiz Service
```

## Chạy

```bash
# Từ thư mục gốc dự án
docker compose up gateway --build
```

## Ghi chú

- Dùng tên service (không phải `localhost`) cho upstream URL trong Docker
- Gateway expose port **8000** ra host
- Rate limit riêng cho auth endpoint để chống brute-force mật khẩu
- Video stream endpoint có timeout 3600s và tắt buffer
