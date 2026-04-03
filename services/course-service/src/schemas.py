from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_published: bool = False


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_published: Optional[bool] = None


class CourseResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    teacher_id: str
    teacher_name: str
    thumbnail_url: Optional[str]
    is_published: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
