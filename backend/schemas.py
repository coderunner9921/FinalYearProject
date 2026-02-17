# backend/schemas.py - UPDATED (only keep FlexYourBrain schemas)

from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime, date

# =================== USER SCHEMAS ===================
# Keep all user schemas

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    email: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    target_role: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    date_of_birth: Optional[date] = None
    hobbies: Optional[str] = None
    skills: Optional[str] = None
    role: str
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    user: UserResponse

# REMOVED: All InterviewIQ schemas (InterviewResponse, InterviewHistoryResponse, DomainProgressResponse, InterviewQuestionResponse)

# =================== FLEXYOURBRAIN SCHEMAS (MEMBER 2) ===================
# Keep ALL these

class AptitudeQuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    category: str
    subcategory: Optional[str]
    difficulty: str
    question_text: str
    options: List[str]
    time_limit: int
    # Note: correct_answer and explanation excluded for security

class AptitudeTestCreate(BaseModel):
    test_type: str  # practice, mock, sjt
    category: str
    time_limit: Optional[int] = None

class AptitudeTestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    test_type: str
    category: str
    total_questions: int
    correct_answers: int
    score_percentage: float
    time_taken: Optional[int]
    status: str
    started_at: datetime
    completed_at: Optional[datetime]

class AptitudeSubmitAnswer(BaseModel):
    test_id: int
    question_id: int
    user_answer: Optional[str]
    time_taken: int

class AptitudeProgressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    category: str
    total_tests: int
    total_questions_attempted: int
    total_correct_answers: int
    avg_score_percentage: float
    best_score_percentage: float
    avg_time_per_question: float
    easy_accuracy: float
    medium_accuracy: float
    hard_accuracy: float
    last_practice_date: datetime

# REMOVED: All CareerCrush schemas (ResumeUploadResponse, ResumeAnalysisCreate, ResumeAnalysisResponse, 
#          CoverLetterCreate, CoverLetterResponse, CareerProgressResponse)

# =================== PASSWORD RESET SCHEMAS ===================
# Keep these

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class PasswordResetResponse(BaseModel):
    message: str
    dev_token: Optional[str] = None

class TokenVerificationResponse(BaseModel):
    valid: bool
    email: str

# =================== DASHBOARD SCHEMAS ===================
# Simplified for FlexYourBrain only

class FlexYourBrainDashboardStats(BaseModel):
    """Stats for FlexYourBrain module only"""
    total_tests: int
    overall_score: float
    category_breakdown: Optional[dict] = None
    tests_by_type: Optional[dict] = None

# REMOVED: MasterDashboardStats, UserDashboardResponse

# =================== GAMIFICATION SCHEMAS ===================
# REMOVED ALL: GamificationStatsResponse, BadgeResponse, XPAwardResponse, LeaderboardEntry, UserActivityResponse