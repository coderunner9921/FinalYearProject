# backend/routes/settings.py
"""
User Settings API Routes
Handles profile updates, preferences, password changes, etc.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from typing import Optional
from passlib.context import CryptContext
from datetime import date

from auth import get_current_user
from db_models import User

router = APIRouter(prefix="/settings", tags=["settings"])

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ==================== REQUEST MODELS ====================

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    target_role: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    date_of_birth: Optional[date] = None  
    hobbies: Optional[str] = None         
    skills: Optional[str] = None          

class EmailUpdateRequest(BaseModel):
    email: EmailStr

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class PreferencesRequest(BaseModel):
    theme: Optional[str] = None
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    in_app_notifications: Optional[bool] = None

# ==================== DEPENDENCY ====================

async def get_db():
    """Database dependency"""
    from database import get_db as main_get_db
    async for session in main_get_db():
        yield session

# ==================== ENDPOINTS ====================

@router.get("/profile")
async def get_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user's profile information"""
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "bio": current_user.bio,
        "target_role": current_user.target_role,
        "linkedin_url": current_user.linkedin_url,
        "github_url": current_user.github_url,
        "date_of_birth": current_user.date_of_birth.isoformat() if current_user.date_of_birth else None,  
        "hobbies": current_user.hobbies,      
        "skills": current_user.skills,       
        "avatar_url": current_user.avatar_url,
        "role": current_user.role,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None
    }

@router.put("/profile")
async def update_profile(
    profile_data: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user profile information"""
    
    # Get user from database to ensure it's attached to session
    result = await db.execute(
        select(User).where(User.id == current_user.id)
    )
    user = result.scalar_one()
    
    # Update only provided fields
    if profile_data.name is not None:
        user.name = profile_data.name
    
    if profile_data.bio is not None:
        user.bio = profile_data.bio
    
    if profile_data.target_role is not None:
        user.target_role = profile_data.target_role
    
    if profile_data.linkedin_url is not None:
        user.linkedin_url = profile_data.linkedin_url
    
    if profile_data.github_url is not None:
        user.github_url = profile_data.github_url
    
    if profile_data.date_of_birth is not None:
        user.date_of_birth = profile_data.date_of_birth
    
    if profile_data.hobbies is not None:
        user.hobbies = profile_data.hobbies
    
    if profile_data.skills is not None:
        user.skills = profile_data.skills
    
    await db.commit()
    await db.refresh(user)
    
    return {
        "message": "Profile updated successfully",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "bio": user.bio,
            "target_role": user.target_role,
            "linkedin_url": user.linkedin_url,
            "github_url": user.github_url,
            "date_of_birth": user.date_of_birth.isoformat() if user.date_of_birth else None,
            "hobbies": user.hobbies,
            "skills": user.skills
        }
    }

@router.put("/email")
async def update_email(
    email_data: EmailUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user email address"""
    
    # Check if email already exists
    result = await db.execute(
        select(User).where(User.email == email_data.email)
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user and existing_user.id != current_user.id:
        raise HTTPException(status_code=400, detail="Email already in use")
    
    current_user.email = email_data.email
    await db.commit()
    
    return {
        "message": "Email updated successfully",
        "email": current_user.email
    }

@router.post("/change-password")
async def change_password(
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Change user password"""
    
    from sqlalchemy import select
    result = await db.execute(
        select(User).where(User.id == current_user.id)
    )
    user = result.scalar_one()
    
    # Verify current password
    if not pwd_context.verify(password_data.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Validate new password strength 
    if len(password_data.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters long")
    
    # Hash and update password
    user.password_hash = pwd_context.hash(password_data.new_password)
    
    from sqlalchemy.orm import attributes
    attributes.flag_modified(user, "password_hash")
    
    await db.commit()
    await db.refresh(user)
    
    print(f"✅ Password changed for user {user.id}")
    
    return {"message": "Password changed successfully"}

@router.get("/preferences")
async def get_preferences(
    current_user: User = Depends(get_current_user)
):
    """Get user preferences (theme, notifications, etc.)"""
    
    # For now, return defaults since we don't have a preferences table yet
    # In production, you'd want to create a UserPreferences table
    return {
        "theme": "neon-cyber",  # Default theme
        "email_notifications": True,
        "push_notifications": True,
        "in_app_notifications": True
    }

@router.put("/preferences")
async def update_preferences(
    preferences: PreferencesRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user preferences"""
    
    # TODO: Store preferences in database
    # For now, just return success
    # In production, create UserPreferences table and store there
    
    return {
        "message": "Preferences updated successfully",
        "preferences": preferences.dict()
    }

@router.delete("/account")
async def delete_account(
    current_password: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete user account (requires password confirmation)"""
    
    from sqlalchemy import select
    result = await db.execute(
        select(User).where(User.id == current_user.id)
    )
    user = result.scalar_one()
    
    # Verify password before deletion
    if not pwd_context.verify(current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect password")
    
    # Delete user (CASCADE will handle related records)
    await db.delete(user)
    await db.commit()
    
    return {"message": "Account deleted successfully"}