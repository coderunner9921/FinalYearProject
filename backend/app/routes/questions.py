from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List
from app.config.database import get_db
from app.models.database_models import Question

router = APIRouter(prefix="/api/questions", tags=["questions"])

@router.get("/domains/")
async def get_available_domains(db: Session = Depends(get_db)):
    domains = db.query(Question.domain).distinct().all()
    return {"domains": [domain[0] for domain in domains]}

@router.get("/domain/{domain_name}")
async def get_questions_by_domain(domain_name: str, db: Session = Depends(get_db)):
    questions = (
    db.query(Question)
    .filter(func.lower(Question.domain) == domain_name.lower())
    .all()
)
    
    if not questions:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    return {
        "domain": domain_name,
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "expected_keywords": q.expected_keywords
            }
            for q in questions
        ]
    }

@router.get("/")
async def get_all_questions(db: Session = Depends(get_db)):
    questions = db.query(Question).all()
    return {
        "questions": [
            {
                "id": q.id,
                "domain": q.domain,
                "question_text": q.question_text
            }
            for q in questions
        ]
    }