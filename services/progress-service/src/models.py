from sqlalchemy import Column, String, DateTime, Enum, Float, Integer, UniqueConstraint
from sqlalchemy.dialects.mysql import CHAR
from .database import Base
import uuid
import datetime


class Progress(Base):
    __tablename__ = "progress"
    __table_args__ = (
        # One progress record per (user, lesson) — enforced at DB level
        UniqueConstraint("user_id", "lesson_id", name="uq_user_lesson"),
    )

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(CHAR(36), nullable=False, index=True)
    lesson_id = Column(CHAR(36), nullable=False, index=True)
    course_id = Column(CHAR(36), nullable=False, index=True)
    status = Column(
        Enum("not_started", "in_progress", "completed"),
        nullable=False,
        default="not_started",
    )
    progress_percent = Column(Float, default=0.0)
    last_position = Column(Float, default=0.0)   # seconds into video
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
