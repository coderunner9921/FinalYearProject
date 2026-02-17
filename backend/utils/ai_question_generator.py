import os
import json
import hashlib
from typing import List, Dict, Optional
import requests
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

class AIQuestionGenerator:
    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = "llama-3.1-8b-instant"
        self.base_dir = Path(__file__).parent.parent
        self.questions_file = self.base_dir / "models" / "aptitude_questions.json"
        
    def generate_questions(self, domain: str, count: int = 5, difficulty: str = "medium") -> List[Dict]:
        """
        Generate aptitude questions for a specific domain using AI
        """
        print(f"🤖 AI Generating {count} {difficulty} questions for {domain}")
        
        # Map the category names to what the AI understands
        domain_mapping = {
            "Logical Reasoning": "Logical",
            "Quantitative Aptitude": "Quantitative", 
            "Verbal Ability": "Verbal",
            "Coding Challenge": "Coding"
        }
        
        # Use mapped domain for AI prompt, but store as requested domain
        ai_domain = domain_mapping.get(domain, domain)
        
        prompt = self._build_prompt(ai_domain, count, difficulty)
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a JSON-only generator. Your ONLY output should be a valid JSON array. "
                            "Do NOT include any explanation, comments, text, or markdown outside JSON. "
                            "You are an expert aptitude test creator. Generate high-quality aptitude questions with: "
                            "- Clear question text "
                            "- 4 multiple choice options (A, B, C, D) "
                            "- One correct answer (MUST be A, B, C, or D - NOT numbers) "
                            "- Brief explanation "
                            "Format as JSON array."
                        )
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            print(f"🤖 AI Raw response: {content[:200]}...")
            
            questions = self._parse_ai_response(content)
            
            # VALIDATE questions before formatting
            validated_questions = self._validate_ai_questions(questions)
            
            formatted_questions = self._format_questions(validated_questions, domain, difficulty)
            
            print(f"🤖 AI Generated {len(formatted_questions)} valid questions")
            return formatted_questions
            
        except Exception as e:
            print(f"❌ AI Generation error: {e}")
            # Return fallback questions if AI fails
            return self._get_fallback_questions(domain, count, difficulty)
    
    def _build_prompt(self, domain: str, count: int, difficulty: str) -> str:

        import random
        random_seed = random.randint(1, 1000)
        domain_prompts = {
            "Logical": "logical reasoning, pattern recognition, sequences, analogies, deductive reasoning",
            "Quantitative": "mathematical problems, percentages, ratios, algebra, arithmetic, word problems", 
            "Verbal": "vocabulary, grammar, reading comprehension, verbal analogies, sentence completion",
            "Coding": "programming concepts, algorithms, data structures, code analysis, debugging"
        }
        
        domain_guide = domain_prompts.get(domain, "general aptitude and problem solving")
        
        return f"""
        Generate {count} {difficulty} difficulty aptitude questions for {domain} aptitude testing.
        Random seed: {random_seed}

        Focus on: {domain_guide}

        IMPORTANT: Make each question COMPLETELY DIFFERENT from any other questions you generate.
        Do not reuse similar patterns or slightly modified versions of the same question.

        Return ONLY a JSON array with this exact structure for each question:
        {{
            "question_text": "The clear and concise question text",
            "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
            "correct_answer": "A" (or B/C/D - exactly one letter A, B, C, or D),
            "explanation": "Brief explanation of why this answer is correct"
        }}
        
        CRITICAL RULES:
        - correct_answer MUST be exactly one letter: A, B, C, or D
        - DO NOT use numbers like 1, 2, 3, 4 for correct_answer
        - DO NOT use text answers like 'Option A' for correct_answer
        - Options should be exactly 4 in number
        - Questions should be original and not commonly found in standard test banks
        - Options should be plausible but only one clearly correct
        - Difficulty should match: {difficulty}
        
        Return ONLY the JSON array, no other text or markdown formatting.
        """
    
    def _parse_ai_response(self, content: str) -> List[Dict]:
        """Parse AI response and extract JSON with robust error handling"""
        try:
            # Clean the response more aggressively
            content = content.strip()
            
            # Remove markdown code blocks if present
            lines = content.split('\n')
            cleaned_lines = []
            in_json_block = False
            
            for line in lines:
                line = line.strip()
                if line.startswith('```json'):
                    in_json_block = True
                    continue
                elif line.startswith('```') and in_json_block:
                    in_json_block = False
                    continue
                elif line.startswith('```'):
                    continue
                
                if in_json_block or line:
                    cleaned_lines.append(line)
            
            cleaned_content = '\n'.join(cleaned_lines)
            
            # If still empty, use original content
            if not cleaned_content:
                cleaned_content = content
            
            # Fix common JSON issues
            # 1. Look for the actual JSON array (find the first [ and last ])
            if '[' in cleaned_content and ']' in cleaned_content:
                start = cleaned_content.find('[')
                end = cleaned_content.rfind(']') + 1
                json_str = cleaned_content[start:end]
                
                # 2. Fix trailing commas before } or ]
                import re
                json_str = re.sub(r',\s*}', '}', json_str)
                json_str = re.sub(r',\s*]', ']', json_str)
                
                # 3. Fix unclosed strings by checking for patterns
                # Find all strings and ensure they're properly closed
                lines = json_str.split('\n')
                fixed_lines = []
                for line in lines:
                    # Count quotes in line
                    quote_count = line.count('"')
                    if quote_count % 2 == 1:  # Odd number of quotes
                        # Check if line ends with a comma or is part of a value
                        if line.strip().endswith(','):
                            # Add closing quote before comma
                            line = line.rstrip(',') + '"' + ','
                        elif ': ' in line and line.count('"') == 1:
                            # This is a value that's missing closing quote
                            parts = line.split(': ', 1)
                            if len(parts) == 2:
                                key, value = parts
                                if not value.endswith('"'):
                                    line = f'{key}: {value}"'
                    
                    fixed_lines.append(line)
                
                json_str = '\n'.join(fixed_lines)
                
                # 4. Try parsing with error recovery
                try:
                    return json.loads(json_str)
                except json.JSONDecodeError as e:
                    print(f"JSON decode error at position {e.pos}: {e.msg}")
                    print(f"Context: ...{json_str[max(0, e.pos-50):min(len(json_str), e.pos+50)]}...")
                    
                    # Try to fix by adding missing closing braces/brackets
                    # Count opening vs closing braces/brackets
                    open_braces = json_str.count('{')
                    close_braces = json_str.count('}')
                    open_brackets = json_str.count('[')
                    close_brackets = json_str.count(']')
                    
                    if open_braces > close_braces:
                        json_str += '}' * (open_braces - close_braces)
                    if open_brackets > close_brackets:
                        json_str += ']' * (open_brackets - close_brackets)
                    
                    # Try parsing again
                    try:
                        return json.loads(json_str)
                    except:
                        # Last resort: extract JSON-like objects manually
                        return self._extract_json_objects(json_str)
            
            # If no array found, try to extract objects
            return self._extract_json_objects(cleaned_content)
            
        except Exception as e:
            print(f"Error parsing AI response: {e}")
            print(f"First 500 chars of raw content: {content[:500]}")
            return []
    
    def _extract_json_objects(self, text: str) -> List[Dict]:
        """Extract JSON objects from malformed text"""
        objects = []
        lines = text.split('\n')
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            # Look for object start
            if line.startswith('{'):
                obj_lines = [line]
                brace_count = line.count('{') - line.count('}')
                i += 1
                
                # Collect until braces are balanced
                while i < len(lines) and brace_count > 0:
                    next_line = lines[i].strip()
                    obj_lines.append(next_line)
                    brace_count += next_line.count('{') - next_line.count('}')
                    i += 1
                
                obj_text = '\n'.join(obj_lines)
                
                # Try to parse as JSON
                try:
                    # Fix common issues in object text
                    obj_text = obj_text.replace('\n', ' ').replace('\r', ' ')
                    obj_text = obj_text.replace(', }', ' }').replace(', ]', ' ]')
                    
                    # Ensure it ends properly
                    if not obj_text.endswith('}'):
                        obj_text += '}'
                    
                    obj = json.loads(obj_text)
                    objects.append(obj)
                except:
                    # Skip malformed objects
                    pass
            else:
                i += 1
        
        return objects

    def _format_questions(self, questions: List[Dict], domain: str, difficulty: str) -> List[Dict]:
        """Format questions with additional metadata and validate correct_answer format"""
        formatted_questions = []
        
        for q in questions:
            # Validate and fix correct_answer format
            correct_answer = str(q['correct_answer']).upper().strip()
            
            # Convert numeric answers to letter format (1 -> A, 2 -> B, etc.)
            if correct_answer.isdigit():
                num = int(correct_answer)
                if 1 <= num <= 4:
                    correct_answer = chr(64 + num)  # 1 -> A, 2 -> B, etc.
                else:
                    # Default to A if invalid number
                    correct_answer = 'A'
                    print(f"⚠️ Fixed invalid numeric answer: {q['correct_answer']} -> A")
            
            # Ensure it's a single letter A-D
            if correct_answer not in ['A', 'B', 'C', 'D']:
                # If it's a longer string, try to extract first character
                if len(correct_answer) > 0:
                    first_char = correct_answer[0].upper()
                    if first_char in ['A', 'B', 'C', 'D']:
                        correct_answer = first_char
                    else:
                        # Default to A if invalid
                        correct_answer = 'A'
                        print(f"⚠️ Fixed invalid answer format: {q['correct_answer']} -> A")
                else:
                    correct_answer = 'A'
                    print(f"⚠️ Fixed empty answer -> A")
            
            # Update the question with validated correct_answer
            q['correct_answer'] = correct_answer
            
            # Generate unique ID based on content
            question_hash = hashlib.md5(
                f"{q['question_text']}{domain}{difficulty}".encode()
            ).hexdigest()[:10]
            
            formatted_questions.append({
                "id": int(question_hash, 16) % 100000,
                "category": domain,
                "subcategory": self._determine_subcategory(q['question_text'], domain),
                "difficulty": difficulty,
                "question_text": q['question_text'],
                "options": q['options'],
                "correct_answer": correct_answer,
                "explanation": q.get('explanation', 'Explanation not available'),
                "source": "ai_generated",
                "time_limit": self._get_time_limit(difficulty)
            })
        
        return formatted_questions
    
    def _validate_ai_questions(self, questions: List[Dict]) -> List[Dict]:
        """Validate and fix AI-generated questions before saving"""
        validated_questions = []
        
        for q in questions:
            # Skip if missing required fields
            if not all(key in q for key in ['question_text', 'options', 'correct_answer']):
                print(f"❌ AI question missing required fields: {q}")
                continue
            
            # Fix correct_answer format
            correct_answer = str(q['correct_answer']).upper().strip()
            
            # Handle numeric answers (1 -> A, 2 -> B, etc.)
            if correct_answer.isdigit():
                num = int(correct_answer)
                if 1 <= num <= 4:
                    correct_answer = chr(64 + num)  # 1 -> A, 2 -> B, etc.
                    print(f"🔧 Converted numeric answer {q['correct_answer']} -> {correct_answer}")
                else:
                    correct_answer = 'A'
                    print(f"⚠️ Invalid numeric answer {q['correct_answer']} -> A")
            
            # Ensure it's a single letter A-D
            if correct_answer not in ['A', 'B', 'C', 'D']:
                # Try to extract first character
                if len(correct_answer) > 0:
                    first_char = correct_answer[0].upper()
                    if first_char in ['A', 'B', 'C', 'D']:
                        correct_answer = first_char
                        print(f"🔧 Extracted answer {q['correct_answer']} -> {correct_answer}")
                    else:
                        correct_answer = 'A'
                        print(f"⚠️ Invalid answer format {q['correct_answer']} -> A")
                else:
                    correct_answer = 'A'
                    print(f"⚠️ Empty answer -> A")
            
            q['correct_answer'] = correct_answer
            
            # Validate options
            if not isinstance(q['options'], list) or len(q['options']) != 4:
                print(f"❌ AI question has invalid options: {q['options']}")
                continue
            
            validated_questions.append(q)
        
        print(f"✅ Validated {len(validated_questions)}/{len(questions)} AI questions")
        return validated_questions
    
    def _determine_subcategory(self, question_text: str, domain: str) -> str:
        """Determine subcategory based on question content and domain"""
        text_lower = question_text.lower()
        
        if domain == "Logical Reasoning":
            if any(word in text_lower for word in ['pattern', 'sequence', 'series']):
                return "Pattern Recognition"
            elif any(word in text_lower for word in ['analogy', 'similar', 'relationship']):
                return "Verbal Analogies"
            elif any(word in text_lower for word in ['deductive', 'conclusion', 'premise']):
                return "Deductive Reasoning"
            else:
                return "Logical Puzzles"
                
        elif domain == "Quantitative Aptitude":
            if any(word in text_lower for word in ['percent', 'percentage']):
                return "Percentages"
            elif any(word in text_lower for word in ['ratio', 'proportion']):
                return "Ratios"
            elif any(word in text_lower for word in ['algebra', 'equation', 'solve for']):
                return "Algebra"
            elif any(word in text_lower for word in ['geometry', 'angle', 'area', 'volume']):
                return "Geometry"
            else:
                return "Arithmetic"
                
        elif domain == "Verbal Ability":
            if any(word in text_lower for word in ['synonym', 'antonym', 'meaning']):
                return "Vocabulary"
            elif any(word in text_lower for word in ['grammar', 'sentence', 'correct']):
                return "Grammar"
            elif any(word in text_lower for word in ['passage', 'comprehension', 'read']):
                return "Reading Comprehension"
            else:
                return "Verbal Reasoning"
                
        elif domain == "Coding Challenge":
            if any(word in text_lower for word in ['output', 'print', 'console']):
                return "Code Output"
            elif any(word in text_lower for word in ['algorithm', 'complexity', 'efficiency']):
                return "Algorithms"
            elif any(word in text_lower for word in ['bug', 'error', 'debug']):
                return "Debugging"
            else:
                return "Programming Concepts"
                
        else:
            return "General"
    
    def _get_time_limit(self, difficulty: str) -> int:
        """Get time limit based on difficulty"""
        limits = {
            "easy": 45,
            "medium": 60,
            "hard": 75
        }
        return limits.get(difficulty, 60)

    def generate_sjt_scenarios(self, category: str, count: int = 3) -> List[Dict]:
        """
        Generate Situational Judgement Test scenarios using AI
        """
        print(f"🤖 AI Generating {count} SJT scenarios for {category}")
        
        prompt = self._build_sjt_prompt(category, count)
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a JSON-only generator. Your ONLY output should be a valid JSON array. "
                            "You are an expert workplace psychologist creating realistic workplace scenarios. "
                            "Generate high-quality situational judgement test scenarios with: "
                            "- Realistic workplace scenario text "
                            "- 4 multiple choice options for responses "
                            "- Most effective response (MUST be A, B, C, or D) "
                            "- Least effective response (MUST be A, B, C, or D - different from most effective) "
                            "- Clear explanation of why each is effective/ineffective "
                            "Format as JSON array."
                        )
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            content = response.choices[0].message.content
            print(f"🤖 AI SJT Raw response: {content[:200]}...")
            
            scenarios = self._parse_ai_response(content)
            
            # Validate scenarios before formatting
            validated_scenarios = self._validate_sjt_scenarios(scenarios)
            
            formatted_scenarios = self._format_sjt_scenarios(validated_scenarios, category)
            
            print(f"🤖 AI Generated {len(formatted_scenarios)} valid SJT scenarios")
            return formatted_scenarios
            
        except Exception as e:
            print(f"❌ AI SJT Generation error: {e}")
            # Return fallback scenarios if AI fails
            return self._get_fallback_sjt_scenarios(category, count)

    def _build_sjt_prompt(self, category: str, count: int) -> str:
        """Build prompt for SJT scenario generation"""
        
        category_guides = {
            "Teamwork": "team collaboration, peer relationships, group dynamics, cooperation",
            "Leadership": "managing teams, decision making, delegation, motivation, vision",
            "Problem Solving": "analytical thinking, troubleshooting, root cause analysis, solution evaluation",
            "Communication": "listening, clarity, feedback delivery, difficult conversations, presentation",
            "Ethics": "integrity, confidentiality, compliance, moral dilemmas, professional conduct",
            "Conflict Resolution": "mediation, negotiation, de-escalation, finding common ground",
            "Time Management": "prioritization, meeting deadlines, multitasking, efficiency",
            "Adaptability": "handling change, learning new skills, flexibility, resilience",
            "Customer Service": "client relations, handling complaints, service excellence, empathy"
        }
        
        category_guide = category_guides.get(category, "workplace situations and professional judgment")
        
        return f"""
        Generate {count} situational judgement test scenarios for workplace {category}.
        
        Focus on: {category_guide}
        
        Return ONLY a JSON array with this exact structure for each scenario:
        {{
            "scenario_text": "A realistic workplace scenario describing a situation requiring judgment",
            "options": [
                "Option A: First possible response or action",
                "Option B: Second possible response or action", 
                "Option C: Third possible response or action",
                "Option D: Fourth possible response or action"
            ],
            "most_effective": "A" (or B/C/D - exactly one letter A, B, C, or D),
            "least_effective": "B" (or A/C/D - exactly one letter different from most_effective),
            "explanation": "Clear explanation of why the most effective option works best and why the least effective is problematic. Mention professional workplace principles."
        }}
        
        CRITICAL RULES:
        - most_effective and least_effective MUST be exactly one letter: A, B, C, or D
        - They MUST be different letters (can't have same answer for both)
        - Options should be exactly 4 in number, each starting with "Option X: "
        - Scenarios should be realistic workplace situations
        - Options should represent different approaches (some good, some bad)
        - Explanation should reference professional workplace standards
        
        Return ONLY the JSON array, no other text or markdown formatting.
        """

    def _validate_sjt_scenarios(self, scenarios: List[Dict]) -> List[Dict]:
        """Validate and fix AI-generated SJT scenarios"""
        validated_scenarios = []
        
        for scenario in scenarios:
            # Skip if missing required fields
            if not all(key in scenario for key in ['scenario_text', 'options', 'most_effective', 'least_effective']):
                print(f"❌ SJT scenario missing required fields: {scenario}")
                continue
            
            # Fix most_effective format
            most_effective = str(scenario['most_effective']).upper().strip()
            if most_effective not in ['A', 'B', 'C', 'D']:
                if len(most_effective) > 0:
                    first_char = most_effective[0].upper()
                    if first_char in ['A', 'B', 'C', 'D']:
                        most_effective = first_char
                    else:
                        most_effective = 'A'
                else:
                    most_effective = 'A'
            
            # Fix least_effective format
            least_effective = str(scenario['least_effective']).upper().strip()
            if least_effective not in ['A', 'B', 'C', 'D']:
                if len(least_effective) > 0:
                    first_char = least_effective[0].upper()
                    if first_char in ['A', 'B', 'C', 'D']:
                        least_effective = first_char
                    else:
                        least_effective = 'B' if most_effective != 'B' else 'C'
                else:
                    least_effective = 'B' if most_effective != 'B' else 'C'
            
            # Ensure they're different
            if most_effective == least_effective:
                # Pick a different least effective
                options = ['A', 'B', 'C', 'D']
                options.remove(most_effective)
                least_effective = options[0]
            
            # Validate options
            if not isinstance(scenario['options'], list) or len(scenario['options']) != 4:
                print(f"❌ SJT scenario has invalid options: {scenario['options']}")
                continue
            
            # Update with validated values
            scenario['most_effective'] = most_effective
            scenario['least_effective'] = least_effective
            
            validated_scenarios.append(scenario)
        
        print(f"✅ Validated {len(validated_scenarios)}/{len(scenarios)} SJT scenarios")
        return validated_scenarios

    def _format_sjt_scenarios(self, scenarios: List[Dict], category: str) -> List[Dict]:
        """Format SJT scenarios with additional metadata"""
        formatted_scenarios = []
        
        for scenario in scenarios:
            # Ensure options have proper format
            options = scenario['options']
            formatted_options = []
            for i, option in enumerate(options):
                if not option.startswith(f"Option {chr(65 + i)}: "):
                    formatted_options.append(f"Option {chr(65 + i)}: {option}")
                else:
                    formatted_options.append(option)
            
            formatted_scenarios.append({
                "scenario_text": scenario['scenario_text'],
                "options": formatted_options,
                "most_effective": scenario['most_effective'],
                "least_effective": scenario['least_effective'],
                "explanation": scenario.get('explanation', 'Professional judgment required in this situation.'),
                "category": category,
                "source": "ai_generated"
            })
        
        return formatted_scenarios

    def _get_fallback_sjt_scenarios(self, category: str, count: int) -> List[Dict]:
        """Get fallback SJT scenarios if AI fails"""
        fallback_scenarios = {
            "Teamwork": [
                {
                    "scenario_text": "Your team is working on a tight deadline. A team member consistently misses deadlines, affecting the entire project. What would you do?",
                    "options": [
                        "Option A: Report them to management immediately without discussion",
                        "Option B: Have a private conversation to understand their challenges",
                        "Option C: Take over their work to ensure the deadline is met",
                        "Option D: Ignore it and hope they improve on their own"
                    ],
                    "most_effective": "B",
                    "least_effective": "D",
                    "explanation": "A private conversation shows empathy while addressing the issue, while ignoring it is least effective."
                }
            ],
            "Leadership": [
                {
                    "scenario_text": "As a new team lead, you notice a skilled but quiet team member being overlooked in meetings. What approach would you take?",
                    "options": [
                        "Option A: Call on them directly during meetings to share their ideas",
                        "Option B: Assume they prefer to work quietly and not disturb them",
                        "Option C: Assign them more individual work instead of team tasks",
                        "Option D: Discuss with them privately about ways they can contribute"
                    ],
                    "most_effective": "D",
                    "least_effective": "B",
                    "explanation": "A private discussion respects their preferences while encouraging participation."
                }
            ]
        }
        
        # Get scenarios for the category, repeat if needed
        scenarios = fallback_scenarios.get(category, [])
        while len(scenarios) < count and scenarios:
            scenarios.append(scenarios[0])
        
        # Add metadata
        for scenario in scenarios:
            scenario.update({
                "category": category,
                "source": "manual_fallback"
            })
        
        return scenarios[:count]
    
    def _get_fallback_questions(self, domain: str, count: int, difficulty: str) -> List[Dict]:
        """Get fallback questions if AI fails"""
        fallback_questions = {
            "Logical Reasoning": [
                {
                    "question_text": "What comes next in the sequence: 2, 4, 6, 8, ?",
                    "options": ["9", "10", "12", "14"],
                    "correct_answer": "B",
                    "explanation": "The sequence increases by 2 each time."
                }
            ],
            "Quantitative Aptitude": [
                {
                    "question_text": "What is 15% of 200?",
                    "options": ["15", "30", "25", "20"],
                    "correct_answer": "B",
                    "explanation": "15% of 200 = 0.15 × 200 = 30"
                }
            ],
            "Verbal Ability": [
                {
                    "question_text": "Choose the correctly spelled word:",
                    "options": ["Accomodate", "Acommodate", "Accommodate", "Acomodate"],
                    "correct_answer": "C",
                    "explanation": "Accommodate has double 'c' and double 'm'"
                }
            ],
            "Coding Challenge": [
                {
                    "question_text": "Which data structure uses LIFO (Last In First Out)?",
                    "options": ["Queue", "Stack", "Array", "Linked List"],
                    "correct_answer": "B",
                    "explanation": "Stack uses LIFO principle while Queue uses FIFO"
                }
            ]
        }
        
        questions = fallback_questions.get(domain, [])
        
        # Repeat questions if needed to reach count
        while len(questions) < count and questions:
            questions.append(questions[0])
        
        # Format with proper metadata
        formatted_questions = []
        for q in questions[:count]:
            formatted_questions.append({
                "category": domain,
                "subcategory": "General",
                "difficulty": difficulty,
                "question_text": q["question_text"],
                "options": q["options"],
                "correct_answer": q["correct_answer"],
                "explanation": q.get("explanation", ""),
                "time_limit": 60
            })
        
        return formatted_questions