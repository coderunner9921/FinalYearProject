import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from difflib import SequenceMatcher

class ContentEvaluator:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english', lowercase=True, max_features=1000)

    def _fuzzy_match(self, text, keyword, threshold=0.7):
        """Check if keyword is present with fuzzy matching"""
        text_lower = text.lower()
        keyword_lower = keyword.lower()
        
        # Exact match
        if re.search(r'\b' + re.escape(keyword_lower) + r'\b', text_lower):
            return True
        
        # Partial match (word contains keyword)
        if keyword_lower in text_lower:
            return True
            
        # Fuzzy match for similar words
        words = text_lower.split()
        for word in words:
            if SequenceMatcher(None, word, keyword_lower).ratio() >= threshold:
                return True
                
        return False

    def evaluate_content(self, answer: str, expected_keywords: list) -> dict:
        """Evaluate content using hybrid keyword, fuzzy, and semantic similarity."""
        if not answer.strip():
            return {
                "score": 0,
                "matched_keywords": [],
                "missing_keywords": expected_keywords,
                "coverage": 0.0,
                "semantic_score": 0.0,
                "feedback": ["❌ Empty or incomplete response."]
            }

        try:
            answer_lower = answer.lower()
            matched_keywords = []
            missing_keywords = []

            # Step 1: Keyword matching with multiple strategies
            for keyword in expected_keywords:
                if self._fuzzy_match(answer_lower, keyword):
                    matched_keywords.append(keyword)
                else:
                    missing_keywords.append(keyword)

            # Step 2: Calculate coverage score
            coverage = len(matched_keywords) / len(expected_keywords) if expected_keywords else 0
            
            # Step 3: Semantic similarity using TF-IDF
            semantic_score = 5.0  # Default baseline
            if expected_keywords and len(answer.split()) > 3:  # Only if answer has enough content
                try:
                    # Use both answer and keywords for better semantic understanding
                    keyword_text = " ".join(expected_keywords)
                    documents = [answer, keyword_text]
                    
                    tfidf_matrix = self.vectorizer.fit_transform(documents)
                    similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
                    
                    # Convert to 0-10 scale with better distribution
                    semantic_score = min(similarity * 12, 10)  # More generous scaling
                except Exception as e:
                    print(f"TF-IDF error: {e}")
                    # Fallback: use coverage as semantic score
                    semantic_score = coverage * 8

            # Step 4: Combine scores with better weighting
            # More weight to semantic understanding, less to exact keyword matching
            base_score = (coverage * 3 + semantic_score * 7) / 10
            
            # Step 5: Length bonus for detailed answers
            word_count = len(answer.split())
            length_bonus = 0
            if word_count > 50:
                length_bonus = 1.5  # Bonus for detailed answers
            elif word_count > 25:
                length_bonus = 1.0
            elif word_count > 15:
                length_bonus = 0.5
            elif word_count < 10:
                length_bonus = -1.0  # Penalty for very short answers

            final_score = max(0, min(10, base_score + length_bonus))

            # Step 6: Generate feedback
            feedback = self._generate_feedback(final_score, coverage, semantic_score, 
                                            matched_keywords, missing_keywords, word_count)

            return {
                "score": round(final_score, 1),
                "matched_keywords": matched_keywords,
                "missing_keywords": missing_keywords[:5],
                "coverage": round(coverage, 2),
                "semantic_score": round(semantic_score, 1),
                "feedback": feedback
            }

        except Exception as e:
            print(f"Content evaluation error: {e}")
            return {
                "score": 5.0,
                "matched_keywords": [],
                "missing_keywords": [],
                "coverage": 0.0,
                "semantic_score": 5.0,
                "feedback": ["✅ Basic content evaluation completed."]
            }

    def _generate_feedback(self, score, coverage, semantic_score, matched, missing, word_count):
        """Generate appropriate feedback based on scores"""
        feedback = []
        
        # Content quality feedback
        if score >= 8:
            feedback.append("✅ Excellent content! Comprehensive and relevant.")
        elif score >= 6:
            feedback.append("⚠️ Good content, could use more depth or examples.")
        else:
            feedback.append("❌ Content needs improvement in relevance and depth.")

        # Coverage feedback
        if coverage >= 0.8:
            feedback.append("✅ Great keyword coverage!")
        elif coverage >= 0.5:
            feedback.append("⚠️ Moderate coverage - include more key concepts.")
        else:
            if missing:
                feedback.append(f"💡 Mention: {', '.join(missing[:3])}")

        # Semantic relevance feedback
        if semantic_score >= 7:
            feedback.append("✅ Strong conceptual alignment with expected topics.")
        elif semantic_score >= 5:
            feedback.append("💡 Good conceptual understanding.")
        else:
            feedback.append("💡 Focus on relating your experience to key concepts.")

        # Length feedback
        if word_count < 15:
            feedback.append("💡 Expand your answer with more details and examples.")
        elif word_count > 100:
            feedback.append("💡 Good detail, but consider being more concise.")

        return feedback[:4]  # Limit to 4 most relevant feedback points

content_evaluator = ContentEvaluator()