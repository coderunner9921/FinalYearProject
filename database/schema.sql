-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Interview sessions table
CREATE TABLE interview_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    domain VARCHAR(100) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    overall_score DECIMAL(3,1)
);

-- Questions table
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    domain VARCHAR(100) NOT NULL,
    question_text TEXT NOT NULL,
    expected_keywords TEXT[]
);

-- User responses table
CREATE TABLE user_responses (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES interview_sessions(id),
    question_id INTEGER REFERENCES questions(id),
    audio_file_path VARCHAR(500),
    transcribed_text TEXT,
    sentiment_score DECIMAL(3,1),
    grammar_score DECIMAL(3,1),
    content_score DECIMAL(3,1),
    filler_word_count INTEGER,
    response_time_seconds INTEGER
);

-- User progress table
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    level INTEGER DEFAULT 1,
    total_xp INTEGER DEFAULT 0,
    badges JSONB,
    streak_count INTEGER DEFAULT 0
);