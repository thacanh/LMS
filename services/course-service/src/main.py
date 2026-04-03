from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .database import engine, get_db, Base
from .models import Course
from .schemas import CourseCreate, CourseUpdate, CourseResponse
from .security import get_current_user, require_teacher

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Course Service", version="1.0.0")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/courses", response_model=List[CourseResponse])
def list_courses(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """List all published courses. Students can view without auth."""
    return db.query(Course).filter(Course.is_published == True).offset(skip).limit(limit).all()


@app.get("/courses/all", response_model=List[CourseResponse])
def list_all_courses(
    db: Session = Depends(get_db),
    payload: dict = Depends(require_teacher),
):
    """Teacher: list all their own courses (published + unpublished)."""
    return db.query(Course).filter(Course.teacher_id == payload["sub"]).all()


@app.get("/courses/{course_id}", response_model=CourseResponse)
def get_course(course_id: str, db: Session = Depends(get_db)):
    """Get a single course by ID."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail={"error": "Course not found"})
    return course


@app.post("/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(
    course_in: CourseCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_teacher),
):
    """Teacher: create a new course."""
    course = Course(
        title=course_in.title,
        description=course_in.description,
        thumbnail_url=course_in.thumbnail_url,
        is_published=course_in.is_published,
        teacher_id=payload["sub"],
        teacher_name=payload.get("email", "Teacher"),
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@app.put("/courses/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: str,
    course_in: CourseUpdate,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_teacher),
):
    """Teacher: update an existing course (own only)."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail={"error": "Course not found"})
    if course.teacher_id != payload["sub"]:
        raise HTTPException(status_code=403, detail={"error": "Not your course"})

    for field, value in course_in.model_dump(exclude_unset=True).items():
        setattr(course, field, value)
    db.commit()
    db.refresh(course)
    return course


@app.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(
    course_id: str,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_teacher),
):
    """Teacher: delete a course (own only)."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail={"error": "Course not found"})
    if course.teacher_id != payload["sub"]:
        raise HTTPException(status_code=403, detail={"error": "Not your course"})
    db.delete(course)
    db.commit()
