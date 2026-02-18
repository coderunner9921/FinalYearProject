# backend/main.py - FIXED VERSION
import sys
import os  # ← Must come BEFORE using os
import json
import random
import secrets
from datetime import datetime, timedelta

import traceback
import tempfile
from pathlib import Path
from typing import Optional, List
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from fastapi import BackgroundTasks, FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import pytz
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, func
from dotenv import load_dotenv
from pydantic import BaseModel
from backend.database import engine, AsyncSessionLocal, get_db
from backend.db_models import AptitudeProgress, AptitudeTest, Base, PasswordResetToken, User
from backend.schemas import (
    UserCreate, UserLogin, TokenResponse, UserResponse,
    ForgotPasswordRequest, ResetPasswordRequest
)
from backend.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, get_optional_user, get_db_dependency as auth_get_db_dependency
)
from backend.utils.email_utils import send_reset_email
from backend.routes.aptitude import router as aptitude_router

# REMOVED: interview_router, career_router, gamification, settings imports

# =================== ENVIRONMENT SETUP ===================
load_dotenv()

# Environment detection
ENV = os.getenv("ENV", "development")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

# Database URL (REQUIRED)
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("❌ DATABASE_URL environment variable is required")

# REMOVED: Whisper model configuration (was for InterviewIQ)

# =================== EMAIL CONFIG ===================
# Keep email config if you want password reset functionality
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

# Frontend URL configuration
if ENV == "development":
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
else:
    # Production: FRONTEND_URL is REQUIRED
    FRONTEND_URL = os.getenv("FRONTEND_URL")
    if not FRONTEND_URL:
        raise RuntimeError("❌ FRONTEND_URL must be set in production")

# CORS allowed origins
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", FRONTEND_URL).split(",")

# Security: Add production domains
if ENV != "development":
    # Ensure localhost is NOT allowed in production
    ALLOWED_ORIGINS = [origin for origin in ALLOWED_ORIGINS if "localhost" not in origin]

print(f"🌍 Environment: {ENV}")
print(f"🔗 Frontend URL: {FRONTEND_URL}")
print(f"✅ Allowed Origins: {ALLOWED_ORIGINS}")

# =================== DATABASE SETUP ===================

# CRITICAL FIX: Initialize auth dependency
def initialize_auth_dependency():
    """Initialize the auth module's database dependency"""
    auth_get_db_dependency.set_dependency(get_db)
    print("✅ Auth database dependency initialized")

initialize_auth_dependency()


# =================== PATHS ===================
BASE_DIR = Path(__file__).resolve().parent
# REMOVED: QUESTIONS_PATH, RECORDINGS_DIR (were for InterviewIQ)

# =================== FASTAPI APP ===================
app = FastAPI(
    title="SkillBridge API - FlexYourBrain Module",
    version="1.0.0",
    description="AI-powered aptitude testing platform",
    docs_url="/docs",
    redoc_url="/redoc",
    swagger_ui_parameters={"persistAuthorization": True},
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)


@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    print("=" * 80)
    print("🚀 SkillBridge API (FlexYourBrain Only) Starting...")
    print("=" * 80)
    print(f"📦 Environment: {ENV}")
    print(f"🐛 Debug Mode: {DEBUG}")
    print(f"🌐 Frontend URL: {FRONTEND_URL}")
    print(f"🗄️  Database: {'Connected' if DATABASE_URL else 'Not configured'}")
    print(f"📧 Email: {'Configured' if EMAIL_USER and EMAIL_PASS else 'Not configured'}")
    print("=" * 80)
    
    initialize_auth_dependency()
    
    # Verify database connection
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(select(1))
        print("✅ Database connection verified")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    await engine.dispose()
    print("🛑 Database connections closed")


# =================== HEALTH CHECK ===================
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "SkillBridge API - FlexYourBrain",
        "version": "1.0.0",
        "environment": ENV,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Detailed health check with database status"""
    try:
        # Check database connection
        await db.execute(select(1))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "email": "configured" if EMAIL_USER and EMAIL_PASS else "not configured",
        "environment": ENV,
        "timestamp": datetime.utcnow().isoformat()
    }


# =================== SWAGGER AUTH SETUP ===================
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    from fastapi.openapi.utils import get_openapi

    openapi_schema = get_openapi(
        title="SkillBridge API - FlexYourBrain",
        version="1.0.0",
        description="AI-powered aptitude testing platform",
        routes=app.routes,
    )

    openapi_schema["components"]["securitySchemes"] = {
        "HTTPBearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }

    app.openapi_schema = openapi_schema
    return app.openapi_schema

if DEBUG:
    app.openapi = custom_openapi


# =================== AUTH ROUTES ===================

@app.post("/auth/signup", response_model=TokenResponse)
async def signup(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register new user"""
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role="user",
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token({"user_id": new_user.id, "email": new_user.email})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(new_user))


@app.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login user"""
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"user_id": user.id, "email": user.email})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@app.get("/auth/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user info"""
    return UserResponse.model_validate(current_user)


# =================== PASSWORD RESET ROUTES ===================
# Keep password reset functionality if you want it

