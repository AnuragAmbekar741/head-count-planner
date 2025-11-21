from typing import Optional, List
from uuid import UUID
from tortoise.exceptions import DoesNotExist
from app.models.cost import Cost
from app.models.scenario import Scenario

class CostRepository:
    """Repository for Cost model operations"""

    @staticmethod
    async def create_cost(
        title: str,
        value: float,
        category: str,
        starts_at: int,
        freq: str,
        scenario_id: UUID,
        end_at: Optional[int] = None,
        is_active: bool = True  # Add this parameter
    ) -> Cost:
        """Create a new cost item"""
        # Get scenario to ensure it exists
        scenario = await Scenario.get(id=scenario_id)
        
        cost = await Cost.create(
            title=title,
            value=value,
            category=category,
            starts_at=starts_at,
            end_at=end_at,
            freq=freq,
            is_active=is_active,  # Add this field
            scenario=scenario  # Use foreign key relationship
        )
        return cost

    @staticmethod
    async def get_cost_by_id(cost_id: UUID) -> Optional[Cost]:
        """Get cost by ID"""
        try:
            return await Cost.get(id=cost_id)
        except DoesNotExist:
            return None

    @staticmethod
    async def update_cost(
        cost_id: UUID,
        title: Optional[str] = None,
        value: Optional[float] = None,
        category: Optional[str] = None,
        starts_at: Optional[int] = None,
        end_at: Optional[int] = None,
        freq: Optional[str] = None,
        scenario_id: Optional[UUID] = None,
        is_active: Optional[bool] = None  # Add this parameter
    ) -> Optional[Cost]:
        """Update a cost item"""
        try:
            cost = await Cost.get(id=cost_id)
            
            if title is not None:
                cost.title = title
            if value is not None:
                cost.value = value
            if category is not None:
                cost.category = category
            if starts_at is not None:
                cost.starts_at = starts_at
            if end_at is not None:
                cost.end_at = end_at
            if freq is not None:
                cost.freq = freq
            if is_active is not None:  # Add this condition
                cost.is_active = is_active
            if scenario_id is not None:
                scenario = await Scenario.get(id=scenario_id)
                cost.scenario = scenario
            
            await cost.save()
            return cost
        except DoesNotExist:
            return None

    @staticmethod
    async def create_costs_bulk(costs_data: List[dict]) -> List[Cost]:
        """Create multiple cost items in bulk"""
        costs = []
        for cost_data in costs_data:
            # Convert scenario_id to scenario object
            if "scenario_id" in cost_data:
                scenario_id = cost_data.pop("scenario_id")
                scenario = await Scenario.get(id=scenario_id)
                cost_data["scenario"] = scenario
            
            cost = await Cost.create(**cost_data)
            costs.append(cost)
        return costs

    @staticmethod
    async def get_costs_by_scenario(scenario_id: UUID) -> List[Cost]:
        """Get all costs for a scenario"""
        return await Cost.filter(scenario_id=scenario_id).all()

    @staticmethod
    async def get_all_costs() -> List[Cost]:
        """Get all costs"""
        return await Cost.all()
