from typing import Optional, List
from uuid import UUID
from tortoise.exceptions import DoesNotExist
from app.models.revenue import Revenue
from app.models.scenario import Scenario

class RevenueRepository:
    """Repository for Revenue model operations"""

    @staticmethod
    async def create_revenue(
        title: str,
        value: float,
        starts_at: int,
        freq: str,
        scenario_id: UUID,
        category: Optional[str] = None,
        end_at: Optional[int] = None,
        is_active: bool = True
    ) -> Revenue:
        """Create a new revenue item"""
        # Get scenario to ensure it exists
        scenario = await Scenario.get(id=scenario_id)
        
        revenue = await Revenue.create(
            title=title,
            value=value,
            category=category,
            starts_at=starts_at,
            end_at=end_at,
            freq=freq,
            is_active=is_active,
            scenario=scenario
        )
        return revenue

    @staticmethod
    async def get_revenue_by_id(revenue_id: UUID) -> Optional[Revenue]:
        """Get revenue by ID"""
        try:
            return await Revenue.get(id=revenue_id)
        except DoesNotExist:
            return None

    @staticmethod
    async def update_revenue(
        revenue_id: UUID,
        title: Optional[str] = None,
        value: Optional[float] = None,
        category: Optional[str] = None,
        starts_at: Optional[int] = None,
        end_at: Optional[int] = None,
        freq: Optional[str] = None,
        scenario_id: Optional[UUID] = None,
        is_active: Optional[bool] = None
    ) -> Optional[Revenue]:
        """Update a revenue item"""
        try:
            revenue = await Revenue.get(id=revenue_id)
            
            if title is not None:
                revenue.title = title
            if value is not None:
                revenue.value = value
            if category is not None:
                revenue.category = category
            if starts_at is not None:
                revenue.starts_at = starts_at
            if end_at is not None:
                revenue.end_at = end_at
            if freq is not None:
                revenue.freq = freq
            if is_active is not None:
                revenue.is_active = is_active
            if scenario_id is not None:
                scenario = await Scenario.get(id=scenario_id)
                revenue.scenario = scenario
            
            await revenue.save()
            return revenue
        except DoesNotExist:
            return None

    @staticmethod
    async def create_revenues_bulk(revenues_data: List[dict]) -> List[Revenue]:
        """Create multiple revenue items in bulk"""
        revenues = []
        for revenue_data in revenues_data:
            # Convert scenario_id to scenario object
            if "scenario_id" in revenue_data:
                scenario_id = revenue_data.pop("scenario_id")
                scenario = await Scenario.get(id=scenario_id)
                revenue_data["scenario"] = scenario
            
            revenue = await Revenue.create(**revenue_data)
            revenues.append(revenue)
        return revenues

    @staticmethod
    async def get_revenues_by_scenario(scenario_id: UUID) -> List[Revenue]:
        """Get all revenues for a scenario"""
        return await Revenue.filter(scenario_id=scenario_id).all()

    @staticmethod
    async def get_all_revenues() -> List[Revenue]:
        """Get all revenues"""
        return await Revenue.all()
