# backend/auth.py - COMPLETE FIXED VERSION

import os
import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from dotenv import load_dotenv
from typing import Optional, Set
import redis.asyncio as redis
from backend.db_models import User

load_dotenv()

# =================== JWT CONFIGURATION ===================
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 15))  # 15 minutes
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))  # 7 days

# =================== TOKEN BLACKLIST ===================
# For local testing: Use in-memory set
# For production: Use Redis
class TokenBlacklist:
    def __init__(self):
        self._blacklist: Set[str] = set()
        self._use_redis = False
        self._redis_client = None
    
    async def initialize(self):
        """Try to connect to Redis if available"""
        try:
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
            self._redis_client = redis.from_url(redis_url)
            await self._redis_client.ping()
            self._use_redis = True
            print("✅ Using Redis for token blacklist")
        except:
            print("⚠️ Redis not available, using in-memory blacklist")
            self._use_redis = False
    
    async def add(self, token: str, expiry: int = 900):  # 900 seconds = 15 minutes default
        """Add token to blacklist"""
        if self._use_redis:
            await self._redis_client.setex(f"blacklist:{token}", expiry, "1")
        else:
            self._blacklist.add(token)
    
    async def contains(self, token: str) -> bool:
        """Check if token is blacklisted"""
        if self._use_redis:
            result = bool(await self._redis_client.exists(f"blacklist:{token}"))
            print(f"🔍 Redis blacklist check for {token[:20]}...: {result}")
            return result
        
        result = token in self._blacklist
        print(f"🔍 In-memory blacklist check for {token[:20]}...: {result}")
        print(f"📋 Current blacklist: {[t[:20] + '...' for t in self._blacklist]}")
        return result
    
    async def remove_expired(self):
        """Clean up expired tokens (for in-memory only)"""
        if not self._use_redis:
            # In production with Redis, this is automatic
            self._blacklist.clear()

# Create global token blacklist instance
token_blacklist = TokenBlacklist()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Create a JWT access token (short-lived)"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"  # Add token type
    })
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create a refresh token with longer expiry"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"  # Mark as refresh token
    })
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def blacklist_token(token: str):
    """Add token to blacklist"""
    print(f"🔵 Attempting to blacklist token: {token[:20]}...")
    
    # Decode token to get expiry for Redis TTL
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": False})
        exp = payload.get("exp")
        token_type = payload.get("type")
        print(f"📝 Token type: {token_type}, Expiry: {exp}")
        
        if exp:
            # Calculate seconds until expiry
            exp_seconds = max(0, (datetime.fromtimestamp(exp) - datetime.utcnow()).total_seconds())
            print(f"⏰ Token expires in: {exp_seconds} seconds")
            await token_blacklist.add(token, int(exp_seconds))
        else:
            # If can't get expiry, blacklist for default time
            await token_blacklist.add(token, 900)  # 15 minutes default
            print(f"⚠️ No expiry found, using default 15 minutes")
            
    except Exception as e:
        print(f"❌ Error decoding token for blacklist: {str(e)}")
        # If can't decode, blacklist for default time
        await token_blacklist.add(token, 900)  # 15 minutes default


async def is_token_blacklisted(token: str) -> bool:
    """Check if token is blacklisted"""
    return await token_blacklist.contains(token)


# =================== DATABASE DEPENDENCY ===================
class GetDBDependency:
    """Callable class for database dependency injection"""
    def __init__(self):
        self.dependency = None
    
    def set_dependency(self, dep):
        """Set the actual get_db dependency from main.py"""
        self.dependency = dep
    
    async def __call__(self):
        """Get database session"""
        if self.dependency is None:
            raise RuntimeError("Database dependency not initialized. Call initialize_auth_dependency() in main.py")
        
        async for session in self.dependency():
            yield session


# Create a singleton instance
get_db_dependency = GetDBDependency()


# =================== USER AUTHENTICATION ===================
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db_dependency)
):
    """Get the current authenticated user with blacklist check"""
    token = credentials.credentials

    # Check if token is blacklisted
    if await is_token_blacklisted(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No token provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Decode token safely
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Verify it's an access token (not refresh)
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fetch user from DB
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    db: AsyncSession = Depends(get_db_dependency)
) -> Optional[User]:
    """Get the current user or None if not authenticated"""
    if not credentials:
        return None
        
    try:
        token = credentials.credentials
        
        # Skip blacklist check for optional auth
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        user_id = payload.get("user_id")
        if user_id is None:
            return None
        
        # Get user from database
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        return user
    except Exception:
        return None


# Initialize blacklist on startup
async def init_auth():
    """Initialize auth components"""
    await token_blacklist.initialize()