# backend/utils/question_tracker.py
"""
Track which questions users have seen in their current session
to prevent repetition within the same session
"""

from typing import Dict, Set
import time

class QuestionTracker:
    def __init__(self):
        self.user_sessions: Dict[str, Dict[str, Set[int]]] = {}
        self.session_timeout = 3600  # 1 hour
        
    def _get_session_key(self, user_id: int, category: str) -> str:
        return f"{user_id}_{category}"
    
    def add_question(self, user_id: int, category: str, question_id: int):
        session_key = self._get_session_key(user_id, category)
        
        if session_key not in self.user_sessions:
            self.user_sessions[session_key] = {
                'questions': set(),
                'timestamp': time.time()
            }
        
        self.user_sessions[session_key]['questions'].add(question_id)
        
    def get_seen_questions(self, user_id: int, category: str) -> Set[int]:
        session_key = self._get_session_key(user_id, category)
        
        if session_key in self.user_sessions:
            # Check if session expired
            if time.time() - self.user_sessions[session_key]['timestamp'] > self.session_timeout:
                self.clear_session(user_id, category)
                return set()
            return self.user_sessions[session_key]['questions']
        return set()
    
    def clear_session(self, user_id: int, category: str):
        session_key = self._get_session_key(user_id, category)
        if session_key in self.user_sessions:
            del self.user_sessions[session_key]
    
    def clear_all_expired(self):
        current_time = time.time()
        expired_keys = [
            key for key, session in self.user_sessions.items()
            if current_time - session['timestamp'] > self.session_timeout
        ]
        for key in expired_keys:
            del self.user_sessions[key]

# Global instance
question_tracker = QuestionTracker()