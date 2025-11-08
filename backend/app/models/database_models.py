from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey, JSON, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    #updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    interview_sessions = relationship("InterviewSession", back_populates="user")
    progress = relationship("UserProgress", back_populates="user", uselist=False)

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    domain = Column(String(100), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    expected_keywords = Column(JSON, default=list)
    #difficulty_level = Column(String(50), default='medium')
    #created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user_responses = relationship("UserResponse", back_populates="question")

class InterviewSession(Base):
    __tablename__ = "interview_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    domain = Column(String(100), nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    overall_score = Column(Float)
    total_questions = Column(Integer, default=0)
    questions_answered = Column(Integer, default=0)
    
    # Relationships
    user = relationship("User", back_populates="interview_sessions")
    user_responses = relationship("UserResponse", back_populates="session")

class UserResponse(Base):
    __tablename__ = "user_responses"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    audio_file_path = Column(String(500))
    transcribed_text = Column(Text)
    sentiment_score = Column(Float)
    grammar_score = Column(Float)
    content_score = Column(Float)
    filler_word_count = Column(Integer)
    response_time_seconds = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Additional analysis fields
    confidence_score = Column(Float)
    fluency_score = Column(Float)
    overall_score = Column(Float)
    analysis_metadata = Column(JSON)  # Store additional analysis data
    
    # Relationships
    session = relationship("InterviewSession", back_populates="user_responses")
    question = relationship("Question", back_populates="user_responses")

class UserProgress(Base):
    __tablename__ = "user_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    level = Column(Integer, default=1)
    total_xp = Column(Integer, default=0)
    badges = Column(JSON, default=list)
    streak_count = Column(Integer, default=0)
    last_activity_date = Column(DateTime(timezone=True))
    total_sessions = Column(Integer, default=0)
    average_score = Column(Float, default=0.0)
    
    # Relationships
    user = relationship("User", back_populates="progress")

class Badge(Base):
    __tablename__ = "badges"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    icon_path = Column(String(255))
    criteria_xp = Column(Integer)
    criteria_type = Column(String(100))  # 'xp', 'sessions', 'score', etc.
    criteria_value = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# Helper functions
def create_tables():
    """Create all tables in the database"""
    from app.config.database import engine
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")

def drop_tables():
    """Drop all tables (for development/testing)"""
    from app.config.database import engine
    Base.metadata.drop_all(bind=engine)
    print("✅ Database tables dropped successfully")