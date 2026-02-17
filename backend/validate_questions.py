# backend/validate_questions.py
import asyncio
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from backend.db_models import AptitudeQuestion
import os
from dotenv import load_dotenv

load_dotenv()

async def validate_questions():
    """Validate all questions in database"""
    DATABASE_URL = os.getenv("DATABASE_URL")
    engine = create_async_engine(DATABASE_URL, echo=True)
    AsyncSessionLocal = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(AptitudeQuestion))
        questions = result.scalars().all()
        
        print(f"🔍 Validating {len(questions)} questions...")
        
        invalid_questions = []
        for q in questions:
            issues = []
            
            # Check correct_answer format
            if q.correct_answer not in ['A', 'B', 'C', 'D']:
                issues.append(f"Invalid correct_answer: {q.correct_answer}")
            
            # Check options count
            if not q.options or len(q.options) != 4:
                issues.append(f"Invalid options count: {len(q.options) if q.options else 0}")
            
            if issues:
                invalid_questions.append({
                    'id': q.id,
                    'question': q.question_text[:50] + '...',
                    'correct_answer': q.correct_answer,
                    'issues': issues
                })
        
        if invalid_questions:
            print("❌ INVALID QUESTIONS FOUND:")
            for inv in invalid_questions:
                print(f"   ID: {inv['id']}")
                print(f"   Question: {inv['question']}")
                print(f"   Correct Answer: {inv['correct_answer']}")
                print(f"   Issues: {', '.join(inv['issues'])}")
                print()
        else:
            print("✅ All questions are valid!")
        
        return invalid_questions

if __name__ == "__main__":
    asyncio.run(validate_questions())