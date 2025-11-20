from typing import Optional, List
from uuid import UUID
from tortoise.exceptions import DoesNotExist
from app.models.scenario import Scenario

class ScenarioRepository:
    """Repository for Scenario model operations"""

    @staticmethod
    async def create_scenario(
        name: str,
        description: Optional[str] = None
    ) -> Scenario:
        """Create a new scenario"""
        scenario = await Scenario.create(
            name=name,
            description=description
        )
        return scenario

    @staticmethod
    async def get_scenario_by_id(scenario_id: UUID) -> Optional[Scenario]:
        """Get scenario by ID"""
        try:
            return await Scenario.get(id=scenario_id)
        except DoesNotExist:
            return None

    @staticmethod
    async def get_all_scenarios() -> List[Scenario]:
        """Get all scenarios"""
        return await Scenario.all()

    @staticmethod
    async def update_scenario(
        scenario_id: UUID,
        name: Optional[str] = None,
        description: Optional[str] = None
    ) -> Optional[Scenario]:
        """Update a scenario"""
        try:
            scenario = await Scenario.get(id=scenario_id)
            
            if name is not None:
                scenario.name = name
            if description is not None:
                scenario.description = description
            
            await scenario.save()
            return scenario
        except DoesNotExist:
            return None

    @staticmethod
    async def delete_scenario(scenario_id: UUID) -> bool:
        """Delete a scenario (cascade deletes related costs)"""
        try:
            scenario = await Scenario.get(id=scenario_id)
            await scenario.delete()
            return True
        except DoesNotExist:
            return False
