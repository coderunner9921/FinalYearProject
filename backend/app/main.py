from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.routes import questions, interviews, evaluation

app = FastAPI(
    title="SkillBridge API",
    description="AI-Powered Interview Coaching Platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(questions.router)
app.include_router(interviews.router)
app.include_router(evaluation.router)

@app.get("/")
async def root():
    return {"message": "Welcome to SkillBridge API"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "SkillBridge API"}

@app.get("/api/test-analysis")
async def test_analysis():
    """Test endpoint to verify AI services are working"""
    from app.services.sentiment_analysis import sentiment_analyzer
    from app.services.grammar_check import grammar_checker
    from app.services.content_evaluator import content_evaluator
    from app.services.filler_word_detector import filler_detector
    
    test_text = "I have experience in software development and I'm confident in my abilities."
    
    return {
        "sentiment": sentiment_analyzer.analyze_sentiment(test_text),
        "grammar": grammar_checker.check_grammar(test_text),
        "content": content_evaluator.evaluate_content(test_text, ["experience", "software", "development", "confident"]),
        "filler_words": filler_detector.detect_filler_words(test_text)
    }