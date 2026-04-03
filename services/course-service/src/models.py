from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, Boolean
from sqlalchemy.dialects.mysql import CHAR
from .database import Base
import uuid
import datetime


class Course(Base):
    __tablename__ = "courses"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    teacher_id = Column(CHAR(36), nullable=False, index=True)
    teacher_name = Column(String(255), nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
