# backend/main.py - COMPLETE FIXED VERSION
import sys
import os
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
from urllib import request

from fastapi import BackgroundTasks, FastAPI, HTTPException, Depends, Request, UploadFile, File
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import jwt
import pytz
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
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
    ALGORITHM, SECRET_KEY, hash_password, verify_password, create_access_token,
    create_refresh_token, blacklist_token, is_token_blacklisted,
    REFRESH_TOKEN_EXPIRE_DAYS, ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_user, get_optional_user, get_db_dependency as auth_get_db_dependency
)
from backend.utils.email_utils import send_reset_email
from backend.routes.aptitude import router as aptitude_router

# =================== ENVIRONMENT SETUP ===================
load_dotenv()

# Environment detection
ENV = os.getenv("ENV", "development")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

# Force disable debug in production
if ENV == "production" and DEBUG:
    print("⚠️ WARNING: Debug mode enabled in production! Forcing disable...")
    DEBUG = False

# Database URL (REQUIRED)
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("❌ DATABASE_URL environment variable is required")

# =================== EMAIL CONFIG ===================
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

# Frontend URL configuration
if ENV == "development":
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
else:
    FRONTEND_URL = os.getenv("FRONTEND_URL")
    if not FRONTEND_URL:
        raise RuntimeError("❌ FRONTEND_URL must be set in production")

# CORS allowed origins
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", FRONTEND_URL).split(",")

# Security: Add production domains
if ENV != "development":
    ALLOWED_ORIGINS = [origin for origin in ALLOWED_ORIGINS if "localhost" not in origin]

print(f"🌍 Environment: {ENV}")
print(f"🔗 Frontend URL: {FRONTEND_URL}")
print(f"✅ Allowed Origins: {ALLOWED_ORIGINS}")

# =================== RATE LIMITING SETUP ===================
limiter = Limiter(key_func=get_remote_address)

# =================== FASTAPI APP ===================
app = FastAPI(
    title="SkillBridge API - FlexYourBrain Module",
    version="1.0.0",
    description="AI-powered aptitude testing platform",
    docs_url="/docs" if DEBUG else None,  # Disable docs in production
    redoc_url="/redoc" if DEBUG else None,
)

# Add rate limiting exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# =================== SECURITY HEADERS MIDDLEWARE ===================
@app.middleware("http")
async def add_security_headers(request, call_next):
    """Add security headers to all responses"""
    response = await call_next(request)
    
    # Clickjacking protection
    response.headers["X-Frame-Options"] = "DENY"
    
    # MIME sniffing protection
    response.headers["X-Content-Type-Options"] = "nosniff"
    
    # HSTS - Force HTTPS
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    
    # Additional security headers
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    
    # Remove server fingerprinting
    if "server" in response.headers:
        del response.headers["server"]
    if "x-powered-by" in response.headers:
        del response.headers["x-powered-by"]
    
    return response

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# =================== ERROR HANDLING ===================
@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request, exc):
    """Custom HTTP exception handler - hides internal details"""
    if ENV == "production":
        # Return generic message for all errors in production
        if exc.status_code >= 400:
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": "An error occurred"}
            )
    
    # In development, show detailed errors
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    """Handle validation errors - hide internal structure in production"""
    if ENV == "production":
        return JSONResponse(
            status_code=422,
            content={"detail": "Invalid request data"}
        )
    # In development, show detailed errors
    return JSONResponse(
        status_code=422,
        content={"detail": str(exc)}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Catch-all exception handler"""
    if ENV == "production":
        # Log the actual error (for debugging)
        print(f"🔴 Internal error: {str(exc)}")
        print(f"📍 Path: {request.url.path}")
        print(f"📝 Method: {request.method}")
        
        # Return generic message to client
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal server error occurred"}
        )
    # In development, show actual error
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": type(exc).__name__}
    )

# =================== DATABASE SETUP ===================
def initialize_auth_dependency():
    """Initialize the auth module's database dependency"""
    auth_get_db_dependency.set_dependency(get_db)
    print("✅ Auth database dependency initialized")

initialize_auth_dependency()


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
    
    # Initialize auth components
    from backend.auth import init_auth
    await init_auth()
    
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


# =================== AUTH ROUTES ===================

@app.post("/auth/signup", response_model=dict)
@limiter.limit("3/minute")
async def signup(
    request: Request,
    user_data: UserCreate, 
    db: AsyncSession = Depends(get_db)
):
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

    # Create tokens
    access_token = create_access_token({"user_id": new_user.id, "email": new_user.email})
    refresh_token = create_refresh_token({"user_id": new_user.id, "email": new_user.email})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": UserResponse.model_validate(new_user)
    }


@app.post("/auth/login", response_model=dict)
@limiter.limit("5/minute")
async def login(
    request: Request,
    credentials: UserLogin, 
    db: AsyncSession = Depends(get_db)
):
    """Login user - returns access and refresh tokens"""
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Create tokens
    access_token = create_access_token({"user_id": user.id, "email": user.email})
    refresh_token = create_refresh_token({"user_id": user.id, "email": user.email})
    
    print(f"✅ User logged in: {user.email}")
    print(f"🔑 Access token expires in: {ACCESS_TOKEN_EXPIRE_MINUTES} minutes")
    print(f"🔄 Refresh token expires in: {REFRESH_TOKEN_EXPIRE_DAYS} days")
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": UserResponse.model_validate(user)
    }


