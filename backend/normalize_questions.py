# backend/normalize_questions.py

import json
from pathlib import Path

QUESTIONS_PATH = Path(__file__).resolve().parent / "db_models" / "questions.json"

def normalize_question_item(item):
    if isinstance(item, dict):
        return {
            "q": item.get("q") or item.get("question") or str(item),
            "a": item.get("a") or item.get("answer") or item.get("reference")
        }
    else:
        return {"q": str(item), "a": None}

def normalize_questions_file():
    with open(QUESTIONS_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    normalized_data = {}
    for domain, questions in data.items():
        normalized_data[domain] = [normalize_question_item(q) for q in questions]

    with open(QUESTIONS_PATH, "w", encoding="utf-8") as f:
        json.dump(normalized_data, f, indent=4, ensure_ascii=False)

    print(f"✅ questions.json normalized for {len(normalized_data)} domains.")

if __name__ == "__main__":
    normalize_questions_file()
