from textblob import TextBlob
import re

class SentimentAnalyzer:
    def analyze_sentiment(self, text: str) -> dict:
        """Analyze sentiment using TextBlob (completely free)"""
        try:
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity  # -1 to 1
            subjectivity = blob.sentiment.subjectivity  # 0 to 1
            
            # Convert to confidence score (0-10)
            confidence_score = (polarity + 1) * 5  # Convert -1:1 to 0:10
            
            # Detect confidence indicators
            confidence_indicators = [
                'confident', 'certain', 'definitely', 'absolutely', 'sure',
                'experienced', 'knowledgeable', 'expert'
            ]
            
            nervous_indicators = [
                'maybe', 'perhaps', 'unsure', 'not sure', 'I think', 'probably',
                'kind of', 'sort of', 'a little'
            ]
            
            text_lower = text.lower()
            confidence_boost = sum(1 for word in confidence_indicators if word in text_lower)
            nervous_penalty = sum(1 for word in nervous_indicators if word in text_lower)
            
            # Adjust score based on confidence indicators
            adjusted_score = confidence_score + (confidence_boost * 0.5) - (nervous_penalty * 0.5)
            final_score = max(0, min(10, adjusted_score))
            
            return {
                "label": "POSITIVE" if polarity > 0 else "NEGATIVE" if polarity < 0 else "NEUTRAL",
                "score": polarity,
                "confidence_score": round(final_score, 1),
                "subjectivity": subjectivity
            }
            
        except Exception as e:
            return {
                "label": "NEUTRAL",
                "score": 0,
                "confidence_score": 5.0,
                "subjectivity": 0.5
            }

sentiment_analyzer = SentimentAnalyzer()