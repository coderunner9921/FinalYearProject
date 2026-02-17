# backend/init_db.py - UPDATED for FlexYourBrain only

"""
Database Initialization Script - FlexYourBrain Only
Creates tables for FlexYourBrain module and core auth tables
"""

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from dotenv import load_dotenv
import os

# Import ONLY the models we need
from db_models import (
    Base, User, PasswordResetToken,
    AptitudeQuestion, AptitudeTest, AptitudeAttempt, AptitudeProgress, SJTScenario
)

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not found in .env")

print(f"🔗 Connecting to database...")

engine = create_async_engine(DATABASE_URL, echo=True, future=True)

async def init():
    try:
        # Check if this is a fresh installation
        from sqlalchemy import text
        async with engine.connect() as conn:
            result = await conn.execute(text("""
                SELECT COUNT(*) 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """))
            table_count = result.scalar()
        
        if table_count > 0:
            print(f"\n⚠️  WARNING: Database already has {table_count} tables!")
            print("\n   Since you're removing modules 1 & 3, you have two options:")
            print()
            print("   OPTION A: Start fresh with only FlexYourBrain tables (RECOMMENDED)")
            print("      - Type 'DELETE EVERYTHING' to drop all tables and recreate")
            print()
            print("   OPTION B: Keep existing tables (not recommended)")
            print("      - The tables for modules 1 & 3 will remain but won't be used")
            print("      - Press Ctrl+C to cancel")
            
            confirmation = input("\n   Type 'DELETE EVERYTHING' to confirm: ")
            
            if confirmation != "DELETE EVERYTHING":
                print("\n❌ Initialization cancelled")
                return
        
        async with engine.begin() as conn:
            print("\n🔨 Creating database tables...")
            
            # For fresh installs or when confirmed, drop all and recreate
            if table_count > 0:
                print("   ⚠️  Dropping all existing tables...")
                await conn.run_sync(Base.metadata.drop_all)
            
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
        
        print("\n✅ Database tables created successfully!")
        print()
        print("📋 CORE TABLES:")
        print("   ✓ users - User accounts and authentication")
        print("   ✓ password_reset_tokens - Password reset flow")
        print()
        print("📋 FLEXYOURBRAIN MODULE:")
        print("   ✓ aptitude_questions - Question bank")
        print("   ✓ aptitude_tests - Test sessions")
        print("   ✓ aptitude_attempts - Individual answers")
        print("   ✓ aptitude_progress - Progress tracking by category")
        print("   ✓ sjt_scenarios - Situational judgement tests")
        print()
        print("📊 Total Tables: 7")
        print()
        print("🚀 Next steps:")
        print("   1. Run: python -m uvicorn main:app --reload")
        print("   2. Test the FlexYourBrain module")
        
    except Exception as e:
        print(f"\n❌ Error creating database tables: {str(e)}")
        raise
    
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init())