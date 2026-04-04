import datetime
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from .database import engine, get_db, Base
from .models import Progress
from .schemas import ProgressUpdate, ProgressResponse, CourseProgressResponse
from .security import get_current_user

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Progress Service", version="1.0.0")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/progress/lesson/{lesson_id}", response_model=ProgressResponse)
def get_lesson_progress(
    lesson_id: str,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user),
):
    """Get current user's progress for a specific lesson."""
    record = (
        db.query(Progress)
        .filter(Progress.user_id == payload["sub"], Progress.lesson_id == lesson_id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail={"error": "No progress record found"})
    return record


@app.put("/progress/lesson/{lesson_id}", response_model=ProgressResponse)
def update_lesson_progress(
    lesson_id: str,
    body: ProgressUpdate,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user),
):
    """
    Upsert tiến độ cho một bài học. Idempotent — dữ liệu mới nhất thắng.
    Frontend gọi mỗi 10 giây khi đang xem video.
    Bọc trong try/except IntegrityError để tránh race condition khi 2 request đến cùng lúc.
    """
    user_id = payload["sub"]
    record = (
        db.query(Progress)
        .filter(Progress.user_id == user_id, Progress.lesson_id == lesson_id)
        .first()
    )

    try:
        if record is None:
            record = Progress(
                user_id=user_id,
                lesson_id=lesson_id,
                course_id=body.course_id,
                status=body.status,
                progress_percent=body.progress_percent,
                last_position=body.last_position,
            )
            db.add(record)
            db.commit()
        else:
            # Last-write-wins: chỉ cập nhật nếu tiến độ tăng lên
            record.status = body.status
            record.progress_percent = max(record.progress_percent, body.progress_percent)
            record.last_position = body.last_position
            record.updated_at = datetime.datetime.utcnow()
            db.commit()
    except IntegrityError:
        # Race condition: 2 request cùng insert, cái sau bị conflict — fallback sang update
        db.rollback()
        record = (
            db.query(Progress)
            .filter(Progress.user_id == user_id, Progress.lesson_id == lesson_id)
            .first()
        )
        if record:
            record.status = body.status
            record.progress_percent = max(record.progress_percent, body.progress_percent)
            record.last_position = body.last_position
            record.updated_at = datetime.datetime.utcnow()
            db.commit()

    db.refresh(record)
    return record


@app.get("/progress/course/{course_id}", response_model=CourseProgressResponse)
def get_course_progress(
    course_id: str,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user),
):
    """Aggregate progress for all lessons in a course."""
    records = (
        db.query(Progress)
        .filter(Progress.user_id == payload["sub"], Progress.course_id == course_id)
        .all()
    )
    total = len(records)
    if total == 0:
        return CourseProgressResponse(
            course_id=course_id, total_lessons=0, completed_lessons=0, overall_percent=0.0
        )
    completed = sum(1 for r in records if r.status == "completed")
    avg_percent = sum(r.progress_percent for r in records) / total
    return CourseProgressResponse(
        course_id=course_id,
        total_lessons=total,
        completed_lessons=completed,
        overall_percent=round(avg_percent, 2),
    )


@app.get("/progress/continue", response_model=Optional[ProgressResponse])
def continue_learning(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user),
):
    """Return the most recently updated in-progress lesson for the user."""
    record = (
        db.query(Progress)
        .filter(
            Progress.user_id == payload["sub"],
            Progress.status == "in_progress",
        )
        .order_by(Progress.updated_at.desc())
        .first()
    )
    return record


@app.get("/progress/all", response_model=List[ProgressResponse])
def get_all_progress(
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user),
):
    """Return all progress records for the current user."""
    return db.query(Progress).filter(Progress.user_id == payload["sub"]).all()
