from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime


class ProgressUpdate(BaseModel):
    course_id: str
    status: Literal["not_started", "in_progress", "completed"] = "in_progress"
    progress_percent: float = 0.0
    last_position: float = 0.0  # seconds


class ProgressResponse(BaseModel):
    id: str
    user_id: str
    lesson_id: str
    course_id: str
    status: str
    progress_percent: float
    last_position: float
    updated_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class CourseProgressResponse(BaseModel):
    course_id: str
    total_lessons: int
    completed_lessons: int
    overall_percent: float
