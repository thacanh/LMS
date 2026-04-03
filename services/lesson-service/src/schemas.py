from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class LessonCreate(BaseModel):
    course_id: str
    title: str
    description: Optional[str] = None
    order: int = 0


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order: Optional[int] = None
    duration: Optional[float] = None


class LessonResponse(BaseModel):
    id: str
    course_id: str
    title: str
    description: Optional[str]
    video_url: Optional[str]
    duration: float
    order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