@app.post("/auth/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Request password reset"""
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    # Security: Always return success message (don't reveal if user exists)
    if not user:
        # Still return success message for security
        print(f"Password reset requested for non-existent email: {request.email}")
        return {
            "message": "If an account exists with this email, you'll receive a password reset link shortly."
        }

    # Generate secure token
    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1)

    # Delete any existing tokens for this user
    await db.execute(
        select(PasswordResetToken).where(PasswordResetToken.user_id == user.id)
    )
    
    # Save new token to database
    token_entry = PasswordResetToken(
        user_id=user.id,
        token=reset_token,
        expires_at=expires_at
    )
    db.add(token_entry)
    await db.commit()
    await db.refresh(token_entry)

    # Construct reset link
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"

    if DEBUG:
        # Development: Print to console
        print("\n" + "=" * 80)
        print("🔐 PASSWORD RESET REQUEST (DEBUG MODE)")
        print("=" * 80)
        print(f"📧 Email: {user.email}")
        print(f"🔗 Reset Link: {reset_link}")
        print(f"🎟️  Token: {reset_token}")
        print(f"⏰ Expires: {expires_at.strftime('%Y-%m-%d %H:%M:%S UTC')}")
        print("=" * 80 + "\n")
        
        # Also try to send email in debug mode for testing
        try:
            background_tasks.add_task(send_reset_email, user.email, reset_link)
            print("✅ Email sending task added in background")
        except Exception as e:
            print(f"⚠️ Could not send email in debug mode: {e}")
    else:
        # Production: Send email using background task
        background_tasks.add_task(send_reset_email, user.email, reset_link)
        print(f"✅ Password reset email queued for: {user.email}")

    return {
        "message": "If an account exists with this email, you'll receive a password reset link shortly.",
        "debug_mode": DEBUG
    }


@app.post("/auth/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """Reset password using token"""
    result = await db.execute(
        select(PasswordResetToken).where(PasswordResetToken.token == request.token)
    )
    token_entry = result.scalar_one_or_none()

    if not token_entry:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token"
        )

    # Check if token expired
    if datetime.utcnow() > token_entry.expires_at:
        await db.delete(token_entry)
        await db.commit()
        raise HTTPException(
            status_code=400,
            detail="Reset token has expired. Please request a new one."
        )

    # Fetch user
    result = await db.execute(
        select(User).where(User.id == token_entry.user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Update password
    user.password_hash = hash_password(request.new_password)
    user.updated_at = datetime.utcnow()

    # Delete used token
    await db.delete(token_entry)

    await db.commit()

    print(f"✅ Password reset successful for: {user.email}")

    return {
        "message": "Password reset successful",
        "email": user.email
    }


@app.get("/auth/verify-reset-token/{token}")
async def verify_reset_token(
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """Verify if reset token is valid"""
    result = await db.execute(
        select(PasswordResetToken).where(PasswordResetToken.token == token)
    )
    token_entry = result.scalar_one_or_none()

    if not token_entry:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired token"
        )

    # Check expiration
    if datetime.utcnow() > token_entry.expires_at:
        await db.delete(token_entry)
        await db.commit()
        raise HTTPException(
            status_code=400,
            detail="Token has expired. Please request a new reset link."
        )

    # Fetch user email
    result = await db.execute(
        select(User.email).where(User.id == token_entry.user_id)
    )
    user_email = result.scalar_one_or_none()

    if not user_email:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "valid": True,
        "email": user_email,
        "expires_at": token_entry.expires_at.isoformat()
    }


# =================== ROUTE IMPORTS ===================
# Include only aptitude router
app.include_router(
    aptitude_router, 
    prefix="/api/aptitude", 
    tags=["aptitude"]
)

# REMOVED: interview_router, career_router, gamification, settings


# =================== DASHBOARD ROUTES ===================
# Updated to only show FlexYourBrain stats

@app.get("/api/dashboard/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get stats for FlexYourBrain module only"""
    user_id = current_user.id

    # Aptitude stats only
    aptitude_count_result = await db.execute(
        select(func.count(AptitudeTest.id)).where(AptitudeTest.user_id == user_id)
    )
    aptitude_count = aptitude_count_result.scalar() or 0

    # Get average score
    progress_result = await db.execute(
        select(AptitudeProgress).where(AptitudeProgress.user_id == user_id)
    )
    aptitude_progress = progress_result.scalars().all()
    
    avg_score = (
        sum([p.avg_score_percentage for p in aptitude_progress]) / len(aptitude_progress)
        if aptitude_progress else 0
    )

    return {
        "testsCompleted": aptitude_count,
        "overallScore": round(avg_score, 1),
        "message": "FlexYourBrain module only"
    }


@app.get("/api/dashboard/master-stats")
async def get_master_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed stats for FlexYourBrain module only"""
    user_id = current_user.id

    # Aptitude stats only
    progress_result = await db.execute(
        select(AptitudeProgress).where(AptitudeProgress.user_id == user_id)
    )
    aptitude_progress = progress_result.scalars().all()

    test_result = await db.execute(
        select(AptitudeTest).where(AptitudeTest.user_id == user_id)
    )
    tests = test_result.scalars().all()

    avg_score = (
        sum([p.avg_score_percentage for p in aptitude_progress]) / len(aptitude_progress)
        if aptitude_progress else 0
    )
    
    test_count = len(tests)
    
    # Calculate category breakdown
    categories = {}
    for progress in aptitude_progress:
        categories[progress.category] = {
            "avg_score": progress.avg_score_percentage,
            "tests_taken": progress.total_tests,
            "accuracy": {
                "easy": progress.easy_accuracy,
                "medium": progress.medium_accuracy,
                "hard": progress.hard_accuracy
            }
        }

    return {
        "testsCompleted": test_count,
        "overallScore": round(avg_score, 1),
        "categoryBreakdown": categories,
        "totalCategories": len(aptitude_progress)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, 
        host="127.0.0.1", 
        port=8000,
        reload=DEBUG  # Auto-reload only in development
    )