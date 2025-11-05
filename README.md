# SkillBridge - AI Interview Coach

An AI-powered platform for conducting mock interviews and providing personalized feedback.

## 🚀 Features

- Domain-specific mock interviews (HR, Technical, Marketing)
- Real-time speech-to-text conversion
- AI-powered feedback on communication, content, and confidence
- Gamified learning with badges and progress tracking

## 🛠️ Tech Stack

### Frontend
- React 18
- Tailwind CSS
- Chart.js
- Vite

### Backend
- FastAPI (Python)
- PostgreSQL
- SQLAlchemy ORM

### AI/ML
- Vosk (Speech-to-Text)
- Hugging Face Transformers
- Sentence Transformers

## 📦 Installation

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload