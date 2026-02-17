# backend/seed_gamification_data.py

"""
Seed Gamification Data
- Creates initial badge system
- Migrates existing questions from questions.json to database
- Sets up fallback questions for AI system
"""

import asyncio
import json
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_async_engine(DATABASE_URL, echo=False, future=True)

BADGES_DATA = [
    # Interview badges
    {
        "badge_key": "first_interview",
        "name": "First Steps",
        "description": "Complete your first mock interview",
        "icon": "🎤",
        "requirement_type": "interviews_count",
        "requirement_value": 1,
        "xp_reward": 50
    },
    {
        "badge_key": "interview_ace",
        "name": "Interview Ace",
        "description": "Score 90%+ in 3 interviews",
        "icon": "🏆",
        "requirement_type": "high_score_count",
        "requirement_value": 3,
        "xp_reward": 200
    },
    {
        "badge_key": "interview_master",
        "name": "Interview Master",
        "description": "Complete 50 mock interviews",
        "icon": "👑",
        "requirement_type": "interviews_count",
        "requirement_value": 50,
        "xp_reward": 500
    },
    {
        "badge_key": "perfect_score",
        "name": "Perfectionist",
        "description": "Achieve a perfect 10/10 score",
        "icon": "💯",
        "requirement_type": "score_threshold",
        "requirement_value": 10,
        "xp_reward": 150
    },
    {
        "badge_key": "high_achiever",
        "name": "High Achiever",
        "description": "Score above 8.5 in any interview",
        "icon": "⭐",
        "requirement_type": "score_threshold",
        "requirement_value": 85,
        "xp_reward": 100
    },
    
    # Streak badges
    {
        "badge_key": "early_bird",
        "name": "Early Bird",
        "description": "Practice for 3 consecutive days",
        "icon": "🔥",
        "requirement_type": "streak_days",
        "requirement_value": 3,
        "xp_reward": 75
    },
    {
        "badge_key": "consistent_crusher",
        "name": "Consistent Crusher",
        "description": "Maintain a 30-day practice streak",
        "icon": "💪",
        "requirement_type": "streak_days",
        "requirement_value": 30,
        "xp_reward": 400
    },
    
    # Domain badges
    {
        "badge_key": "dsa_ninja",
        "name": "DSA Ninja",
        "description": "Complete 10 DSA interviews",
        "icon": "🥷",
        "requirement_type": "domain_interviews",
        "requirement_value": 10,
        "xp_reward": 150
    },
    {
        "badge_key": "hr_pro",
        "name": "HR Pro",
        "description": "Complete 10 HR interviews",
        "icon": "🎯",
        "requirement_type": "domain_interviews",
        "requirement_value": 10,
        "xp_reward": 150
    },
    
    # Aptitude badges (for Member 2)
    {
        "badge_key": "logic_master",
        "name": "Logic Master",
        "description": "Score 90%+ in Logical Reasoning",
        "icon": "🧠",
        "requirement_type": "aptitude_score",
        "requirement_value": 90,
        "xp_reward": 120
    },
    {
        "badge_key": "quant_wizard",
        "name": "Quant Wizard",
        "description": "Score 90%+ in Quantitative Aptitude",
        "icon": "🔢",
        "requirement_type": "aptitude_score",
        "requirement_value": 90,
        "xp_reward": 120
    },
    
    # Resume badges (for Member 3)
    {
        "badge_key": "resume_ninja",
        "name": "Resume Ninja",
        "description": "Achieve 95%+ ATS score",
        "icon": "📄",
        "requirement_type": "ats_score",
        "requirement_value": 95,
        "xp_reward": 150
    },
    
    # Special achievements
    {
        "badge_key": "all_rounder",
        "name": "All-Rounder",
        "description": "Complete activities in all 3 modules",
        "icon": "🌟",
        "requirement_type": "module_completion",
        "requirement_value": 3,
        "xp_reward": 300
    },
    {
        "badge_key": "fast_learner",
        "name": "Fast Learner",
        "description": "Reach Level 5 in under 2 weeks",
        "icon": "⚡",
        "requirement_type": "level_speed",
        "requirement_value": 5,
        "xp_reward": 200
    }
]

