from typing import List
from fastapi import FastAPI, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from .database import engine, get_db, Base
from .models import User
from .schemas import UserCreate, UserLogin, UserUpdate, UserResponse, Token, TokenValidateResponse
from .security import hash_password, verify_password, create_token, get_current_user

# Tạo bảng khi khởi động (idempotent)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Auth Service", version="1.0.0")


# ── Health Check ──────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    """Kiểm tra trạng thái service — bắt buộc có ở mọi service."""
    return {"status": "ok", "service": "auth"}


# ── Đăng ký / Đăng nhập ──────────────────────────────────────────────────────

@app.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Đăng ký tài khoản mới. Role có thể là 'student' hoặc 'teacher'."""
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Email đã được đăng ký"},
        )
    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hash_password(user_in.password),
        role=user_in.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/auth/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Xác thực và trả về JWT token."""
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "Sai email hoặc mật khẩu"},
        )
    token = create_token({"sub": user.id, "role": user.role, "email": user.email})
    return Token(access_token=token, role=user.role, user_id=user.id)


@app.post("/auth/logout")
def logout(current_user: User = Depends(get_current_user)):
    """
    Đăng xuất người dùng.
    Server trả về 200 để xác nhận — frontend xử lý việc xóa token khỏi localStorage.
    (Stateless JWT: token hết hạn theo thời gian cấu hình trong JWT_EXPIRE_MINUTES)
    """
    return {"message": "Đăng xuất thành công", "user_id": current_user.id}


# ── Thông tin cá nhân ────────────────────────────────────────────────────────

@app.get("/auth/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    """Lấy thông tin profile của người dùng đang đăng nhập."""
    return current_user


@app.put("/auth/me", response_model=UserResponse)
def update_me(
    update_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Cập nhật thông tin cá nhân (họ tên, mật khẩu).
    Chỉ người dùng hiện tại mới có thể sửa profile của mình.
    """
    if update_in.full_name is not None:
        current_user.full_name = update_in.full_name
    if update_in.password is not None:
        current_user.hashed_password = hash_password(update_in.password)

    db.commit()
    db.refresh(current_user)
    return current_user


# ── Validate Token ────────────────────────────────────────────────────────────

@app.get("/auth/validate", response_model=TokenValidateResponse)
def validate_token(current_user: User = Depends(get_current_user)):
    """
    Xác thực JWT token và trả về thông tin user cốt lõi.
    Dùng cho các service nội bộ muốn verify token mà không cần decode trực tiếp.
    Ví dụ: GET /api/auth/validate (Authorization: Bearer <token>)
    """
    return TokenValidateResponse(
        user_id=current_user.id,
        email=current_user.email,
        role=current_user.role,
    )


# ── Quản lý người dùng (Teacher only) ────────────────────────────────────────

@app.get("/auth/users", response_model=List[UserResponse])
def list_users(
    role: str = Query(None, description="Lọc theo role: student | teacher"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Danh sách tất cả người dùng — chỉ Teacher mới được xem.
    Hỗ trợ lọc theo role: ?role=student hoặc ?role=teacher
    """
    if current_user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "Chỉ giáo viên mới có quyền xem danh sách người dùng"},
        )
    query = db.query(User)
    if role in ("student", "teacher"):
        query = query.filter(User.role == role)
    return query.order_by(User.created_at.desc()).all()


@app.get("/auth/users/{user_id}", response_model=UserResponse)
def get_user(user_id: str, db: Session = Depends(get_db)):
    """Lấy thông tin user theo ID — dùng nội bộ giữa các service."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail={"error": "Không tìm thấy người dùng"})
    return user
