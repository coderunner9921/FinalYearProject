# backend/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("❌ DATABASE_URL environment variable is required")

# Convert to asyncpg format if needed
if DATABASE_URL.startswith("postgresql://") and "+asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    print("⚠️  Converted DATABASE_URL to use asyncpg")

DEBUG = os.getenv("DEBUG", "false").lower() == "true"

engine = create_async_engine(
    DATABASE_URL,
    echo=DEBUG,
    future=True,
    pool_pre_ping=True,
    pool_size=5,  # Reduced for free tier
    max_overflow=10,  # Reduced for free tier
    pool_recycle=3600,
)

AsyncSessionLocal = sessionmaker(
    engine,
    expire_on_commit=False,
    class_=AsyncSession
)

async def get_db():
    """Dependency to get database session"""
    async with AsyncSessionLocal() as session:
        yield session