# Fallback questions for when AI API fails
FALLBACK_QUESTIONS = [
    # HR Questions
    {
        "domain": "hr",
        "question": "Tell me about yourself and your background.",
        "ideal_answer": "I am a motivated professional with experience in my field. I have worked on projects that demonstrate my skills. I am passionate about this industry and excited about opportunities to contribute my expertise.",
        "difficulty": "easy",
        "tags": '["behavioral", "introduction"]'
    },
    {
        "domain": "hr",
        "question": "What are your strengths and weaknesses?",
        "ideal_answer": "My key strengths include problem-solving, communication, and team collaboration. For weaknesses, I'm working on time management when juggling multiple priorities, and I've implemented time-blocking to address this.",
        "difficulty": "medium",
        "tags": '["behavioral", "self-assessment"]'
    },
    {
        "domain": "hr",
        "question": "Why do you want to work for our company?",
        "ideal_answer": "I'm impressed by your company's commitment to innovation and customer focus. Your initiatives align with my values and experience. I believe my skills would contribute to your team's success.",
        "difficulty": "medium",
        "tags": '["behavioral", "motivation"]'
    },
    {
        "domain": "hr",
        "question": "Describe a challenging situation at work and how you handled it.",
        "ideal_answer": "I faced a situation where project deadlines conflicted. I prioritized tasks, communicated with stakeholders, and delegated effectively. The result was successful delivery and improved team processes.",
        "difficulty": "hard",
        "tags": '["behavioral", "problem-solving"]'
    },
    
    # DSA Questions
    {
        "domain": "dsa",
        "question": "Explain the difference between an array and a linked list.",
        "ideal_answer": "Arrays store elements in contiguous memory with O(1) access but fixed size. Linked lists use nodes with pointers, offering dynamic size and O(1) insertion at known positions, but O(n) access time.",
        "difficulty": "easy",
        "tags": '["data-structures", "fundamentals"]'
    },
    {
        "domain": "dsa",
        "question": "What is the time complexity of binary search?",
        "ideal_answer": "Binary search has O(log n) time complexity. It divides the search interval in half repeatedly on sorted arrays. Space complexity is O(1) iteratively and O(log n) recursively due to call stack.",
        "difficulty": "easy",
        "tags": '["algorithms", "complexity"]'
    },
    {
        "domain": "dsa",
        "question": "Explain how a hash table works and its average time complexity.",
        "ideal_answer": "Hash tables use hash functions to map keys to array indices. Average time complexity is O(1) for insertion, deletion, and lookup. Collisions are handled via chaining or open addressing.",
        "difficulty": "medium",
        "tags": '["data-structures", "hashing"]'
    },
    {
        "domain": "dsa",
        "question": "What is dynamic programming? Give an example.",
        "ideal_answer": "Dynamic programming solves problems by breaking them into overlapping subproblems and storing results. Example: Fibonacci using memoization reduces time from O(2^n) to O(n) by caching computed values.",
        "difficulty": "hard",
        "tags": '["algorithms", "optimization"]'
    },
    
    # Marketing Questions
    {
        "domain": "marketing",
        "question": "How would you develop a go-to-market strategy for a new product?",
        "ideal_answer": "Start with market research to understand target audience and competition. Develop positioning and messaging. Create multi-channel marketing plan. Set measurable KPIs and launch with phased approach, optimizing based on data.",
        "difficulty": "hard",
        "tags": '["strategy", "product-launch"]'
    },
    {
        "domain": "marketing",
        "question": "Explain the difference between B2B and B2C marketing.",
        "ideal_answer": "B2B focuses on rational decision-making, longer sales cycles, and relationship building. B2C emphasizes emotional appeals, shorter cycles, and mass marketing. B2B uses LinkedIn and whitepapers; B2C uses social media and ads.",
        "difficulty": "medium",
        "tags": '["fundamentals", "strategy"]'
    },
    
    # Finance Questions
    {
        "domain": "finance",
        "question": "Explain the concept of NPV (Net Present Value).",
        "ideal_answer": "NPV is the difference between present value of cash inflows and outflows over time. It's calculated by discounting future cash flows. Positive NPV indicates profitable investment as it generates more value than cost.",
        "difficulty": "medium",
        "tags": '["financial-analysis", "valuation"]'
    },
    {
        "domain": "finance",
        "question": "What is the difference between stocks and bonds?",
        "ideal_answer": "Stocks represent ownership with potential high returns but higher risk. Bonds are debt instruments with fixed returns and lower risk. Stocks have no maturity; bonds mature on a fixed date.",
        "difficulty": "easy",
        "tags": '["fundamentals", "investments"]'
    },
    
    # Software Engineering
    {
        "domain": "software_engineering",
        "question": "Explain the SOLID principles in object-oriented programming.",
        "ideal_answer": "SOLID: Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion. These principles improve code maintainability, scalability, and reduce coupling between components.",
        "difficulty": "hard",
        "tags": '["software-design", "oop"]'
    },
    {
        "domain": "software_engineering",
        "question": "What is the difference between REST and GraphQL?",
        "ideal_answer": "REST uses multiple endpoints with fixed responses. GraphQL uses single endpoint with flexible queries. GraphQL reduces over-fetching and under-fetching but adds complexity. REST is simpler for basic CRUD operations.",
        "difficulty": "medium",
        "tags": '["api-design", "web-development"]'
    }
]

