from pydantic import BaseModel, EmailStr, field_validator
from typing import Literal, Optional
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    role: Literal["student", "teacher"] = "student"

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Mật khẩu phải có ít nhất 6 ký tự")
        return v

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Họ tên không được để trống")
        return v.strip()


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Schema cập nhật thông tin cá nhân — tất cả trường đều optional."""
    full_name: Optional[str] = None
    password: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) < 6:
            raise ValueError("Mật khẩu phải có ít nhất 6 ký tự")
        return v

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Họ tên không được để trống")
        return v.strip() if v else v


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str


class TokenValidateResponse(BaseModel):
    """Kết quả validate token — trả về thông tin user cốt lõi."""
    user_id: str
    email: str
    role: str
    valid: bool = True
