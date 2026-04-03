from sqlalchemy import Column, String, Text, DateTime, Integer, Float
from sqlalchemy.dialects.mysql import CHAR
from .database import Base
import uuid
import datetime


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    course_id = Column(CHAR(36), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    # Filesystem path to the stored video file
    video_path = Column(String(500), nullable=True)
    # Public URL served via gateway for the video stream
    video_url = Column(String(500), nullable=True)
    duration = Column(Float, default=0.0)   # seconds
    order = Column(Integer, default=0)       # display order within course
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
