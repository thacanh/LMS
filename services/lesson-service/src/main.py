import os
import uuid
import mimetypes
from pathlib import Path
from typing import List

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from .database import engine, get_db, Base
from .models import Lesson
from .schemas import LessonCreate, LessonUpdate, LessonResponse
from .security import get_current_user, require_teacher

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Lesson Service", version="1.0.0")

# Storage directory for uploaded videos
VIDEO_DIR = Path(os.getenv("VIDEO_STORAGE_PATH", "/app/videos"))
VIDEO_DIR.mkdir(parents=True, exist_ok=True)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/lessons/course/{course_id}", response_model=List[LessonResponse])
def list_lessons(course_id: str, db: Session = Depends(get_db)):
    """List all lessons for a course, ordered by display order."""
    return (
        db.query(Lesson)
        .filter(Lesson.course_id == course_id)
        .order_by(Lesson.order)
        .all()
    )


@app.get("/lessons/{lesson_id}", response_model=LessonResponse)
def get_lesson(lesson_id: str, db: Session = Depends(get_db)):
    """Get a single lesson by ID."""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail={"error": "Lesson not found"})
    return lesson


@app.post("/lessons", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
def create_lesson(
    lesson_in: LessonCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_teacher),
):
    """Teacher: create a new lesson (without video, upload separately)."""
    lesson = Lesson(
        course_id=lesson_in.course_id,
        title=lesson_in.title,
        description=lesson_in.description,
        order=lesson_in.order,
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


@app.post("/lessons/{lesson_id}/upload", response_model=LessonResponse)
async def upload_video(
    lesson_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    payload: dict = Depends(require_teacher),
):
    """Teacher: upload video cho bài học. Lưu file vào VIDEO_STORAGE_PATH."""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail={"error": "Lesson not found"})

    # Kiểm tra quyền sở hữu qua khóa học
    from .database import engine as _eng
    from sqlalchemy import text
    with _eng.connect() as conn:
        row = conn.execute(
            text("SELECT teacher_id FROM lms_courses.courses WHERE id = :cid"),
            {"cid": lesson.course_id},
        ).fetchone()
    if not row or row[0] != payload["sub"]:
        raise HTTPException(status_code=403, detail={"error": "Not your lesson"})

    # Validate file type
    content_type = file.content_type or ""
    if not content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail={"error": "File must be a video"})

    # Lưu file với tên UUID để tránh trùng
    ext = Path(file.filename).suffix if file.filename else ".mp4"
    filename = f"{uuid.uuid4()}{ext}"
    filepath = VIDEO_DIR / filename

    # Dùng run_in_threadpool để không block Event Loop khi ghi file nặng
    file_bytes = await file.read()
    await run_in_threadpool(filepath.write_bytes, file_bytes)

    # Cập nhật bản ghi lesson
    lesson.video_path = str(filepath)
    lesson.video_url = f"/api/lessons/{lesson_id}/stream"
    db.commit()
    db.refresh(lesson)
    return lesson


@app.get("/lessons/{lesson_id}/stream")
def stream_video(lesson_id: str, request: Request, db: Session = Depends(get_db)):
    """
    Stream video with HTTP Range Request support for seeking.
    Frontend passes Range header; we respond with partial content (206).
    """
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson or not lesson.video_path:
        raise HTTPException(status_code=404, detail={"error": "Video not found"})

    filepath = Path(lesson.video_path)
    if not filepath.exists():
        raise HTTPException(status_code=404, detail={"error": "Video file missing from storage"})

    file_size = filepath.stat().st_size
    mime_type, _ = mimetypes.guess_type(str(filepath))
    mime_type = mime_type or "video/mp4"

    range_header = request.headers.get("range")

    if range_header:
        # Parse "bytes=start-end"
        range_val = range_header.strip().lower().replace("bytes=", "")
        parts = range_val.split("-")
        start = int(parts[0]) if parts[0] else 0
        end = int(parts[1]) if parts[1] else file_size - 1
        end = min(end, file_size - 1)
        length = end - start + 1

        def iter_file():
            with open(filepath, "rb") as f:
                f.seek(start)
                remaining = length
                while remaining > 0:
                    chunk_size = min(1024 * 64, remaining)  # 64KB chunks
                    data = f.read(chunk_size)
                    if not data:
                        break
                    remaining -= len(data)
                    yield data

        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(length),
            "Content-Type": mime_type,
        }
        return StreamingResponse(iter_file(), status_code=206, headers=headers)
    else:
        # Full file response
        def iter_full():
            with open(filepath, "rb") as f:
                while chunk := f.read(1024 * 64):
                    yield chunk

        return StreamingResponse(
            iter_full(),
            media_type=mime_type,
            headers={"Accept-Ranges": "bytes", "Content-Length": str(file_size)},
        )


@app.put("/lessons/{lesson_id}", response_model=LessonResponse)
def update_lesson(
    lesson_id: str,
    lesson_in: LessonUpdate,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_teacher),
):
    """Teacher: update lesson metadata."""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail={"error": "Lesson not found"})
    for field, value in lesson_in.model_dump(exclude_unset=True).items():
        setattr(lesson, field, value)
    db.commit()
    db.refresh(lesson)
    return lesson


@app.delete("/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lesson(
    lesson_id: str,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_teacher),
):
    """Teacher: delete lesson and its video file."""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail={"error": "Lesson not found"})
    # Clean up video file from disk
    if lesson.video_path:
        p = Path(lesson.video_path)
        if p.exists():
            p.unlink()
    db.delete(lesson)
    db.commit()
