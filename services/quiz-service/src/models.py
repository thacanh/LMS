from sqlalchemy import Column, String, Text, DateTime, Integer, Float, Boolean, ForeignKey, JSON
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.orm import relationship
from .database import Base
import uuid
import datetime


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    course_id = Column(CHAR(36), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    pass_score = Column(Float, default=70.0)  # Passing percentage
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("Attempt", back_populates="quiz", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = Column(CHAR(36), ForeignKey("quizzes.id"), nullable=False)
    text = Column(Text, nullable=False)          # Question text
    options = Column(JSON, nullable=False)        # List[str] — answer choices
    correct_index = Column(Integer, nullable=False)  # Index into options (0-based)
    order = Column(Integer, default=0)

    quiz = relationship("Quiz", back_populates="questions")


class Attempt(Base):
    __tablename__ = "attempts"

    id = Column(CHAR(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = Column(CHAR(36), ForeignKey("quizzes.id"), nullable=False)
    user_id = Column(CHAR(36), nullable=False, index=True)
    answers = Column(JSON, nullable=False)        # {question_id: chosen_index}
    score = Column(Float, nullable=False)         # Percentage 0-100
    passed = Column(Boolean, nullable=False)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)

    quiz = relationship("Quiz", back_populates="attempts")
