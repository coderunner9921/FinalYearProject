"""
FLEXYOURBRAIN MODULE RESET SCRIPT
Clears and regenerates ONLY aptitude questions and SJT scenarios
Preserves: User data, interview data, career data, and all other modules
Owner: Member 2 (FlexYourBrain Module)
"""

import asyncio
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text, select, func, delete
from db_models import AptitudeQuestion, SJTScenario, AptitudeTest, AptitudeAttempt, AptitudeProgress
import os
from dotenv import load_dotenv
from utils.ai_question_generator import AIQuestionGenerator
from datetime import datetime, timezone

load_dotenv()

class FlexYourBrainReset:
    def __init__(self):
        self.DATABASE_URL = os.getenv("DATABASE_URL")
        if not self.DATABASE_URL:
            raise ValueError("❌ DATABASE_URL not found in .env")
        
        self.engine = create_async_engine(self.DATABASE_URL, echo=False)
        self.AsyncSessionLocal = sessionmaker(self.engine, expire_on_commit=False, class_=AsyncSession)
        self.ai_generator = AIQuestionGenerator()
        
    async def check_database_status(self):
        """Check current status of FlexYourBrain tables"""
        print("\n📊 DATABASE STATUS CHECK")
        print("=" * 50)
        
        async with self.AsyncSessionLocal() as db:
            # Check aptitude_questions
            result = await db.execute(select(func.count(AptitudeQuestion.id)))
            apt_questions = result.scalar()
            
            # Check sjt_scenarios
            result = await db.execute(select(func.count(SJTScenario.id)))
            sjt_scenarios = result.scalar()
            
            # Check aptitude_tests (will be cleared)
            result = await db.execute(select(func.count(AptitudeTest.id)))
            apt_tests = result.scalar()
            
            # Check aptitude_attempts (will be cleared)
            result = await db.execute(select(func.count(AptitudeAttempt.id)))
            apt_attempts = result.scalar()
            
            # Check aptitude_progress (will be cleared)
            result = await db.execute(select(func.count(AptitudeProgress.id)))
            apt_progress = result.scalar()
            
            print(f"🧠 FlexYourBrain Module:")
            print(f"   aptitude_questions: {apt_questions:,} questions")
            print(f"   sjt_scenarios: {sjt_scenarios:,} scenarios")
            print(f"   aptitude_tests: {apt_tests:,} test sessions")
            print(f"   aptitude_attempts: {apt_attempts:,} question attempts")
            print(f"   aptitude_progress: {apt_progress:,} progress records")
            
            # Check other modules (should be preserved)
            print(f"\n📋 Other Modules (will be preserved):")
            result = await db.execute(text("SELECT COUNT(*) FROM users"))
            users = result.scalar()
            print(f"   users: {users:,} accounts")
            
            result = await db.execute(text("SELECT COUNT(*) FROM interviews"))
            interviews = result.scalar()
            print(f"   interviews: {interviews:,} sessions")
            
            result = await db.execute(text("SELECT COUNT(*) FROM resumes"))
            resumes = result.scalar()
            print(f"   resumes: {resumes:,} files")
            
            return {
                "apt_questions": apt_questions,
                "sjt_scenarios": sjt_scenarios,
                "apt_tests": apt_tests,
                "apt_attempts": apt_attempts,
                "apt_progress": apt_progress
            }
    
    async def clear_flexyourbrain_data(self):
        """Clear ONLY FlexYourBrain module data"""
        print("\n🗑️  CLEARING FLEXYOURBRAIN DATA")
        print("=" * 50)
        
        async with self.AsyncSessionLocal() as db:
            try:
                # IMPORTANT: Delete in correct order due to foreign key constraints
                tables_to_clear = [
                    ("aptitude_attempts", "Individual question attempts"),
                    ("aptitude_tests", "Test sessions"),
                    ("aptitude_progress", "User progress tracking"),
                    ("aptitude_questions", "Question bank"),
                    ("sjt_scenarios", "SJT scenarios")
                ]
                
                total_deleted = 0
                for table_name, description in tables_to_clear:
                    if table_name == "aptitude_questions":
                        result = await db.execute(delete(AptitudeQuestion))
                    elif table_name == "sjt_scenarios":
                        result = await db.execute(delete(SJTScenario))
                    elif table_name == "aptitude_tests":
                        result = await db.execute(delete(AptitudeTest))
                    elif table_name == "aptitude_attempts":
                        result = await db.execute(delete(AptitudeAttempt))
                    elif table_name == "aptitude_progress":
                        result = await db.execute(delete(AptitudeProgress))
                    
                    deleted = result.rowcount
                    total_deleted += deleted
                    print(f"   ✅ {table_name}: {deleted:,} records deleted")
                
                await db.commit()
                print(f"\n🎯 Total cleared: {total_deleted:,} FlexYourBrain records")
                return True
                
            except Exception as e:
                await db.rollback()
                print(f"❌ Error clearing data: {e}")
                return False
    
    async def generate_ai_aptitude_questions(self):
        """Generate new aptitude questions using AI"""
        print("\n🤖 GENERATING AI APTITUDE QUESTIONS")
        print("=" * 50)
        
        # ONLY THESE 4 CATEGORIES
        domains = ["Logical Reasoning", "Quantitative Aptitude", "Verbal Ability", "Coding Challenge"]
        difficulties = ["easy", "medium", "hard"]
        questions_per_combination = 5  # 5 questions per domain/difficulty combo
        
        total_generated = 0
        
        async with self.AsyncSessionLocal() as db:
            try:
                for domain in domains:
                    print(f"\n🌐 Domain: {domain}")
                    
                    for difficulty in difficulties:
                        print(f"   Generating {questions_per_combination} {difficulty} questions...")
                        
                        # Generate questions via AI
                        ai_questions = self.ai_generator.generate_questions(
                            domain=domain,
                            count=questions_per_combination,
                            difficulty=difficulty
                        )
                        
                        if not ai_questions:
                            print(f"   ⚠️  No questions generated for {domain}/{difficulty}")
                            continue
                        
                        # Save to database
                        for q_data in ai_questions:
                            # Validate question before saving
                            if not self._validate_question(q_data):
                                print(f"   ⚠️  Skipping invalid question")
                                continue
                            
                            question = AptitudeQuestion(
                                category=q_data["category"],
                                subcategory=q_data.get("subcategory", "General"),
                                difficulty=q_data.get("difficulty", "medium"),
                                question_text=q_data["question_text"],
                                options=q_data["options"],
                                correct_answer=q_data["correct_answer"],
                                explanation=q_data.get("explanation", ""),
                                time_limit=q_data.get("time_limit", 60),
                                created_at=datetime.now(timezone.utc)
                            )
                            db.add(question)
                            total_generated += 1
                        
                        print(f"   ✅ Added {len(ai_questions)} questions")
                    
                    await db.commit()
                
                print(f"\n🎉 Total aptitude questions generated: {total_generated:,}")
                return total_generated
                
            except Exception as e:
                await db.rollback()
                print(f"❌ Error generating questions: {e}")
                import traceback
                traceback.print_exc()
                return 0
    
    async def generate_sjt_scenarios(self):
        """Generate Situational Judgement Test scenarios"""
        print("\n🧠 GENERATING SITUATIONAL JUDGEMENT TESTS")
        print("=" * 50)
        
        sjt_categories = ["Teamwork", "Leadership", "Problem Solving", "Communication", "Ethics"]
        scenarios_per_category = 3
        
        total_generated = 0
        
        async with self.AsyncSessionLocal() as db:
            try:
                for category in sjt_categories:
                    print(f"\n📋 Category: {category}")
                    
                    # Generate scenarios for this category
                    scenarios = self._generate_sjt_data(category, scenarios_per_category)
                    
                    for scenario_data in scenarios:
                        scenario = SJTScenario(
                            scenario_text=scenario_data["scenario_text"],
                            options=scenario_data["options"],
                            most_effective=scenario_data["most_effective"],
                            least_effective=scenario_data["least_effective"],
                            explanation=scenario_data["explanation"],
                            category=category,
                            created_at=datetime.now(timezone.utc)
                        )
                        db.add(scenario)
                        total_generated += 1
                    
                    print(f"   ✅ Added {len(scenarios)} scenarios")
                
                await db.commit()
                print(f"\n🎉 Total SJT scenarios generated: {total_generated:,}")
                return total_generated
                
            except Exception as e:
                await db.rollback()
                print(f"❌ Error generating SJT scenarios: {e}")
                return 0
    
    def _validate_question(self, question_data: dict) -> bool:
        """Validate question data before saving"""
        required_fields = ["question_text", "options", "correct_answer", "category"]
        
        # Check required fields
        for field in required_fields:
            if field not in question_data:
                print(f"   ⚠️  Missing field: {field}")
                return False
        
        # Validate correct_answer format
        correct_answer = str(question_data["correct_answer"]).upper().strip()
        if correct_answer not in ["A", "B", "C", "D"]:
            print(f"   ⚠️  Invalid correct_answer: {correct_answer}")
            return False
        
        # Validate options
        options = question_data["options"]
        if not isinstance(options, list) or len(options) != 4:
            print(f"   ⚠️  Invalid options: {options}")
            return False
        
        return True

    async def generate_sjt_scenarios(self):
        """Generate Situational Judgement Test scenarios using AI"""
        print("\n🧠 GENERATING SITUATIONAL JUDGEMENT TESTS")
        print("=" * 50)
        
        sjt_categories = ["Teamwork", "Leadership", "Problem Solving", "Communication", "Ethics"]
        scenarios_per_category = 3
        
        total_generated = 0
        
        async with self.AsyncSessionLocal() as db:
            try:
                for category in sjt_categories:
                    print(f"\n📋 Category: {category}")
                    
                    # Generate scenarios using AI
                    ai_scenarios = self.ai_generator.generate_sjt_scenarios(
                        category=category,
                        count=scenarios_per_category
                    )
                    
                    if not ai_scenarios:
                        print(f"   ⚠️  No AI scenarios generated for {category}, using fallback")
                        # Use fallback scenarios
                        ai_scenarios = self._get_fallback_sjt_scenarios(category, scenarios_per_category)
                    
                    for scenario_data in ai_scenarios:
                        # Validate scenario before saving
                        if not self._validate_sjt_scenario(scenario_data):
                            print(f"   ⚠️  Skipping invalid SJT scenario")
                            continue
                        
                        scenario = SJTScenario(
                            scenario_text=scenario_data["scenario_text"],
                            options=scenario_data["options"],
                            most_effective=scenario_data["most_effective"],
                            least_effective=scenario_data["least_effective"],
                            explanation=scenario_data.get("explanation", ""),
                            category=category,
                            created_at=datetime.now()  # Use datetime.now() instead of utcnow()
                        )
                        db.add(scenario)
                        total_generated += 1
                        print(f"   ✅ Added scenario: {scenario_data['scenario_text'][:50]}...")
                    
                    await db.commit()
                
                print(f"\n🎉 Total SJT scenarios generated: {total_generated:,}")
                return total_generated
                
            except Exception as e:
                await db.rollback()
                print(f"❌ Error generating SJT scenarios: {e}")
                import traceback
                traceback.print_exc()
                return 0

    def _validate_sjt_scenario(self, scenario_data: dict) -> bool:
        """Validate SJT scenario data before saving"""
        required_fields = ["scenario_text", "options", "most_effective", "least_effective", "category"]
        
        # Check required fields
        for field in required_fields:
            if field not in scenario_data:
                print(f"   ⚠️  Missing field: {field}")
                return False
        
        # Validate answer formats
        most_effective = str(scenario_data["most_effective"]).upper().strip()
        least_effective = str(scenario_data["least_effective"]).upper().strip()
        
        if most_effective not in ["A", "B", "C", "D"]:
            print(f"   ⚠️  Invalid most_effective: {most_effective}")
            return False
        
        if least_effective not in ["A", "B", "C", "D"]:
            print(f"   ⚠️  Invalid least_effective: {least_effective}")
            return False
        
        # Ensure they're different
        if most_effective == least_effective:
            print(f"   ⚠️  most_effective and least_effective are the same: {most_effective}")
            return False
        
        # Validate options
        options = scenario_data["options"]
        if not isinstance(options, list) or len(options) != 4:
            print(f"   ⚠️  Invalid options: {options}")
            return False
        
        return True

    def _get_fallback_sjt_scenarios(self, category: str, count: int) -> list:
        """Get fallback SJT scenarios if AI fails"""
        fallback_scenarios = {
            "Teamwork": [
                {
                    "scenario_text": "Your team is working on a tight deadline. A team member consistently misses deadlines, affecting the entire project. What would you do?",
                    "options": [
                        "Option A: Report them to management immediately without discussion",
                        "Option B: Have a private conversation to understand their challenges",
                        "Option C: Take over their work to ensure the deadline is met",
                        "Option D: Ignore it and hope they improve on their own"
                    ],
                    "most_effective": "B",
                    "least_effective": "D",
                    "explanation": "A private conversation shows empathy while addressing the issue, while ignoring it is least effective.",
                    "category": "Teamwork"
                }
            ],
            # ... other categories as before
        }
        
        # Get scenarios for the category
        scenarios = fallback_scenarios.get(category, [])
        
        # Repeat if needed to reach count
        while len(scenarios) < count and scenarios:
            scenarios.append(scenarios[0])
        
        return scenarios[:count]
    
    async def reset_sequences(self):
        """Reset PostgreSQL sequences for FlexYourBrain tables"""
        print("\n🔄 RESETTING DATABASE SEQUENCES")
        print("=" * 50)
        
        sequences = [
            "aptitude_questions_id_seq",
            "sjt_scenarios_id_seq",
            "aptitude_tests_id_seq",
            "aptitude_attempts_id_seq",
            "aptitude_progress_id_seq"
        ]
        
        async with self.AsyncSessionLocal() as db:
            for sequence in sequences:
                try:
                    await db.execute(text(f"ALTER SEQUENCE {sequence} RESTART WITH 1"))
                    print(f"   ✅ {sequence}")
                except Exception as e:
                    print(f"   ⚠️  {sequence}: {e}")
            
            await db.commit()
        print("✅ Sequences reset")
    
    async def verify_reset(self):
        """Verify the reset was successful"""
        print("\n🔍 VERIFICATION")
        print("=" * 50)
        
        async with self.AsyncSessionLocal() as db:
            # Check FlexYourBrain tables
            result = await db.execute(select(func.count(AptitudeQuestion.id)))
            apt_questions = result.scalar()
            
            result = await db.execute(select(func.count(SJTScenario.id)))
            sjt_scenarios = result.scalar()
            
            result = await db.execute(select(func.count(AptitudeTest.id)))
            apt_tests = result.scalar()
            
            result = await db.execute(select(func.count(AptitudeAttempt.id)))
            apt_attempts = result.scalar()
            
            result = await db.execute(select(func.count(AptitudeProgress.id)))
            apt_progress = result.scalar()
            
            print(f"🧠 FlexYourBrain Status:")
            print(f"   aptitude_questions: {apt_questions:,} questions {'✅' if apt_questions > 0 else '❌'}")
            print(f"   sjt_scenarios: {sjt_scenarios:,} scenarios {'✅' if sjt_scenarios > 0 else '❌'}")
            print(f"   aptitude_tests: {apt_tests:,} tests {'✅' if apt_tests == 0 else '❌'}")
            print(f"   aptitude_attempts: {apt_attempts:,} attempts {'✅' if apt_attempts == 0 else '❌'}")
            print(f"   aptitude_progress: {apt_progress:,} progress records {'✅' if apt_progress == 0 else '❌'}")
            
            # Verify other modules are intact
            print(f"\n📋 Other Modules (Should be preserved):")
            result = await db.execute(text("SELECT COUNT(*) FROM users"))
            users = result.scalar()
            print(f"   users: {users:,} accounts {'✅' if users > 0 else '⚠️'}")
            
            result = await db.execute(text("SELECT COUNT(*) FROM interviews"))
            interviews = result.scalar()
            print(f"   interviews: {interviews:,} sessions {'✅' if interviews >= 0 else '⚠️'}")
            
            result = await db.execute(text("SELECT COUNT(*) FROM resumes"))
            resumes = result.scalar()
            print(f"   resumes: {resumes:,} files {'✅' if resumes >= 0 else '⚠️'}")
            
            return apt_questions > 0 and sjt_scenarios > 0

