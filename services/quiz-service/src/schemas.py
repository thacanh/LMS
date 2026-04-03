from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


class QuestionCreate(BaseModel):
    text: str
    options: List[str]
    correct_index: int
    order: int = 0


class QuestionResponse(BaseModel):
    id: str
    text: str
    options: List[str]
    order: int
    # correct_index is NOT returned to students (only to teachers)

    model_config = {"from_attributes": True}


class QuestionWithAnswerResponse(QuestionResponse):
    correct_index: int  # Included for teachers viewing answers


class QuizCreate(BaseModel):
    course_id: str
    title: str
    description: Optional[str] = None
    pass_score: float = 70.0
    questions: List[QuestionCreate]


class QuizResponse(BaseModel):
    id: str
    course_id: str
    title: str
    description: Optional[str]
    pass_score: float
    created_at: datetime
    questions: List[QuestionResponse]

    model_config = {"from_attributes": True}


class AttemptSubmit(BaseModel):
    answers: Dict[str, int]  # {question_id: chosen_index}


class AttemptResponse(BaseModel):
    id: str
    quiz_id: str
    user_id: str
    answers: Dict[str, int]
    score: float
    passed: bool
    submitted_at: datetime

    model_config = {"from_attributes": True}
