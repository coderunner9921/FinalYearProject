from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models.database_models import InterviewSession, UserResponse, User

router = APIRouter(prefix="/api/interviews", tags=["interviews"])

@router.post("/start")
async def start_interview_session(user_id: int, domain: str, db: Session = Depends(get_db)):
    domain = domain.strip().lower()
    
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create new interview session
    session = InterviewSession(user_id=user_id, domain=domain)
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return {
        "session_id": session.id,
        "user_id": session.user_id,
        "domain": session.domain,
        "started_at": session.started_at
    }

@router.post("/{session_id}/complete")
async def complete_interview_session(session_id: int, overall_score: float, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.completed_at = func.now()
    session.overall_score = overall_score
    db.commit()
    
    return {"message": "Interview session completed", "session_id": session_id}