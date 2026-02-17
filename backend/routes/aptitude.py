# backend/routes/aptitude.py
import json
import random
from datetime import datetime
import traceback
from typing import List, Optional, Dict, Any
from pathlib import Path

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from db_models import (
    User, AptitudeQuestion, AptitudeTest, AptitudeAttempt, 
    AptitudeProgress, SJTScenario
)
from auth import get_current_user, get_db_dependency

from utils.question_manager import QuestionManager
from utils.sjt_manager import SJTManager
from utils.question_tracker import question_tracker

# =================== PATHS ===================
BASE_DIR = Path(__file__).resolve().parent.parent

router = APIRouter()
question_manager = QuestionManager()
sjt_manager = SJTManager() 

def _get_display_category(category: str) -> str:
    display_map = {
        "Logical": "Logical Reasoning",
        "Quantitative": "Quantitative Aptitude", 
        "Verbal": "Verbal Ability",
        "Coding": "Coding Challenge"
    }
    return display_map.get(category, category)

async def update_aptitude_progress(db: AsyncSession, user_id: int, category: str, test_data: Dict[str, Any]):
    """Update user's aptitude progress after test completion (NO GAMIFICATION)"""
    result = await db.execute(
        select(AptitudeProgress).where(
            AptitudeProgress.user_id == user_id,
            AptitudeProgress.category == category
        )
    )
    progress = result.scalar_one_or_none()

    total_questions = test_data['total_questions']
    correct_answers = test_data['correct_answers']
    score_percentage = test_data['score_percentage']
    avg_time_per_question = test_data.get('avg_time_per_question', 0)

    if progress:
        # Update existing progress
        old_total_tests = progress.total_tests
        old_total_questions = progress.total_questions_attempted
        old_total_correct = progress.total_correct_answers
        
        progress.total_tests += 1
        progress.total_questions_attempted += total_questions
        progress.total_correct_answers += correct_answers
        
        # Update averages
        progress.avg_score_percentage = (
            (progress.avg_score_percentage * old_total_tests) + score_percentage
        ) / progress.total_tests
        
        progress.avg_time_per_question = (
            (progress.avg_time_per_question * old_total_questions) + avg_time_per_question * total_questions
        ) / progress.total_questions_attempted
        
        # Update best score
        if score_percentage > progress.best_score_percentage:
            progress.best_score_percentage = score_percentage
            
        progress.last_practice_date = datetime.utcnow()
        progress.updated_at = datetime.utcnow()
    else:
        # Create new progress entry
        progress = AptitudeProgress(
            user_id=user_id,
            category=category,
            total_tests=1,
            total_questions_attempted=total_questions,
            total_correct_answers=correct_answers,
            avg_score_percentage=score_percentage,
            best_score_percentage=score_percentage,
            avg_time_per_question=avg_time_per_question,
            last_practice_date=datetime.utcnow(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(progress)

    await db.commit()
    await db.refresh(progress)
    return progress

# =================== QUESTION BANK ROUTES ===================
@router.get("/categories")
async def get_aptitude_categories(db: AsyncSession = Depends(get_db_dependency)):
    """Get all available aptitude categories from database"""
    categories = await question_manager.get_all_domains(db)
    return {
        "categories": categories,
        "total_categories": len(categories)
    }

@router.get("/questions/{category}")
async def get_questions_by_category(
    category: str,
    difficulty: Optional[str] = Query(None, regex="^(easy|medium|hard|all)$"),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db_dependency)
):
    """Get questions by category with optional difficulty filter from database"""
    try:
        # Get questions directly from database
        questions = await question_manager.get_questions_by_domain(
            db, category, limit, difficulty or "all"
        )
        
        if not questions:
            raise HTTPException(status_code=404, detail=f"No questions found for category '{category}'")
        
        return {
            "category": category,
            "difficulty_filter": difficulty,
            "count": len(questions),
            "questions": questions
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching questions: {str(e)}")

@router.get("/question/{question_id}")
async def get_question_by_id(
    question_id: int,
    db: AsyncSession = Depends(get_db_dependency)
):
    """Get specific question by ID from database"""
    try:
        result = await db.execute(
            select(AptitudeQuestion).where(AptitudeQuestion.id == question_id)
        )
        question = result.scalar_one_or_none()
        
        if not question:
            raise HTTPException(status_code=404, detail=f"Question with ID {question_id} not found")
        
        # Convert to dict format
        question_dict = {
            "id": question.id,
            "category": question.category,
            "subcategory": question.subcategory,
            "difficulty": question.difficulty,
            "question_text": question.question_text,
            "options": question.options,
            "correct_answer": question.correct_answer,
            "explanation": question.explanation,
            "time_limit": question.time_limit
        }
        
        return question_dict
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =================== PRACTICE DRILLS ROUTES ===================
@router.post("/practice/start")
async def start_practice_session(
    request_data: Dict[str, Any],
    db: AsyncSession = Depends(get_db_dependency),
    current_user: User = Depends(get_current_user)
):
    try:
        category = request_data.get('category', 'Logical')
        difficulty = request_data.get('difficulty', 'medium')
        question_count = request_data.get('question_count', 10)

        # Clear previous session for this user/category
        question_tracker.clear_session(current_user.id, category)
        
        print(f"🔧 Starting practice session from database: {category}, {difficulty}, {question_count}")
        
        # Get questions directly from database
        questions = await question_manager.get_questions_by_domain(
            db, category, question_count, difficulty
        )
        
        if not questions:
            raise HTTPException(
                status_code=500, 
                detail=f"Could not get questions for {category}"
            )
        
        # Validate questions structure and fix any issues
        validated_questions = []
        for i, q in enumerate(questions):
            # Check required fields
            if not all(key in q for key in ['question_text', 'options', 'correct_answer']):
                print(f"❌ Invalid question at index {i}: {q}")
                continue
            
            # Validate correct_answer format
            correct_answer = str(q['correct_answer']).upper().strip()
            if correct_answer not in ['A', 'B', 'C', 'D']:
                print(f"⚠️ Fixing invalid correct_answer: {q['correct_answer']}")
                # Default to A if invalid
                q['correct_answer'] = 'A'
            
            # Validate options count
            if not isinstance(q['options'], list) or len(q['options']) != 4:
                print(f"⚠️ Invalid options for question: {q['question_text'][:50]}...")
                continue
                
            validated_questions.append(q)
            
        for q in validated_questions:
            question_tracker.add_question(current_user.id, category, q['id'])
        
        if not validated_questions:
            raise HTTPException(
                status_code=500,
                detail="No valid questions available after validation"
            )
        
        # Shuffle options for each question to prevent pattern recognition
        for question in validated_questions:
            options = question["options"][:]
            correct_answer = question["correct_answer"]
            
            # Validate correct_answer before shuffling
            if correct_answer not in ['A', 'B', 'C', 'D']:
                print(f"⚠️ Invalid correct_answer before shuffling: {correct_answer}, defaulting to A")
                correct_answer = 'A'
                question["correct_answer"] = 'A'
            
            # Create mapping for option shuffling
            option_mapping = {chr(65 + i): chr(65 + i) for i in range(len(options))}
            shuffled_indices = list(range(len(options)))
            random.shuffle(shuffled_indices)
            
            shuffled_options = [options[i] for i in shuffled_indices]
            for new_idx, old_idx in enumerate(shuffled_indices):
                old_letter = chr(65 + old_idx)
                new_letter = chr(65 + new_idx)
                option_mapping[old_letter] = new_letter
            
            # Update question with shuffled options and new correct answer
            question["options"] = shuffled_options
            question["correct_answer"] = option_mapping[correct_answer]
            question["original_correct_answer"] = correct_answer  # Store for verification
        
        # Create test record
        test = AptitudeTest(
            user_id=current_user.id,
            test_type="practice",
            category=category,
            total_questions=len(validated_questions),
            time_limit=0,  # No time limit for practice
            status="in_progress",
            started_at=datetime.utcnow()
        )
        
        db.add(test)
        await db.commit()
        await db.refresh(test)
        
        print(f"✅ Practice session created with ID: {test.id}")
        
        return {
            "test_id": test.id,
            "category": category,
            "display_category": _get_display_category(category),
            "difficulty": difficulty,
            "questions": validated_questions,
            "total_questions": len(validated_questions),
            "test_type": "practice",
            "ai_generated": any(q.get('source') == 'ai_generated' for q in validated_questions)
        }
    
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in start_practice_session: {str(e)}")
        print(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/practice/{test_id}/submit")
async def submit_practice_answer(
    test_id: int,
    attempt_data: Dict[str, Any],
    db: AsyncSession = Depends(get_db_dependency),
    current_user: User = Depends(get_current_user)
):
    """Submit answer for a practice question using database"""
    try:
        print("="*60)
        print(f"📝 SUBMIT ANSWER ENDPOINT CALLED")
        print(f"Test ID: {test_id}")
        print(f"User ID: {current_user.id}")
        print(f"User Email: {current_user.email}")
        print(f"Attempt Data received: {attempt_data}")
        print("="*60)
        
        # Validate required fields
        if 'question_id' not in attempt_data:
            print("❌ Missing question_id in request")
            raise HTTPException(status_code=400, detail="Missing question_id")
        
        question_id = attempt_data['question_id']
        user_answer = attempt_data.get('user_answer')
        time_taken = attempt_data.get('time_taken', 0)
        
        print(f"Question ID: {question_id}")
        print(f"User Answer: {user_answer}")
        print(f"Time Taken: {time_taken}")
        
        # First, verify the test exists and belongs to the user
        test_result = await db.execute(
            select(AptitudeTest).where(
                AptitudeTest.id == test_id,
                AptitudeTest.user_id == current_user.id
            )
        )
        test = test_result.scalar_one_or_none()
        
        if not test:
            print(f"❌ Test {test_id} not found for user {current_user.id}")
            raise HTTPException(status_code=404, detail="Test not found")
        
        print(f"✅ Test found: {test.id}, Status: {test.status}")
        
        # Get question directly from database
        result = await db.execute(
            select(AptitudeQuestion).where(AptitudeQuestion.id == question_id)
        )
        question = result.scalar_one_or_none()
        
        if not question:
            print(f"❌ Question {question_id} not found in database")
            raise HTTPException(status_code=404, detail=f"Question {question_id} not found in database")
        
        print(f"✅ Question found: {question.id}")
        print(f"Question text: {question.question_text[:50]}...")
        print(f"Correct answer: {question.correct_answer}")
        
        is_correct = (user_answer == question.correct_answer) if user_answer else False
        print(f"Is correct: {is_correct}")
        
        # Create the attempt
        attempt = AptitudeAttempt(
            test_id=test_id,
            question_id=question_id,
            user_answer=user_answer,
            is_correct=is_correct,
            time_taken=time_taken,
            attempted_at=datetime.utcnow()
        )
        
        db.add(attempt)
        await db.commit()
        await db.refresh(attempt)
        
        print(f"✅ Attempt created with ID: {attempt.id}")
        print(f"Answer submitted successfully for question {question_id}")
        print("="*60)
        
        return {
            "attempt_id": attempt.id,
            "is_correct": is_correct,
            "correct_answer": question.correct_answer,
            "explanation": question.explanation,
            "database_question_id": question_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error submitting answer: {e}")
        print(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/practice/{test_id}/complete")
async def complete_practice_session(
    test_id: int,
    db: AsyncSession = Depends(get_db_dependency),
    current_user: User = Depends(get_current_user)
):
    """Complete a practice session and calculate results (NO GAMIFICATION)"""
    try:
        # Get test and attempts
        test_result = await db.execute(
            select(AptitudeTest).where(
                AptitudeTest.id == test_id,
                AptitudeTest.user_id == current_user.id
            )
        )
        test = test_result.scalar_one_or_none()
        
        if not test:
            raise HTTPException(status_code=404, detail="Test not found")
        
        attempts_result = await db.execute(
            select(AptitudeAttempt).where(AptitudeAttempt.test_id == test_id)
        )
        attempts = attempts_result.scalars().all()
        
        # Calculate results
        correct_answers = sum(1 for attempt in attempts if attempt.is_correct)
        score_percentage = (correct_answers / test.total_questions) * 100 if test.total_questions > 0 else 0
        total_time_taken = sum(attempt.time_taken for attempt in attempts if attempt.time_taken)
        avg_time_per_question = total_time_taken / len(attempts) if attempts else 0
        
        # Update test record
        test.correct_answers = correct_answers
        test.score_percentage = score_percentage
        test.time_taken = total_time_taken
        test.status = "completed"
        test.completed_at = datetime.utcnow()
        
        await db.commit()
        
        # Update progress (NO GAMIFICATION)
        progress_data = {
            'total_questions': test.total_questions,
            'correct_answers': correct_answers,
            'score_percentage': score_percentage,
            'avg_time_per_question': avg_time_per_question
        }
        await update_aptitude_progress(db, current_user.id, test.category, progress_data)
        
        response = {
            "test_id": test.id,
            "total_questions": test.total_questions,
            "correct_answers": correct_answers,
            "score_percentage": round(score_percentage, 2),
            "time_taken": total_time_taken,
            "avg_time_per_question": round(avg_time_per_question, 2)
        }
        
        return response
        
    except Exception as e:
        print(f"Error completing practice: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =================== MOCK TEST ROUTES ===================
@router.post("/mock-test/start")
async def start_mock_test(
    request_data: Dict[str, Any],
    db: AsyncSession = Depends(get_db_dependency),
    current_user: User = Depends(get_current_user)
):
    """Start a new mock test (50 questions, 60 minutes) using database"""
    try:
        categories = request_data.get('categories', ['Logical', 'Quantitative', 'Verbal', 'Coding'])
        question_count = 50  # Fixed for mock test
        time_limit = 60 * 60  # 60 minutes in seconds
        
        all_questions = []
        
        for category in categories:
            # Get questions for each category from database
            category_questions = await question_manager.get_questions_by_domain(
                db, category, 20, "all"  # Get more questions to select from
            )
            
            if category_questions:
                # Categorize by difficulty
                easy_q = [q for q in category_questions if q["difficulty"] == "easy"]
                medium_q = [q for q in category_questions if q["difficulty"] == "medium"]
                hard_q = [q for q in category_questions if q["difficulty"] == "hard"]
                
                # Select proportional questions (40% easy, 40% medium, 20% hard)
                easy_count = max(1, int(question_count * 0.4 / len(categories)))
                medium_count = max(1, int(question_count * 0.4 / len(categories)))
                hard_count = max(1, int(question_count * 0.2 / len(categories)))
                
                selected = []
                if easy_q:
                    selected.extend(random.sample(easy_q, min(easy_count, len(easy_q))))
                if medium_q:
                    selected.extend(random.sample(medium_q, min(medium_count, len(medium_q))))
                if hard_q:
                    selected.extend(random.sample(hard_q, min(hard_count, len(hard_q))))
                
                all_questions.extend(selected)
        
        # If we don't have enough questions, take what we have
        if len(all_questions) > question_count:
            selected_questions = random.sample(all_questions, question_count)
        else:
            selected_questions = all_questions
        
        # Shuffle options for each question in mock test
        for question in selected_questions:
            options = question["options"][:]
            correct_answer = question["correct_answer"]
            
            option_mapping = {chr(65 + i): chr(65 + i) for i in range(len(options))}
            shuffled_indices = list(range(len(options)))
            random.shuffle(shuffled_indices)
            
            shuffled_options = [options[i] for i in shuffled_indices]
            for new_idx, old_idx in enumerate(shuffled_indices):
                old_letter = chr(65 + old_idx)
                new_letter = chr(65 + new_idx)
                option_mapping[old_letter] = new_letter
            
            question["options"] = shuffled_options
            question["correct_answer"] = option_mapping[correct_answer]
            question["original_correct_answer"] = correct_answer
        
        # Create test record
        test = AptitudeTest(
            user_id=current_user.id,
            test_type="mock",
            category="Mixed",  # Mock tests are mixed category
            total_questions=len(selected_questions),
            time_limit=time_limit,
            status="in_progress",
            started_at=datetime.utcnow()
        )
        
        db.add(test)
        await db.commit()
        await db.refresh(test)
        
        return {
            "test_id": test.id,
            "categories": categories,
            "questions": selected_questions,
            "total_questions": len(selected_questions),
            "time_limit": time_limit,
            "test_type": "mock"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =================== SJT ROUTES ===================
@router.get("/sjt/scenarios")
async def get_sjt_scenarios(
    db: AsyncSession = Depends(get_db_dependency),
    category: Optional[str] = None,
    limit: int = Query(10, ge=1, le=20)
):
    """Get SJT scenarios from database with optional category filter"""
    try:
        # Use SJT manager instead of direct database query
        scenarios = await sjt_manager.get_scenarios_by_category(
            db=db, 
            category=category, 
            count=limit
        )
        
        return {
            "scenarios": scenarios,
            "count": len(scenarios),
            "category_filter": category
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sjt/categories")
async def get_sjt_categories(db: AsyncSession = Depends(get_db_dependency)):
    """Get all available SJT categories"""
    try:
        categories = await sjt_manager.get_all_categories(db)
        return {
            "categories": categories,
            "total_categories": len(categories)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sjt/stats")
async def get_sjt_statistics(db: AsyncSession = Depends(get_db_dependency)):
    """Get statistics about SJT scenarios"""
    try:
        stats = await sjt_manager.get_scenario_stats(db)
        return {
            "statistics": stats,
            "last_updated": "Database (Live)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sjt/submit")
async def submit_sjt_response(
    response_data: Dict[str, Any],
    db: AsyncSession = Depends(get_db_dependency),
    current_user: User = Depends(get_current_user)
):
    """Submit SJT responses and get feedback"""
    try:
        scenario_id = response_data['scenario_id']
        most_effective = response_data['most_effective']
        least_effective = response_data['least_effective']
        
        # Get scenario from database
        result = await db.execute(
            select(SJTScenario).where(SJTScenario.id == scenario_id)
        )
        scenario = result.scalar_one_or_none()
        
        if not scenario:
            raise HTTPException(status_code=404, detail="Scenario not found")
        
        # Calculate score
        most_correct = (most_effective == scenario.most_effective)
        least_correct = (least_effective == scenario.least_effective)
        score = 0
        if most_correct:
            score += 2
        if least_correct:
            score += 1
        
        # Create SJT test record
        test = AptitudeTest(
            user_id=current_user.id,
            test_type="sjt",
            category=scenario.category,
            total_questions=1,
            correct_answers=score,
            score_percentage=(score / 3) * 100,
            time_taken=response_data.get('time_taken', 0),
            status="completed",
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow()
        )
        db.add(test)
        await db.commit()
        await db.refresh(test)
        
        # Create attempt record
        attempt = AptitudeAttempt(
            test_id=test.id,
            question_id=scenario_id,
            user_answer=f"M:{most_effective},L:{least_effective}",
            is_correct=(score >= 2),  # Consider correct if score is 2 or 3
            time_taken=response_data.get('time_taken', 0),
            attempted_at=datetime.utcnow()
        )
        db.add(attempt)
        await db.commit()
        
        return {
            "scenario_id": scenario_id,
            "your_most_effective": most_effective,
            "correct_most_effective": scenario.most_effective,
            "your_least_effective": least_effective,
            "correct_least_effective": scenario.least_effective,
            "most_correct": most_correct,
            "least_correct": least_correct,
            "score": score,
            "max_score": 3,
            "explanation": scenario.explanation,
            "test_id": test.id
        }
        
    except Exception as e:
        print(f"❌ Error submitting SJT response: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# =================== ANALYTICS ROUTES ===================
@router.get("/analytics/overview")
async def get_analytics_overview(
    db: AsyncSession = Depends(get_db_dependency),
    current_user: User = Depends(get_current_user)
):
    """Get overview analytics for aptitude tests (NO GAMIFICATION)"""
    try:
        # Get progress for all categories
        progress_result = await db.execute(
            select(AptitudeProgress).where(AptitudeProgress.user_id == current_user.id)
        )
        progress_list = progress_result.scalars().all()
        
        # Get test history
        tests_result = await db.execute(
            select(AptitudeTest)
            .where(AptitudeTest.user_id == current_user.id)
            .order_by(AptitudeTest.completed_at.desc())
            .limit(10)
        )
        recent_tests = tests_result.scalars().all()
        
        # Calculate overall stats
        total_tests = sum(p.total_tests for p in progress_list)
        total_questions = sum(p.total_questions_attempted for p in progress_list)
        total_correct = sum(p.total_correct_answers for p in progress_list)
        overall_accuracy = (total_correct / total_questions * 100) if total_questions > 0 else 0
        
        # Get best category
        best_category = None
        best_score = 0
        for progress in progress_list:
            if progress.avg_score_percentage > best_score:
                best_score = progress.avg_score_percentage
                best_category = progress.category
        
        return {
            "overview": {
                "total_tests": total_tests,
                "total_questions_attempted": total_questions,
                "total_correct_answers": total_correct,
                "overall_accuracy": round(overall_accuracy, 2),
                "best_category": best_category,
                "best_category_score": round(best_score, 2) if best_category else 0
            },
            "category_breakdown": [
                {
                    "category": p.category,
                    "total_tests": p.total_tests,
                    "accuracy": round((p.total_correct_answers / p.total_questions_attempted * 100), 2) if p.total_questions_attempted > 0 else 0,
                    "avg_time_per_question": round(p.avg_time_per_question, 2),
                    "best_score": round(p.best_score_percentage, 2)
                }
                for p in progress_list
            ],
            "recent_tests": [
                {
                    "id": test.id,
                    "test_type": test.test_type,
                    "category": test.category,
                    "score": round(test.score_percentage, 2),
                    "completed_at": test.completed_at.isoformat() if test.completed_at else None,
                    "time_taken": test.time_taken
                }
                for test in recent_tests
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/category/{category}")
async def get_category_analytics(
    category: str,
    db: AsyncSession = Depends(get_db_dependency),
    current_user: User = Depends(get_current_user)
):
    """Get detailed analytics for a specific category (NO GAMIFICATION)"""
    try:
        # Get progress for the category
        progress_result = await db.execute(
            select(AptitudeProgress).where(
                AptitudeProgress.user_id == current_user.id,
                AptitudeProgress.category == category
            )
        )
        progress = progress_result.scalar_one_or_none()
        
        if not progress:
            raise HTTPException(status_code=404, detail=f"No data found for category '{category}'")
        
        # Get test history for this category
        tests_result = await db.execute(
            select(AptitudeTest)
            .where(
                AptitudeTest.user_id == current_user.id,
                AptitudeTest.category == category
            )
            .order_by(AptitudeTest.completed_at.desc())
        )
        tests = tests_result.scalars().all()
        
        # Calculate improvement
        improvement = 0
        if len(tests) >= 2:
            first_score = tests[-1].score_percentage
            latest_score = tests[0].score_percentage
            improvement = latest_score - first_score
        
        return {
            "category": category,
            "stats": {
                "total_tests": progress.total_tests,
                "total_questions_attempted": progress.total_questions_attempted,
                "total_correct_answers": progress.total_correct_answers,
                "accuracy": round((progress.total_correct_answers / progress.total_questions_attempted * 100), 2),
                "avg_score": round(progress.avg_score_percentage, 2),
                "best_score": round(progress.best_score_percentage, 2),
                "avg_time_per_question": round(progress.avg_time_per_question, 2),
                "improvement_since_start": round(improvement, 2)
            },
            "test_history": [
                {
                    "id": test.id,
                    "test_type": test.test_type,
                    "score": round(test.score_percentage, 2),
                    "correct_answers": test.correct_answers,
                    "total_questions": test.total_questions,
                    "time_taken": test.time_taken,
                    "completed_at": test.completed_at.isoformat() if test.completed_at else None
                }
                for test in tests
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# =================== AI QUESTION MANAGEMENT ROUTES ===================
@router.post("/ai/generate-questions")
async def generate_ai_questions(
    request_data: Dict[str, Any] = None,
    db: AsyncSession = Depends(get_db_dependency),
    current_user: User = Depends(get_current_user)
):
    """Generate new AI questions and add them to the database"""
    try:
        # Check if user has admin privileges
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        
        if request_data is None:
            request_data = {}
        
        domains = request_data.get('domains', ["Logical", "Quantitative", "Verbal", "Coding"])
        difficulties = request_data.get('difficulties', ["easy", "medium", "hard"])
        questions_per_combination = request_data.get('questions_per_combination', 3)
        
        new_questions_count = await question_manager.refresh_question_bank(
            db, domains, difficulties, questions_per_combination
        )
        
        stats = await question_manager.get_question_stats(db)
        
        return {
            "message": "AI question generation completed",
            "new_questions_count": new_questions_count,
            "domains": domains,
            "difficulties": difficulties,
            "total_questions_now": stats["total_questions"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating questions: {str(e)}")

@router.get("/ai/question-stats")
async def get_ai_question_statistics(db: AsyncSession = Depends(get_db_dependency)):
    """Get statistics about the AI question bank from database"""
    try:
        stats = await question_manager.get_question_stats(db)
        return {
            "statistics": stats,
            "domains": list(stats["domains"].keys()),
            "last_updated": "Database (Live)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ai/reset-usage")
async def reset_question_usage(
    current_user: User = Depends(get_current_user)
):
    """Reset used questions tracking"""
    try:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # In database-only approach, we don't track usage the same way
        # Questions are selected based on attempt history
        return {
            "message": "Question usage is now managed via database attempts",
            "note": "To reset usage, clear your attempt history"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ai/domains")
async def get_ai_domains(db: AsyncSession = Depends(get_db_dependency)):
    """Get all available domains from database"""
    try:
        domains = await question_manager.get_all_domains(db)
        return {
            "domains": domains,
            "count": len(domains)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/question-stats")
async def get_question_statistics(db: AsyncSession = Depends(get_db_dependency)):
    """Get statistics about the current question bank from database"""
    try:
        stats = await question_manager.get_question_stats(db)
        return {
            "statistics": stats,
            "last_updated": "Database (Live)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))