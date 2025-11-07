import language_tool_python
import spacy
from textblob import TextBlob
import re

class GrammarChecker:
    def __init__(self):
        try:
            self.tool = language_tool_python.LanguageTool('en-US')
            self.nlp = spacy.load("en_core_web_sm")
        except:
            self.tool = None
            self.nlp = None
    
    def check_grammar(self, text: str) -> dict:
        """Comprehensive grammar checking using multiple free tools"""
        if not text.strip():
            return {"score": 0, "errors": [], "error_count": 0, "feedback": []}
            
        try:
            error_count = 0
            feedback = []
            
            # Method 1: LanguageTool
            if self.tool:
                matches = self.tool.check(text)
                error_count += len(matches)
                feedback.extend([match.message for match in matches[:3]])
            
            # Method 2: spaCy for basic grammar checks
            if self.nlp:
                doc = self.nlp(text)
                
                # Check sentence structure
                sentences = list(doc.sents)
                if len(sentences) > 0:
                    first_sentence = sentences[0]
                    if not first_sentence.text[0].isupper():
                        error_count += 1
                        feedback.append("Sentence should start with capital letter")
                
                # Check for incomplete sentences
                for sent in sentences:
                    if len(sent) < 3:  # Very short sentence
                        error_count += 1
                        feedback.append("Sentence seems incomplete")
            
            # Method 3: TextBlob for spelling
            blob = TextBlob(text)
            corrected = blob.correct()
            if str(corrected) != text:
                error_count += 1
                feedback.append("Possible spelling errors detected")
            
            # Method 4: Regex patterns for common errors
            common_errors = [
                (r'\bi\b', 'I'),  # lowercase 'i'
                (r',\s*,', 'repeated commas'),
                (r'\.\s*\.', 'repeated periods'),
            ]
            
            for pattern, error_msg in common_errors:
                if re.search(pattern, text):
                    error_count += 1
                    feedback.append(f"Found {error_msg}")
            
            # Calculate score
            word_count = len(text.split())
            if word_count > 0:
                error_density = error_count / word_count
                grammar_score = max(0, 10 - (error_density * 20))
            else:
                grammar_score = 5.0
                
            return {
                "score": round(min(grammar_score, 10), 1),
                "errors": feedback[:5],  # Limit to 5 errors
                "error_count": error_count,
                "feedback": feedback[:3]  # Top 3 suggestions
            }
            
        except Exception as e:
            return {
                "score": 5.0,
                "errors": [],
                "error_count": 0,
                "feedback": ["Grammar check temporarily unavailable"]
            }

grammar_checker = GrammarChecker()