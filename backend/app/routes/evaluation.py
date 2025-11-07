from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models.database_models import UserResponse
from app.services.speech_to_text import stt_service
from app.services.sentiment_analysis import sentiment_analyzer
from app.services.grammar_check import grammar_checker
from app.services.content_evaluator import content_evaluator
from app.services.filler_word_detector import filler_detector

router = APIRouter(prefix="/api/evaluation", tags=["evaluation"])

@router.post("/analyze-response")
async def analyze_response(
    session_id: int = Form(...),
    question_id: int = Form(...),
    audio_data: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Analyze user's audio response with comprehensive feedback"""
    try:
        # Step 1: Validate and read audio
        audio_bytes = await audio_data.read()

        if not audio_bytes:
            raise HTTPException(status_code=400, detail="No audio data received.")
        if len(audio_bytes) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Audio file too large (max 10MB).")

        # Step 2: Transcribe audio to text
        transcribed_text = stt_service.transcribe_audio(audio_bytes)
        if not transcribed_text.strip():
            raise HTTPException(status_code=400, detail="Speech-to-text failed. No speech detected.")

        # Step 3: Fetch question details
        from app.models.database_models import Question
        question = db.query(Question).filter(Question.id == question_id).first()
        if not question:
            raise HTTPException(status_code=404, detail=f"Question ID {question_id} not found.")
        expected_keywords = question.expected_keywords or []

        # Step 4: Perform analysis
        sentiment_result = sentiment_analyzer.analyze_sentiment(transcribed_text)
        grammar_result = grammar_checker.check_grammar(transcribed_text)
        content_result = content_evaluator.evaluate_content(transcribed_text, expected_keywords)
        filler_result = filler_detector.detect_filler_words(transcribed_text)

        # Step 5: Calculate overall weighted score
        overall_score = (
            sentiment_result["confidence_score"] * 0.2 +
            grammar_result["score"] * 0.2 +
            content_result["score"] * 0.4 +
            filler_result["fluency_score"] * 0.2
        )

        # Step 6: Store response in DB
        user_response = UserResponse(
            session_id=session_id,
            question_id=question_id,
            transcribed_text=transcribed_text,
            sentiment_score=sentiment_result["confidence_score"],
            grammar_score=grammar_result["score"],
            content_score=content_result["score"],
            filler_word_count=filler_result["count"],
            response_time_seconds=0
        )

        db.add(user_response)
        db.commit()
        db.refresh(user_response)

        # Step 7: Generate consolidated feedback (NO DUPLICATION)
        feedback = generate_consolidated_feedback(
            sentiment_result,
            grammar_result, 
            content_result,
            filler_result
        )

        improvement_tips = generate_improvement_tips(overall_score, {
            "confidence": sentiment_result["confidence_score"],
            "grammar": grammar_result["score"],
            "content": content_result["score"],
            "fluency": filler_result["fluency_score"]
        })

        # Step 8: Return formatted response
        return {
            "success": True,
            "message": "Analysis complete",
            "response_id": user_response.id,
            "transcribed_text": transcribed_text,
            "scores": {
                "overall": round(overall_score, 1),
                "confidence": round(sentiment_result["confidence_score"], 1),
                "grammar": round(grammar_result["score"], 1),
                "content": round(content_result["score"], 1),
                "fluency": round(filler_result["fluency_score"], 1)
            },
            "feedback": feedback,
            "improvement_tips": improvement_tips
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")


def generate_consolidated_feedback(sentiment_result, grammar_result, content_result, filler_result):
    """Generate consolidated feedback without duplication"""
    feedback = []
    
    # Use ONLY the feedback from each service (no additional generation here)
    if content_result.get("feedback"):
        feedback.extend(content_result["feedback"][:2])  # Limit to 2 content feedback items
    
    if grammar_result.get("feedback"):
        feedback.extend(grammar_result["feedback"][:1])  # Limit to 1 grammar feedback
    
    # Add sentiment confidence feedback
    confidence_score = sentiment_result["confidence_score"]
    if confidence_score >= 8:
        feedback.append("✅ Confident and professional tone!")
    elif confidence_score >= 6:
        feedback.append("⚠️ Good tone, could project more confidence.")
    else:
        feedback.append("💪 Work on speaking with more confidence.")
    
    # Add fluency feedback
    fluency_score = filler_result["fluency_score"]
    if fluency_score >= 8:
        feedback.append("✅ Excellent fluency and flow!")
    elif fluency_score >= 6:
        feedback.append("🗣️ Good flow, minor improvements needed.")
    else:
        feedback.append("💬 Practice smoother delivery with fewer pauses.")
    
    return feedback[:5]  # Return max 5 feedback items total


def generate_improvement_tips(overall_score, category_scores):
    """Generate concise, actionable improvement tips."""
    tips = []

    # Priority tip
    if overall_score < 6:
        tips.append("🎯 **Priority**: Focus on content coverage and confidence first.")
    elif overall_score < 8:
        tips.append("🎯 **Priority**: Refine your delivery and add more examples.")

    # Category-specific tips
    if category_scores["content"] < 7:
        tips.append("📚 **Content**: Use specific examples from your experience.")
    
    if category_scores["confidence"] < 7:
        tips.append("💪 **Confidence**: Practice speaking clearly and assertively.")
    
    if category_scores["grammar"] < 7:
        tips.append("✍️ **Grammar**: Focus on clear sentence structure.")
    
    if category_scores["fluency"] < 7:
        tips.append("🗣️ **Fluency**: Practice pausing instead of using filler words.")

    # General tips (add only if we have space)
    if len(tips) < 3:
        tips.extend([
            "⏱️ **Practice**: Regular practice builds confidence",
            "🎧 **Review**: Listen to your recordings for self-assessment"
        ])

    return tips[:4]  # Return max 4 tips