async def main():
    """Main reset function"""
    print("=" * 70)
    print("🧠 FLEXYOURBRAIN MODULE RESET TOOL")
    print("=" * 70)
    print("⚠️  This will ONLY affect FlexYourBrain (Aptitude) module")
    print("✅ User accounts, interviews, and career data will be PRESERVED")
    print("=" * 70)
    
    try:
        # Initialize reset tool
        reset_tool = FlexYourBrainReset()
        
        # Step 1: Show current status
        print("\n📋 STEP 1: Checking current database status...")
        status_before = await reset_tool.check_database_status()
        
        # Step 2: Get confirmation
        print("\n" + "!" * 60)
        print("⚠️  WARNING: This will delete ALL FlexYourBrain data")
        print("   - All aptitude questions will be regenerated")
        print("   - All test history will be deleted")
        print("   - All progress tracking will be reset")
        print()
        
        confirmation = input("❓ Type 'RESET FLEXYOURBRAIN' to confirm: ")
        if confirmation != "RESET FLEXYOURBRAIN":
            print("\n❌ Reset cancelled - confirmation not received")
            return
        
        # Step 3: Clear existing data
        print("\n📋 STEP 2: Clearing existing FlexYourBrain data...")
        if not await reset_tool.clear_flexyourbrain_data():
            print("❌ Failed to clear data - aborting")
            return
        
        # Step 4: Reset sequences
        print("\n📋 STEP 3: Resetting database sequences...")
        await reset_tool.reset_sequences()
        
        # Step 5: Generate new AI questions
        print("\n📋 STEP 4: Generating new AI aptitude questions...")
        apt_generated = await reset_tool.generate_ai_aptitude_questions()
        if apt_generated == 0:
            print("⚠️  No aptitude questions generated - check AI configuration")
        
        # Step 6: Generate SJT scenarios
        print("\n📋 STEP 5: Generating SJT scenarios...")
        sjt_generated = await reset_tool.generate_sjt_scenarios()
        
        # Step 7: Verify reset
        print("\n📋 STEP 6: Verifying reset...")
        success = await reset_tool.verify_reset()
        
        # Final report
        print("\n" + "=" * 70)
        if success:
            print("🎉 FLEXYOURBRAIN RESET COMPLETED SUCCESSFULLY!")
        else:
            print("⚠️  RESET COMPLETED WITH SOME ISSUES")
        
        print("=" * 70)
        print(f"\n📊 SUMMARY:")
        print(f"   ✅ Cleared: {status_before['apt_questions']:,} old questions")
        print(f"   ✅ Generated: {apt_generated:,} new AI aptitude questions")
        print(f"   ✅ Generated: {sjt_generated:,} SJT scenarios")
        print(f"   ✅ Preserved: All other module data")
        
    except Exception as e:
        print(f"\n❌ Reset failed: {str(e)}")
        print("\n💡 Check these common issues:")
        print("   1. PostgreSQL is running")
        print("   2. DATABASE_URL is correct in .env")
        print("   3. GROQ_API_KEY is set for AI generation")
        print("   4. You have database permissions")
        
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Run with asyncio
    asyncio.run(main())