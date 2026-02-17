# backend/utils/sjt_manager.py
"""
SJT (Situational Judgement Test) Manager
Handles generation and management of SJT scenarios
"""

import random
from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from db_models import SJTScenario
from .ai_question_generator import AIQuestionGenerator


class SJTManager:
    def __init__(self):
        self.ai_generator = AIQuestionGenerator()
        print("✅ SJT Manager initialized")
    
    async def get_scenarios_by_category(self, db: AsyncSession, category: str = None, count: int = 10) -> List[Dict]:
        """
        Get SJT scenarios from database, generating new ones if needed
        """
        print(f"🔧 Getting {count} SJT scenarios for category: {category or 'all'}")
        
        try:
            # Build query
            if category:
                query = select(SJTScenario).where(
                    SJTScenario.category == category
                ).limit(count * 2)
            else:
                query = select(SJTScenario).limit(count * 2)
            
            result = await db.execute(query)
            available_scenarios = result.scalars().all()
            
            print(f"🔧 Found {len(available_scenarios)} SJT scenarios in database")
            
            # If not enough scenarios, generate more
            if len(available_scenarios) < count:
                needed = count - len(available_scenarios)
                print(f"🔄 Need {needed} more SJT scenarios, generating via AI...")
                
                # Determine category for generation
                gen_category = category or random.choice(["Teamwork", "Leadership", "Problem Solving", "Communication", "Ethics"])
                
                # Generate new scenarios
                await self._generate_and_save_scenarios(db, gen_category, needed)
                
                # Re-query to get all scenarios including new ones
                if category:
                    query = select(SJTScenario).where(
                        SJTScenario.category == category
                    ).limit(count * 2)
                else:
                    query = select(SJTScenario).limit(count * 2)
                
                result = await db.execute(query)
                available_scenarios = result.scalars().all()
                print(f"✅ Now have {len(available_scenarios)} total SJT scenarios")
            
            # Select final scenarios randomly
            if len(available_scenarios) > count:
                selected_scenarios = random.sample(available_scenarios, count)
            else:
                selected_scenarios = available_scenarios
            
            print(f"✅ Returning {len(selected_scenarios)} SJT scenarios")
            
            # Convert to dict format for frontend
            return [self._scenario_to_dict(s) for s in selected_scenarios]
            
        except Exception as e:
            print(f"❌ Error in get_scenarios_by_category: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    async def _generate_and_save_scenarios(self, db: AsyncSession, category: str, count: int) -> bool:
        """Generate new SJT scenarios using AI and save to database"""
        try:
            print(f"🤖 Generating {count} new SJT scenarios for {category}")
            
            # Generate scenarios via AI
            new_scenarios = self.ai_generator.generate_sjt_scenarios(category, count)
            
            if not new_scenarios:
                print("❌ AI generator returned no SJT scenarios")
                return False
            
            saved_count = 0
            for s_data in new_scenarios:
                # Check if scenario already exists
                result = await db.execute(
                    select(SJTScenario).where(
                        SJTScenario.scenario_text == s_data["scenario_text"]
                    )
                )
                existing_scenario = result.scalars().first()
                
                if existing_scenario:
                    print(f"⚠️ SJT scenario already exists in DB: {existing_scenario.id}")
                else:
                    # Create new database entry
                    from datetime import datetime
                    scenario = SJTScenario(
                        scenario_text=s_data["scenario_text"],
                        options=s_data["options"],
                        most_effective=s_data["most_effective"],
                        least_effective=s_data["least_effective"],
                        explanation=s_data.get("explanation", ""),
                        category=s_data["category"]
                    )
                    db.add(scenario)
                    await db.commit()  # Commit each to avoid session issues
                    await db.refresh(scenario)
                    saved_count += 1
                    print(f"✅ Saved new SJT scenario to DB: {scenario.id}")
            
            print(f"🎉 Saved {saved_count} new SJT scenarios")
            return saved_count > 0
            
        except Exception as e:
            await db.rollback()
            print(f"❌ Error generating/saving SJT scenarios: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def _scenario_to_dict(self, scenario) -> Dict:
        """Convert SQLAlchemy SJT scenario object to dict"""
        return {
            "id": scenario.id,
            "scenario_text": scenario.scenario_text,
            "options": scenario.options,
            "most_effective": scenario.most_effective,
            "least_effective": scenario.least_effective,
            "explanation": scenario.explanation,
            "category": scenario.category,
            "source": "database"
        }
    
    async def get_all_categories(self, db: AsyncSession) -> List[str]:
        """Get list of all available SJT categories from database"""
        result = await db.execute(
            select(SJTScenario.category).distinct()
        )
        categories = [row[0] for row in result.all()]
        
        # If no categories found, return default categories
        if not categories:
            categories = ["Teamwork", "Leadership", "Problem Solving", "Communication", "Ethics"]
        
        print(f"🌐 Available SJT categories in DB: {categories}")
        return categories
    
    async def get_scenario_stats(self, db: AsyncSession) -> Dict:
        """Get statistics about SJT scenarios in database"""
        # Total scenarios
        total_result = await db.execute(select(func.count(SJTScenario.id)))
        total_scenarios = total_result.scalar()
        
        # Scenarios by category
        category_result = await db.execute(
            select(SJTScenario.category, func.count(SJTScenario.id))
            .group_by(SJTScenario.category)
        )
        categories = {row[0]: row[1] for row in category_result.all()}
        
        stats = {
            "total_scenarios": total_scenarios,
            "categories": categories
        }
        
        print(f"📊 SJT Database stats: {total_scenarios} total scenarios")
        return stats