@app.get("/auth/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user)
):
    """Get current user info"""
    return UserResponse.model_validate(current_user)


@app.post("/auth/refresh")
@limiter.limit("10/minute")
async def refresh_token(
    request: Request,
    refresh_token: str,
    db: AsyncSession = Depends(get_db)
):
    """Get new access token using refresh token"""
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=400, detail="Invalid token type")
        
        if await is_token_blacklisted(refresh_token):
            raise HTTPException(status_code=401, detail="Refresh token has been revoked")
        
        user_id = payload.get("user_id")
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        new_access_token = create_access_token({"user_id": user.id, "email": user.email})
        new_refresh_token = create_refresh_token({"user_id": user.id, "email": user.email})
        
        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@app.post("/auth/logout")
@limiter.limit("10/minute")
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    authorization: Optional[str] = None
):
    """Logout user - blacklist current access token"""
    # Get token from Authorization header
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=400, detail="No token provided")
    
    token = auth_header.replace("Bearer ", "")
    
    try:
        await blacklist_token(token)
        print(f"🚪 User logged out: {current_user.email}")
        print(f"🔴 Token blacklisted: {token[:20]}...")
        return {"message": "Successfully logged out", "status": "token_blacklisted"}
    except Exception as e:
        print(f"❌ Logout error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Logout failed: {str(e)}")


@app.post("/auth/logout-all")
@limiter.limit("5/minute")
async def logout_all(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Logout from all devices"""
    return {
        "message": "To logout from all devices, change your password or contact support",
        "note": "Full implementation requires Redis to track all user tokens"
    }


@app.get("/auth/verify-token")
async def verify_token(
    current_user: User = Depends(get_current_user)
):
    """Verify if current token is valid"""
    return {
        "valid": True,
        "user_id": current_user.id,
        "email": current_user.email,
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


# =================== PASSWORD RESET ROUTES ===================

@app.post("/auth/forgot-password")
@limiter.limit("3/hour")
async def forgot_password(
    request: Request,
    forgot_data: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Request password reset"""
    result = await db.execute(select(User).where(User.email == forgot_data.email))
    user = result.scalar_one_or_none()

    if not user:
        print(f"Password reset requested for non-existent email: {forgot_data.email}")
        return {
            "message": "If an account exists with this email, you'll receive a password reset link shortly."
        }

    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1)

    await db.execute(
        select(PasswordResetToken).where(PasswordResetToken.user_id == user.id)
    )
    
    token_entry = PasswordResetToken(
        user_id=user.id,
        token=reset_token,
        expires_at=expires_at
    )
    db.add(token_entry)
    await db.commit()
    await db.refresh(token_entry)

    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"

    if DEBUG:
        print("\n" + "=" * 80)
        print("🔐 PASSWORD RESET REQUEST (DEBUG MODE)")
        print("=" * 80)
        print(f"📧 Email: {user.email}")
        print(f"🔗 Reset Link: {reset_link}")
        print(f"🎟️  Token: {reset_token}")
        print(f"⏰ Expires: {expires_at.strftime('%Y-%m-%d %H:%M:%S UTC')}")
        print("=" * 80 + "\n")
        
        try:
            background_tasks.add_task(send_reset_email, user.email, reset_link)
            print("✅ Email sending task added in background")
        except Exception as e:
            print(f"⚠️ Could not send email in debug mode: {e}")
    else:
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

    if datetime.utcnow() > token_entry.expires_at:
        await db.delete(token_entry)
        await db.commit()
        raise HTTPException(
            status_code=400,
            detail="Reset token has expired. Please request a new one."
        )

    result = await db.execute(
        select(User).where(User.id == token_entry.user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.password_hash = hash_password(request.new_password)
    user.updated_at = datetime.utcnow()

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

    if datetime.utcnow() > token_entry.expires_at:
        await db.delete(token_entry)
        await db.commit()
        raise HTTPException(
            status_code=400,
            detail="Token has expired. Please request a new reset link."
        )

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


# =================== API ROUTES ===================
app.include_router(
    aptitude_router, 
    prefix="/api/aptitude", 
    tags=["aptitude"]
)


# =================== DASHBOARD ROUTES ===================

@app.get("/api/dashboard/stats")
@limiter.limit("60/minute")
async def get_dashboard_stats(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get stats for FlexYourBrain module only"""
    user_id = current_user.id

    aptitude_count_result = await db.execute(
        select(func.count(AptitudeTest.id)).where(AptitudeTest.user_id == user_id)
    )
    aptitude_count = aptitude_count_result.scalar() or 0

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
@limiter.limit("60/minute")
async def get_master_stats(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed stats for FlexYourBrain module only"""
    user_id = current_user.id

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
        "main:app",
        host="127.0.0.1", 
        port=8000,
        reload=DEBUG
    )