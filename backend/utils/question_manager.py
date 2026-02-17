# backend/utils/question_manager.py
import random
from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from db_models import AptitudeQuestion
from .ai_question_generator import AIQuestionGenerator
import json
import hashlib
from datetime import datetime


class QuestionManager:
    def __init__(self):
        self.ai_generator = AIQuestionGenerator()
        print("✅ Database-only QuestionManager initialized")
    
    async def get_questions_by_domain(self, db: AsyncSession, domain: str, count: int = 10, difficulty: str = "all") -> List[Dict]:
        """
        Get questions from database, ensuring fresh questions each time
        """
        print(f"🔧 Getting {count} {difficulty} questions for {domain} from database")
        
        try:
            # Build query based on difficulty
            if difficulty == "all":
                query = select(AptitudeQuestion).where(
                    AptitudeQuestion.category == domain
                )
            else:
                query = select(AptitudeQuestion).where(
                    AptitudeQuestion.category == domain,
                    AptitudeQuestion.difficulty == difficulty
                )
            
            result = await db.execute(query.order_by(func.random()))
            available_questions = result.scalars().all()
            
            print(f"🔧 Found {len(available_questions)} questions in database for {domain}")
            
            # If there are no questions at all in the database
            if len(available_questions) == 0:
                print(f"⚠️ No questions found in database for {domain}, generating emergency questions...")
                # Generate emergency questions
                emergency_questions = await self._generate_emergency_questions(db, domain, count, difficulty)
                if emergency_questions:
                    print(f"✅ Generated {len(emergency_questions)} emergency questions")
                    return emergency_questions
                else:
                    print(f"❌ Failed to generate emergency questions for {domain}")
                    return []
            
            # If not enough questions, generate more with improved logic
            if len(available_questions) < count:
                needed = count - len(available_questions)
                print(f"🔄 Need {needed} more questions, generating via AI...")
                
                # Generate new questions
                new_questions = await self._generate_and_save_questions_needed(
                    db, domain, needed * 2, difficulty
                )
                
                if new_questions:
                    # Re-query to get all questions including new ones
                    if difficulty == "all":
                        query = select(AptitudeQuestion).where(
                            AptitudeQuestion.category == domain
                        )
                    else:
                        query = select(AptitudeQuestion).where(
                            AptitudeQuestion.category == domain,
                            AptitudeQuestion.difficulty == difficulty
                        )
                    
                    result = await db.execute(query.order_by(func.random()))
                    available_questions = result.scalars().all()
                    print(f"✅ Now have {len(available_questions)} total questions")
            
            # Select final questions
            selected_questions = []
            question_ids = [q.id for q in available_questions]
            
            if len(question_ids) > count:
                import random
                selected_ids = random.sample(question_ids, min(count, len(question_ids)))
                selected_questions = [q for q in available_questions if q.id in selected_ids]
            else:
                selected_questions = available_questions
            
            print(f"✅ Returning {len(selected_questions)} questions for {domain}")
            
            # Convert to dict format for frontend
            return [self._question_to_dict(q) for q in selected_questions]
            
        except Exception as e:
            print(f"❌ Error in get_questions_by_domain: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    async def _generate_and_save_questions_needed(self, db: AsyncSession, domain: str, count: int, difficulty: str) -> List[Dict]:
        """Generate new questions using AI and save to database"""
        try:
            print(f"🤖 Generating {count} new {difficulty} questions for {domain}")
            new_questions = self.ai_generator.generate_questions(domain, count, difficulty)
            
            if not new_questions:
                print("❌ AI generator returned no questions")
                return []
            
            saved_questions = []
            
            for q_data in new_questions:
                # Validate the question first
                if not self._validate_question_structure(q_data):
                    print(f"⚠️ Skipping invalid question structure")
                    continue
                
                # Fix duplicate options
                q_data = self._fix_duplicate_options(q_data)
                
                # Check if question already exists - FIXED: use .first() instead of .scalar_one_or_none()
                result = await db.execute(
                    select(AptitudeQuestion).where(
                        AptitudeQuestion.question_text == q_data["question_text"]
                    ).limit(1)  # Add limit to ensure we only get one
                )
                existing_question = result.first()  # Use .first() which returns a tuple
                
                if existing_question:
                    # Extract the question object from the tuple
                    existing_question = existing_question[0] if existing_question else None
                    print(f"⚠️ Question already exists in DB: {existing_question.id if existing_question else 'unknown'}")
                    if existing_question:
                        saved_questions.append(existing_question)
                else:
                    # Create new database entry
                    question = AptitudeQuestion(
                        category=q_data["category"],
                        subcategory=q_data.get("subcategory", "General"),
                        difficulty=q_data.get("difficulty", "medium"),
                        question_text=q_data["question_text"],
                        options=q_data["options"],
                        correct_answer=q_data["correct_answer"],
                        explanation=q_data.get("explanation", ""),
                        time_limit=q_data.get("time_limit", 60),
                        created_at=datetime.now()
                    )
                    db.add(question)
                    # Commit immediately to avoid session issues
                    try:
                        await db.commit()
                        await db.refresh(question)
                        saved_questions.append(question)
                        print(f"✅ Saved new question to DB: {question.id}")
                    except Exception as commit_error:
                        await db.rollback()
                        print(f"❌ Commit error: {commit_error}")
                        # Try to continue with other questions
                        continue
            
            print(f"🎉 Successfully processed {len(saved_questions)} questions")
            return saved_questions
            
        except Exception as e:
            await db.rollback()
            print(f"❌ Error generating/saving questions: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _validate_question_structure(self, q_data: dict) -> bool:
        """Validate question structure before saving"""
        required_fields = ["question_text", "options", "correct_answer", "category"]
        
        # Check required fields
        for field in required_fields:
            if field not in q_data:
                print(f"❌ Missing required field: {field}")
                return False
        
        # Validate options
        if not isinstance(q_data["options"], list) or len(q_data["options"]) != 4:
            print(f"❌ Invalid options: {q_data['options']}")
            return False
        
        # Validate correct_answer format
        correct_answer = str(q_data["correct_answer"]).upper().strip()
        if correct_answer not in ['A', 'B', 'C', 'D']:
            print(f"❌ Invalid correct_answer: {correct_answer}")
            return False
        
        # Check for duplicate options
        unique_options = set()
        for option in q_data["options"]:
            if option in unique_options:
                print(f"⚠️ Duplicate option found: {option}")
                # Don't fail here, we'll fix it later
            unique_options.add(option)
        
        return True

    def _fix_duplicate_options(self, q_data: dict) -> dict:
        """Fix duplicate options in AI-generated questions"""
        options = q_data["options"]
        corrected_answer = str(q_data["correct_answer"]).upper().strip()
        
        # Create a set to track unique options
        unique_options = []
        seen = set()
        duplicate_indices = []
        
        # Identify duplicates
        for i, option in enumerate(options):
            if option not in seen:
                unique_options.append(option)
                seen.add(option)
            else:
                duplicate_indices.append(i)
        
        # If we have duplicates, we need to fix them
        if duplicate_indices:
            print(f"🔧 Fixing {len(duplicate_indices)} duplicate options")
            
            # Generate new unique options for duplicates
            base_options = [
                "Option A: ",
                "Option B: ", 
                "Option C: ",
                "Option D: "
            ]
            
            # Create corrected options list
            corrected_options = []
            for i in range(4):
                if i < len(unique_options):
                    corrected_options.append(unique_options[i])
                else:
                    # Generate a unique option based on the question
                    corrected_options.append(f"{base_options[i]}Alternative choice")
            
            # Update the options
            q_data["options"] = corrected_options
            
            # If the correct_answer points to a duplicate, we need to adjust it
            answer_index = ord(corrected_answer) - 65  # Convert A->0, B->1, etc.
            
            # If the answer was pointing to a duplicate, change it to first occurrence
            original_option = options[answer_index] if answer_index < len(options) else None
            if original_option and options.count(original_option) > 1:
                # Find first occurrence of this option
                first_occurrence = options.index(original_option)
                new_answer = chr(65 + first_occurrence)  # Convert back to letter
                q_data["correct_answer"] = new_answer
                print(f"🔧 Fixed correct_answer from {corrected_answer} to {new_answer}")
        
        return q_data

    async def _generate_emergency_questions(self, db: AsyncSession, domain: str, count: int, difficulty: str) -> List[Dict]:
        """Generate emergency questions when database is empty"""
        try:
            print(f"🚨 EMERGENCY: Generating {count} questions for {domain}")
            
            # Try AI generation first
            new_questions = self.ai_generator.generate_questions(domain, count, difficulty)
            
            if not new_questions:
                print("❌ AI generation failed, creating manual questions")
                # Create simple manual questions as fallback
                new_questions = self._create_manual_questions(domain, count, difficulty)
            
            if new_questions:
                saved_questions = []
                for q_data in new_questions:
                    from datetime import datetime
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
                    saved_questions.append(question)
                
                await db.commit()
                
                # Refresh to get IDs
                for q in saved_questions:
                    await db.refresh(q)
                
                print(f"✅ Saved {len(saved_questions)} emergency questions")
                return [self._question_to_dict(q) for q in saved_questions]
            
            return []
            
        except Exception as e:
            await db.rollback()
            print(f"❌ Emergency generation failed: {e}")
            return []
    
    def _create_manual_questions(self, domain: str, count: int, difficulty: str) -> List[Dict]:
        """Create simple manual questions as ultimate fallback"""
        base_questions = {
            "Logical Reasoning": [
                {
                    "question_text": "What comes next: A, C, E, G, ?",
                    "options": ["H", "I", "J", "K"],
                    "correct_answer": "B",  # I
                    "explanation": "The sequence skips one letter each time: A, C, E, G, I"
                }
            ],
            "Quantitative Aptitude": [
                {
                    "question_text": "What is 15% of 200?",
                    "options": ["15", "30", "25", "20"],
                    "correct_answer": "B", 
                    "explanation": "15% of 200 = 0.15 × 200 = 30"
                }
            ],
            "Verbal Ability": [
                {
                    "question_text": "Choose the correctly spelled word:",
                    "options": ["Accomodate", "Acommodate", "Accommodate", "Acomodate"],
                    "correct_answer": "C",
                    "explanation": "Accommodate has double 'c' and double 'm'"
                }
            ],
            "Coding Challenge": [
                {
                    "question_text": "Which data structure uses LIFO (Last In First Out)?",
                    "options": ["Queue", "Stack", "Array", "Linked List"],
                    "correct_answer": "B",
                    "explanation": "Stack uses LIFO principle while Queue uses FIFO"
                }
            ]
        }
        
        questions = base_questions.get(domain, [])
        # Repeat questions if needed to reach count
        while len(questions) < count and questions:
            questions.append(questions[0])
        
        # Add metadata
        for q in questions:
            q.update({
                "category": domain,
                "subcategory": "General",
                "difficulty": difficulty,
                "time_limit": 60,
                "source": "manual_fallback"
            })
        
        return questions[:count]
    
    def _question_to_dict(self, question) -> Dict:
        """Convert SQLAlchemy question object to dict"""
        return {
            "id": question.id,
            "category": question.category,
            "subcategory": question.subcategory,
            "difficulty": question.difficulty,
            "question_text": question.question_text,
            "options": question.options,
            "correct_answer": question.correct_answer,
            "explanation": question.explanation,
            "time_limit": question.time_limit,
            "source": "database"
        }
    
    async def get_all_domains(self, db: AsyncSession) -> List[str]:
        """Get list of all available domains from database"""
        result = await db.execute(
            select(AptitudeQuestion.category).distinct()
        )
        domains = [row[0] for row in result.all()]
        
        # If no domains found, return ONLY THESE 4 CATEGORIES
        if not domains:
            domains = ["Logical Reasoning", "Quantitative Aptitude", "Verbal Ability", "Coding Challenge"]
        
        print(f"🌐 Available domains in DB: {domains}")
        return domains
    
    async def get_question_stats(self, db: AsyncSession) -> Dict:
        """Get statistics about questions in database"""
        # Total questions
        total_result = await db.execute(select(func.count(AptitudeQuestion.id)))
        total_questions = total_result.scalar()
        
        # Questions by domain
        domain_result = await db.execute(
            select(AptitudeQuestion.category, func.count(AptitudeQuestion.id))
            .group_by(AptitudeQuestion.category)
        )
        domains = {row[0]: row[1] for row in domain_result.all()}
        
        # Questions by difficulty
        difficulty_result = await db.execute(
            select(AptitudeQuestion.difficulty, func.count(AptitudeQuestion.id))
            .group_by(AptitudeQuestion.difficulty)
        )
        difficulties = {row[0]: row[1] for row in difficulty_result.all()}
        
        stats = {
            "total_questions": total_questions,
            "domains": domains,
            "difficulties": difficulties,
            "available_questions": total_questions,
            "sources": {"database": total_questions}
        }
        
        print(f"📊 Database stats: {total_questions} total questions")
        return stats
    
    async def refresh_question_bank(self, db: AsyncSession, domains: List[str] = None, 
                                  difficulties: List[str] = None, questions_per_combination: int = 3) -> int:
        """Refresh question bank by generating new questions"""
        # Use ONLY THESE 4 CATEGORIES
        if domains is None:
            domains = ["Logical Reasoning", "Quantitative Aptitude", "Verbal Ability", "Coding Challenge"]
        
        if difficulties is None:
            difficulties = ["easy", "medium", "hard"]
        
        total_generated = 0
        
        for domain in domains:
            for difficulty in difficulties:
                print(f"🤖 Generating {questions_per_combination} {difficulty} questions for {domain}")
                new_questions = self.ai_generator.generate_questions(domain, questions_per_combination, difficulty)
                
                if new_questions:
                    saved_count = 0
                    for q_data in new_questions:
                        # Check if question already exists
                        result = await db.execute(
                            select(AptitudeQuestion).where(
                                AptitudeQuestion.question_text == q_data["question_text"]
                            )
                        )
                        existing_question = result.scalars().first()
                        
                        if not existing_question:
                            # Create new database entry
                            from datetime import datetime
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
                            saved_count += 1
                    
                    if saved_count > 0:
                        await db.commit()
                        total_generated += saved_count
                        print(f"✅ Added {saved_count} new questions for {domain}/{difficulty}")
        
        print(f"🎉 Total new questions generated: {total_generated}")
        return total_generated