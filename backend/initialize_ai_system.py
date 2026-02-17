# backend/initialize_ai_system.py
import asyncio
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, func
from db_models import AptitudeQuestion
from utils.question_manager import QuestionManager
from utils.ai_question_generator import AIQuestionGenerator
import os
from dotenv import load_dotenv

load_dotenv()

async def check_database_status(db: AsyncSession):
    """Check current database status"""
    result = await db.execute(select(func.count(AptitudeQuestion.id)))
    total_questions = result.scalar()
    
    result = await db.execute(select(AptitudeQuestion.category).distinct())
    domains = [row[0] for row in result.all()]
    
    print(f"📊 Current database status:")
    print(f"   Total questions: {total_questions}")
    print(f"   Existing domains: {domains}")
    
    return total_questions, domains

async def generate_ai_questions(db: AsyncSession):
    """Generate AI questions using the question manager"""
    manager = QuestionManager()
    
    domains = ["Logical", "Quantitative", "Verbal", "Coding"]
    difficulties = ["easy", "medium", "hard"]
    
    print(f"🤖 Generating AI questions for domains: {domains}")
    print(f"🎚️  Difficulties: {difficulties}")
    
    total_generated = await manager.refresh_question_bank(
        db=db,
        domains=domains,
        difficulties=difficulties,
        questions_per_combination=5 # 5 questions per combination
    )
    
    return total_generated

async def direct_ai_generation(db: AsyncSession):
    """Direct AI generation bypassing question manager (fallback)"""
    print("🔄 Direct AI generation (fallback method)...")
    generator = AIQuestionGenerator()
    
    domains = ["Logical", "Quantitative", "Verbal", "Coding"]
    difficulties = ["easy", "medium", "hard"]
    questions_per_combination = 2
    
    total_added = 0
    
    for domain in domains:
        for difficulty in difficulties:
            print(f"   Generating {questions_per_combination} {difficulty} questions for {domain}...")
            questions = generator.generate_questions(domain, questions_per_combination, difficulty)
            
            if questions:
                for q_data in questions:
                    # Check if question already exists
                    from sqlalchemy import select
                    result = await db.execute(
                        select(AptitudeQuestion).where(
                            AptitudeQuestion.question_text == q_data["question_text"]
                        )
                    )
                    existing = result.scalar_one_or_none()
                    
                    if not existing:
                        question = AptitudeQuestion(
                            category=q_data["category"],
                            subcategory=q_data.get("subcategory", "General"),
                            difficulty=q_data.get("difficulty", "medium"),
                            question_text=q_data["question_text"],
                            options=q_data["options"],
                            correct_answer=q_data["correct_answer"],
                            explanation=q_data.get("explanation", ""),
                            time_limit=q_data.get("time_limit", 60)
                        )
                        db.add(question)
                        total_added += 1
    
    await db.commit()
    return total_added

async def main():
    """Main initialization function"""
    print("=" * 60)
    print("🚀 AI QUESTION DATABASE INITIALIZATION")
    print("=" * 60)
    
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("❌ DATABASE_URL not found in .env file")
        return
    
    engine = create_async_engine(DATABASE_URL, echo=True)
    AsyncSessionLocal = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    
    async with AsyncSessionLocal() as db:
        try:
            # Step 1: Check current status
            print("\n📋 STEP 1: Checking database status...")
            total_before, domains_before = await check_database_status(db)
            
            if total_before > 0:
                response = input(f"\n⚠️  Database already has {total_before} questions. Regenerate? (y/N): ")
                if response.lower() not in ['y', 'yes']:
                    print("❌ Operation cancelled")
                    return
                
                # Clear existing questions
                from sqlalchemy import delete
                await db.execute(delete(AptitudeQuestion))
                await db.commit()
                print("✅ Cleared existing questions")
            
            # Step 2: Generate AI questions
            print("\n📋 STEP 2: Generating AI questions...")
            try:
                generated = await generate_ai_questions(db)
                print(f"✅ Generated {generated} questions via QuestionManager")
            except Exception as e:
                print(f"❌ QuestionManager failed: {e}")
                print("🔄 Trying direct AI generation...")
                generated = await direct_ai_generation(db)
                print(f"✅ Generated {generated} questions via direct AI")
            
            # Step 3: Verify results
            print("\n📋 STEP 3: Verifying results...")
            total_after, domains_after = await check_database_status(db)
            
            print("\n" + "=" * 60)
            print("🎉 INITIALIZATION COMPLETE!")
            print("=" * 60)
            print(f"📈 Questions before: {total_before}")
            print(f"📈 Questions after:  {total_after}")
            print(f"📈 Net added:       {total_after - total_before}")
            print(f"🌐 Domains created: {domains_after}")
            
            if total_after == 0:
                print("\n❌ WARNING: No questions were generated!")
                print("💡 Possible issues:")
                print("   - GROQ_API_KEY not set in .env")
                print("   - Internet connection issues")
                print("   - AI service temporarily unavailable")
            
        except Exception as e:
            print(f"❌ Initialization failed: {e}")
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(main())