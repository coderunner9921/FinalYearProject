import re

class FillerWordDetector:
    def __init__(self):
        self.filler_words = {
            'um': 1, 'uh': 1, 'like': 1, 'you know': 2, 'actually': 1,
            'basically': 1, 'literally': 1, 'sort of': 2, 'kind of': 2,
            'i mean': 2, 'well': 1, 'so': 1, 'right': 1, 'okay': 1,
            'ah': 1, 'er': 1, 'hmm': 1, 'anyway': 1, 'whatever': 1
        }
    
    def detect_filler_words(self, text: str) -> dict:
        """Detect filler words and calculate fluency score"""
        if not text.strip():
            return {
                "count": 0, 
                "words": [], 
                "density": 0, 
                "fluency_score": 0,
                "feedback": []
            }
            
        try:
            text_lower = text.lower()
            found_fillers = []
            total_weight = 0
            
            # Detect filler words with weights
            for filler, weight in self.filler_words.items():
                # Use word boundaries for exact matching
                pattern = r'\b' + re.escape(filler) + r'\b'
                matches = re.findall(pattern, text_lower)
                if matches:
                    found_fillers.extend([filler] * len(matches))
                    total_weight += weight * len(matches)
            
            # Calculate metrics
            word_count = len(text.split())
            if word_count > 0:
                density = len(found_fillers) / word_count
                weighted_density = total_weight / word_count
            else:
                density = 0
                weighted_density = 0
            
            # Calculate fluency score (0-10, higher is better)
            base_score = 10 - (weighted_density * 30)  # More penalty for weighted density
            fluency_score = max(0, min(10, base_score))
            
            # Generate feedback
            feedback = []
            if len(found_fillers) == 0:
                feedback.append("✅ Excellent fluency! No filler words detected.")
            elif len(found_fillers) <= 2:
                feedback.append("⚠️ Good fluency with minimal filler words.")
                if found_fillers:
                    feedback.append(f"💡 Watch out for: {', '.join(set(found_fillers)[:2])}")
            else:
                feedback.append("❌ High use of filler words affects fluency.")
                unique_fillers = list(set(found_fillers))
                feedback.append(f"💡 Reduce: {', '.join(unique_fillers[:3])}")
            
            # Pace feedback
            if word_count > 0:
                avg_sentence_length = word_count / max(1, text.count('.') + text.count('!') + text.count('?'))
                if avg_sentence_length < 5:
                    feedback.append("💡 Sentences are quite short. Try connecting ideas.")
                elif avg_sentence_length > 25:
                    feedback.append("💡 Sentences are long. Consider breaking them up.")
            
            return {
                "count": len(found_fillers),
                "words": found_fillers,
                "density": round(density, 3),
                "weighted_density": round(weighted_density, 3),
                "fluency_score": round(fluency_score, 1),
                "feedback": feedback
            }
            
        except Exception as e:
            return {
                "count": 0,
                "words": [],
                "density": 0,
                "weighted_density": 0,
                "fluency_score": 5.0,
                "feedback": ["Fluency analysis unavailable"]
            }

filler_detector = FillerWordDetector()