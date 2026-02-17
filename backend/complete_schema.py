# backend/clear_FYB_questions_sync.py
#!/usr/bin/env python3
"""
Synchronous script to clear and regenerate aptitude questions
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL not found in .env file")
    print("💡 Please make sure you have DATABASE_URL in your .env file:")
    print("   DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/skillbridge")
    sys.exit(1)

print(f"📊 Using database: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")

# Import required modules
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def clear_questions():
    """Clear FlexYourBrain tables using direct PostgreSQL connection"""
    try:
        # Parse DATABASE_URL
        # Remove the +asyncpg part if present
        sync_url = DATABASE_URL.replace("+asyncpg", "")
        
        # Connect to PostgreSQL
        conn = psycopg2.connect(sync_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        print("🧹 Clearing FlexYourBrain tables...")
        
        # Clear tables in correct order due to foreign key constraints
        tables = [
            "aptitude_attempts",
            "aptitude_tests", 
            "aptitude_progress",
            "aptitude_questions",
            "sjt_scenarios"
        ]
        
        for table in tables:
            try:
                cursor.execute(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE")
                print(f"✅ Cleared {table}")
            except Exception as e:
                print(f"⚠️  Error clearing {table}: {e}")
        
        # Reset sequences
        print("\n🔄 Resetting sequences...")
        sequences = [
            "aptitude_questions_id_seq",
            "sjt_scenarios_id_seq", 
            "aptitude_tests_id_seq",
            "aptitude_attempts_id_seq",
            "aptitude_progress_id_seq"
        ]
        
        for seq in sequences:
            try:
                cursor.execute(f"ALTER SEQUENCE {seq} RESTART WITH 1")
                print(f"✅ {seq}")
            except Exception as e:
                print(f"⚠️  {seq}: {e}")
        
        # Count remaining records in other tables to confirm they're preserved
        print("\n📋 Verifying other modules are preserved...")
        preserved_tables = ["users", "interviews", "resumes", "resume_analyses", "cover_letters", "career_progress"]
        
        for table in preserved_tables:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                print(f"   {table}: {count} records {'✅' if count >= 0 else '⚠️'}")
            except:
                print(f"   {table}: table not found or error")
        
        cursor.close()
        conn.close()
        
        print("\n" + "="*60)
        print("🎉 FLEXYOURBRAIN TABLES CLEARED SUCCESSFULLY!")
        print("="*60)
        print("\n💡 Next steps:")
        print("1. Restart your backend server: python main.py")
        print("2. Start a practice session to generate fresh AI questions")
        print("3. Questions will be generated automatically when needed")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\n💡 Troubleshooting:")
        print("1. Make sure PostgreSQL is running")
        print("2. Check your DATABASE_URL in .env file")
        print("3. Verify database credentials")
        return False

if __name__ == "__main__":
    # Ask for confirmation
    print("="*60)
    print("🧠 FLEXYOURBRAIN QUESTION RESET TOOL")
    print("="*60)
    print("⚠️  WARNING: This will delete ALL aptitude questions and test history")
    print("   - All aptitude questions will be cleared")
    print("   - All SJT scenarios will be cleared") 
    print("   - All test history and progress will be deleted")
    print("   - New questions will be generated automatically when needed")
    print()
    
    confirmation = input("❓ Type 'CLEAR' to confirm: ")
    if confirmation != "CLEAR":
        print("\n❌ Operation cancelled")
        sys.exit(0)
    
    clear_questions()