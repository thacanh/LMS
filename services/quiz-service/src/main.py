from typing import List

from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .database import engine, get_db, Base
from .models import Quiz, Question, Attempt
from .schemas import (
    QuizCreate, QuizResponse, AttemptSubmit, AttemptResponse, QuestionResponse
)
from .security import get_current_user, require_teacher

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Quiz Service", version="1.0.0")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/quiz/course/{course_id}", response_model=List[QuizResponse])
def list_quizzes(course_id: str, db: Session = Depends(get_db)):
    """List all quizzes for a course."""
    quizzes = db.query(Quiz).filter(Quiz.course_id == course_id).all()
    # Hide correct_index from quiz listing
    result = []
    for q in quizzes:
        q_dict = {
            "id": q.id,
            "course_id": q.course_id,
            "title": q.title,
            "description": q.description,
            "pass_score": q.pass_score,
            "created_at": q.created_at,
            "questions": [
                {"id": qu.id, "text": qu.text, "options": qu.options, "order": qu.order}
                for qu in sorted(q.questions, key=lambda x: x.order)
            ],
        }
        result.append(q_dict)
    return result


@app.get("/quiz/{quiz_id}", response_model=QuizResponse)
def get_quiz(quiz_id: str, db: Session = Depends(get_db)):
    """Get quiz details (correct_index hidden from students)."""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail={"error": "Quiz not found"})
    return {
        "id": quiz.id,
        "course_id": quiz.course_id,
        "title": quiz.title,
        "description": quiz.description,
        "pass_score": quiz.pass_score,
        "created_at": quiz.created_at,
        "questions": [
            {"id": q.id, "text": q.text, "options": q.options, "order": q.order}
            for q in sorted(quiz.questions, key=lambda x: x.order)
        ],
    }


@app.post("/quiz", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
def create_quiz(
    quiz_in: QuizCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_teacher),
):
    """Teacher: create quiz with questions in one request."""
    quiz = Quiz(
        course_id=quiz_in.course_id,
        title=quiz_in.title,
        description=quiz_in.description,
        pass_score=quiz_in.pass_score,
    )
    db.add(quiz)
    db.flush()  # Get quiz.id before adding questions

    for q_in in quiz_in.questions:
        question = Question(
            quiz_id=quiz.id,
            text=q_in.text,
            options=q_in.options,
            correct_index=q_in.correct_index,
            order=q_in.order,
        )
        db.add(question)

    db.commit()
    db.refresh(quiz)

    return {
        "id": quiz.id,
        "course_id": quiz.course_id,
        "title": quiz.title,
        "description": quiz.description,
        "pass_score": quiz.pass_score,
        "created_at": quiz.created_at,
        "questions": [
            {"id": q.id, "text": q.text, "options": q.options, "order": q.order}
            for q in sorted(quiz.questions, key=lambda x: x.order)
        ],
    }


@app.post("/quiz/{quiz_id}/submit", response_model=AttemptResponse)
def submit_quiz(
    quiz_id: str,
    submission: AttemptSubmit,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user),
):
    """
    Student: submit answers and get auto-graded result.
    Score = correct_answers / total_questions * 100.
    """
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail={"error": "Quiz not found"})

    questions = {q.id: q for q in quiz.questions}
    if not questions:
        raise HTTPException(status_code=400, detail={"error": "Quiz has no questions"})

    # Auto-grade: compare submitted answers to correct_index
    correct_count = 0
    for q_id, chosen in submission.answers.items():
        q = questions.get(q_id)
        if q and q.correct_index == chosen:
            correct_count += 1

    score = (correct_count / len(questions)) * 100
    passed = score >= quiz.pass_score

    attempt = Attempt(
        quiz_id=quiz_id,
        user_id=payload["sub"],
        answers=submission.answers,
        score=round(score, 2),
        passed=passed,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt


@app.get("/quiz/{quiz_id}/attempts", response_model=List[AttemptResponse])
def get_attempts(
    quiz_id: str,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user),
):
    """Get current user's attempt history for a quiz."""
    return (
        db.query(Attempt)
        .filter(Attempt.quiz_id == quiz_id, Attempt.user_id == payload["sub"])
        .order_by(Attempt.submitted_at.desc())
        .all()
    )


@app.delete("/quiz/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quiz(
    quiz_id: str,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_teacher),
):
    """Teacher: delete quiz and all associated data."""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail={"error": "Quiz not found"})
    db.delete(quiz)
    db.commit()
