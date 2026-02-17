# backend/db_models.py - UPDATED (keep only FlexYourBrain models)

from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float, JSON, ForeignKey, Date
from sqlalchemy.orm import declarative_base, relationship
import secrets

Base = declarative_base()

# ============================================
# USER & AUTH
# ============================================

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="user")
    
    # Profile fields
    avatar_url = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    target_role = Column(String(100), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    github_url = Column(String(255), nullable=True)
    date_of_birth = Column(Date, nullable=True)  
    hobbies = Column(Text, nullable=True)        
    skills = Column(Text, nullable=True)         
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships - COMMENT OUT Module 1 & 3 relationships
    # interviews = relationship("Interview", back_populates="user", cascade="all, delete-orphan")
    # progress = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")
    reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete")
    
    # Relationships - FlexYourBrain Module (KEEP THESE)
    aptitude_tests = relationship("AptitudeTest", back_populates="user", cascade="all, delete-orphan")
    aptitude_progress = relationship("AptitudeProgress", back_populates="user", cascade="all, delete-orphan")
    
    # Relationships - CareerCrush Module (COMMENT OUT)
    # resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    # cover_letters = relationship("CoverLetter", back_populates="user", cascade="all, delete-orphan")
    # career_progress = relationship("CareerProgress", back_populates="user", cascade="all, delete-orphan")
    
    # Relationships - Gamification (COMMENT OUT)
    # gamification = relationship("GamificationStats", back_populates="user", uselist=False, cascade="all, delete")
    # activities = relationship("UserActivity", back_populates="user", cascade="all, delete")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    token = Column(String, unique=True, index=True)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(hours=1))

    user = relationship("User", back_populates="reset_tokens")


# ============================================
# GAMIFICATION SYSTEM - COMMENT OUT ENTIRE SECTION
# ============================================
"""
class GamificationStats(Base):
    __tablename__ = "gamification_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    total_xp = Column(Integer, default=0, nullable=False)
    current_level = Column(Integer, default=1, nullable=False)
    xp_to_next_level = Column(Integer, default=100, nullable=False)
    
    current_streak = Column(Integer, default=0, nullable=False)
    longest_streak = Column(Integer, default=0, nullable=False)
    last_activity_date = Column(Date, nullable=True)
    
    badges_earned = Column(JSON, default=list, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="gamification")


class Badge(Base):
    __tablename__ = "badges"
    
    id = Column(Integer, primary_key=True, index=True)
    badge_key = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)
    requirement_type = Column(String(50), nullable=False)
    requirement_value = Column(Integer, nullable=False)
    xp_reward = Column(Integer, default=50, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserActivity(Base):
    __tablename__ = "user_activities"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    activity_type = Column(String(50), nullable=False)
    activity_date = Column(Date, nullable=False, index=True)
    xp_earned = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="activities")
"""

# ============================================
# MODULE 1: INTERVIEW IQ - COMMENT OUT ENTIRE SECTION
# ============================================
"""
class Interview(Base):
    __tablename__ = "interviews"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    domain = Column(String(50))
    question = Column(Text)
    response = Column(Text)
    feedback = Column(JSON)
    audio_path = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="interviews")


class UserProgress(Base):
    __tablename__ = "user_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    domain = Column(String(50))
    total_sessions = Column(Integer, default=0)
    avg_clarity_score = Column(Float, default=0.0)
    avg_confidence_score = Column(Float, default=0.0)
    avg_grammar_score = Column(Float, default=0.0)
    avg_overall_score = Column(Float, default=0.0)
    last_practice_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="progress")


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    domain = Column(String(50), nullable=False, index=True)
    question = Column(Text, nullable=False)
    ideal_answer = Column(Text, nullable=True)
    difficulty = Column(String(20), default='medium', nullable=False)
    tags = Column(JSON, default=list, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
"""

# ============================================
# MODULE 2: FLEXYOURBRAIN (MEMBER 2) - KEEP ALL THESE
# ============================================

class AptitudeQuestion(Base):
    """Master question bank for all aptitude categories"""
    __tablename__ = "aptitude_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(100), nullable=False, index=True)
    subcategory = Column(String(100))
    difficulty = Column(String(20), index=True)
    question_text = Column(Text, nullable=False)
    options = Column(JSON)
    correct_answer = Column(String(10), nullable=False)
    explanation = Column(Text)
    time_limit = Column(Integer, default=60)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    attempts = relationship("AptitudeAttempt", back_populates="question")


class AptitudeTest(Base):
    """Individual test sessions"""
    __tablename__ = "aptitude_tests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    test_type = Column(String(50), nullable=False)  # practice, mock, sjt
    category = Column(String(100), index=True)
    total_questions = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    score_percentage = Column(Float, default=0.0)
    time_taken = Column(Integer)  # in seconds
    time_limit = Column(Integer)  # in seconds
    status = Column(String(50), default="pending")  # pending, in_progress, completed
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    
    # Relationships
    user = relationship("User", back_populates="aptitude_tests")
    attempts = relationship("AptitudeAttempt", back_populates="test", cascade="all, delete-orphan")


class AptitudeAttempt(Base):
    """Individual question attempts within a test"""
    __tablename__ = "aptitude_attempts"
    
    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("aptitude_tests.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("aptitude_questions.id", ondelete="CASCADE"), nullable=False)
    user_answer = Column(String(500))
    is_correct = Column(Boolean, default=False)
    time_taken = Column(Integer)  # in seconds
    attempted_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    test = relationship("AptitudeTest", back_populates="attempts")
    question = relationship("AptitudeQuestion", back_populates="attempts")


class AptitudeProgress(Base):
    """Progress tracking for FlexYourBrain module"""
    __tablename__ = "aptitude_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(100), nullable=False)
    
    # Session Stats
    total_tests = Column(Integer, default=0)
    total_questions_attempted = Column(Integer, default=0)
    total_correct_answers = Column(Integer, default=0)
    
    # Score Averages
    avg_score_percentage = Column(Float, default=0.0)
    best_score_percentage = Column(Float, default=0.0)
    avg_time_per_question = Column(Float, default=0.0)
    
    # Difficulty Performance
    easy_accuracy = Column(Float, default=0.0)
    medium_accuracy = Column(Float, default=0.0)
    hard_accuracy = Column(Float, default=0.0)
    
    # Activity Tracking
    last_practice_date = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="aptitude_progress")


class SJTScenario(Base):
    """Situational Judgement Test scenarios"""
    __tablename__ = "sjt_scenarios"
    
    id = Column(Integer, primary_key=True, index=True)
    scenario_text = Column(Text, nullable=False)
    options = Column(JSON)
    most_effective = Column(String(10))
    least_effective = Column(String(10))
    explanation = Column(Text)
    category = Column(String(100), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ============================================
# MODULE 3: CAREERCRUSH - COMMENT OUT ENTIRE SECTION
# ============================================
"""
class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50))
    parsed_text = Column(Text)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="resumes")
    analyses = relationship("ResumeAnalysis", back_populates="resume", cascade="all, delete-orphan")


class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    job_description = Column(Text, nullable=False)
    job_title = Column(String(200))
    company_name = Column(String(200))
    
    match_score = Column(Float, default=0.0)
    ats_score = Column(Float, default=0.0)
    
    matched_keywords = Column(JSON)
    missing_keywords = Column(JSON)
    suggestions = Column(JSON)
    
    skills_match = Column(Float, default=0.0)
    experience_match = Column(Float, default=0.0)
    education_match = Column(Float, default=0.0)
    formatting_score = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    resume = relationship("Resume", back_populates="analyses")


class CoverLetter(Base):
    __tablename__ = "cover_letters"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    job_title = Column(String(200))
    company_name = Column(String(200))
    job_description = Column(Text)
    generated_letter = Column(Text, nullable=False)
    
    generation_method = Column(String(50), default="template")
    is_edited = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="cover_letters")


class CareerProgress(Base):
    __tablename__ = "career_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    total_resumes_uploaded = Column(Integer, default=0)
    total_analyses_run = Column(Integer, default=0)
    avg_ats_score = Column(Float, default=0.0)
    best_ats_score = Column(Float, default=0.0)
    avg_match_score = Column(Float, default=0.0)
    
    total_cover_letters = Column(Integer, default=0)
    
    last_activity_date = Column(DateTime)
    resumes_this_week = Column(Integer, default=0)
    resumes_this_month = Column(Integer, default=0)
    
    ats_score_improvement = Column(Float, default=0.0)
    most_improved_area = Column(String(100))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="career_progress")
"""