async def seed_data():
    try:
        async with engine.begin() as conn:
            print("🌱 Seeding gamification data...\n")
            
            # 1. Seed badges
            print("📛 Creating badges...")
            for badge in BADGES_DATA:
                await conn.execute(text("""
                    INSERT INTO badges (badge_key, name, description, icon, requirement_type, requirement_value, xp_reward)
                    VALUES (:badge_key, :name, :description, :icon, :requirement_type, :requirement_value, :xp_reward)
                    ON CONFLICT (badge_key) DO NOTHING
                """), badge)
            print(f"   ✓ Created {len(BADGES_DATA)} badges\n")
            
            # # 2. Seed fallback questions
            # print("❓ Creating fallback interview questions...")
            # for question in FALLBACK_QUESTIONS:
            #     await conn.execute(text("""
            #         INSERT INTO interview_questions (domain, question, ideal_answer, difficulty, tags, is_active)
            #         VALUES (:domain, :question, :ideal_answer, :difficulty, :tags::jsonb, true)
            #     """), question)
            # print(f"   ✓ Created {len(FALLBACK_QUESTIONS)} fallback questions\n")

            # 2. Seed fallback questions
            print("❓ Creating fallback interview questions...")
            for question in FALLBACK_QUESTIONS:
                await conn.execute(text("""
                    INSERT INTO interview_questions (domain, question, ideal_answer, difficulty, tags, is_active)
                    VALUES (:domain, :question, :ideal_answer, :difficulty, :tags, true)
                    ON CONFLICT DO NOTHING
                """), {
                    "domain": question["domain"],
                    "question": question["question"],
                    "ideal_answer": question["ideal_answer"],
                    "difficulty": question["difficulty"],
                    "tags": question["tags"]  # already a JSON string
                })
            print(f"   ✓ Created {len(FALLBACK_QUESTIONS)} fallback questions\n")

            
            # 3. Try to migrate existing questions from JSON (if file exists)
            questions_file = "models/questions.json"
            if os.path.exists(questions_file):
                print("📄 Migrating questions from questions.json...")
                with open(questions_file, 'r') as f:
                    json_questions = json.load(f)
                
                migrated = 0
                for domain, questions in json_questions.items():
                    if isinstance(questions, list):
                        for q_data in questions:
                            try:
                                await conn.execute(text("""
                                    INSERT INTO interview_questions (domain, question, ideal_answer, difficulty, is_active)
                                    VALUES (:domain, :question, :ideal_answer, 'medium', true)
                                    ON CONFLICT DO NOTHING
                                """), {
                                    "domain": domain.lower(),
                                    "question": q_data.get("question", ""),
                                    "ideal_answer": q_data.get("ideal_answer", "")
                                })
                                migrated += 1
                            except Exception as e:
                                print(f"   ⚠️  Skipped question: {str(e)[:50]}")
                
                print(f"   ✓ Migrated {migrated} questions from JSON\n")
            else:
                print("   ℹ️  No questions.json found - using fallback questions only\n")
        
        print("✅ Gamification data seeded successfully!\n")
        print("📊 Summary:")
        print(f"   • Badges: {len(BADGES_DATA)}")
        print(f"   • Fallback Questions: {len(FALLBACK_QUESTIONS)}")
        print("\n🎯 Next Steps:")
        print("   1. Implement gamification backend (backend/gamification.py)")
        print("   2. Set up AI question generation with fallback")
        print("   3. Connect Profile page to real data")
        
    except Exception as e:
        print(f"\n❌ Error seeding data: {str(e)}")
        raise
    
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_data())