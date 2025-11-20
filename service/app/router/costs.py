from uuid import UUID
from typing import Optional, List
from enum import Enum
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from app.middleware.auth import get_current_user
from app.models.user import User
from app.repositories.cost_repo import CostRepository
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/costs", tags=["Costs"])

# Frequency enum
class CostFrequency(str, Enum):
    """Frequency options for cost items"""
    ONE_TIME = "one_time"
    MONTHLY = "monthly"
    YEARLY = "yearly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"

# Request/Response Schemas
class CostCreateRequest(BaseModel):
    """Request schema for creating a single cost"""
    title: str = Field(..., min_length=1, max_length=255)
    value: float = Field(..., gt=0)
    category: str = Field(..., min_length=1, max_length=100)
    starts_at: int = Field(..., ge=1)
    end_at: Optional[int] = Field(None, ge=1)
    freq: CostFrequency = Field(...)
    scenario_id: UUID = Field(...)

class CostUpdateRequest(BaseModel):
    """Request schema for updating a cost"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    value: Optional[float] = Field(None, gt=0)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    starts_at: Optional[int] = Field(None, ge=1)
    end_at: Optional[int] = Field(None, ge=1)
    freq: Optional[CostFrequency] = None
    scenario_id: Optional[UUID] = None

class CostBulkCreateRequest(BaseModel):
    """Request schema for bulk creating costs"""
    costs: List[CostCreateRequest] = Field(..., min_length=1)

class CostResponse(BaseModel):
    """Response schema for cost"""
    id: UUID
    title: str
    value: float
    category: str
    starts_at: int
    end_at: Optional[int]
    freq: str
    scenario_id: UUID
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

def _cost_to_dict(cost) -> dict:
    """Helper to convert Cost model to dict"""
    return {
        "id": cost.id,
        "title": cost.title,
        "value": float(cost.value),
        "category": cost.category,
        "starts_at": cost.starts_at,
        "end_at": cost.end_at,
        "freq": cost.freq,
        "scenario_id": cost.scenario_id,
        "created_at": cost.created_at.isoformat(),
        "updated_at": cost.updated_at.isoformat(),
    }

# API Endpoints

@router.post("", response_model=CostResponse, status_code=status.HTTP_201_CREATED)
async def create_cost(
    request: CostCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a single cost item"""
    try:
        logger.info(f"Creating cost: {request.title} for scenario {request.scenario_id}")
        
        cost = await CostRepository.create_cost(
            title=request.title,
            value=request.value,
            category=request.category,
            starts_at=request.starts_at,
            end_at=request.end_at,
            freq=request.freq.value,  # Get enum value
            scenario_id=request.scenario_id
        )
        
        logger.info(f"✅ Cost created: ID={cost.id}")
        return CostResponse(**_cost_to_dict(cost))
        
    except Exception as e:
        logger.error(f"❌ Error creating cost: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating cost: {str(e)}"
        )

@router.post("/bulk", response_model=List[CostResponse], status_code=status.HTTP_201_CREATED)
async def create_costs_bulk(
    request: CostBulkCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """Create multiple cost items in bulk"""
    try:
        logger.info(f"Creating {len(request.costs)} costs in bulk")
        
        costs_data = []
        for cost_req in request.costs:
            costs_data.append({
                "title": cost_req.title,
                "value": cost_req.value,
                "category": cost_req.category,
                "starts_at": cost_req.starts_at,
                "end_at": cost_req.end_at,
                "freq": cost_req.freq.value,  # Get enum value
                "scenario_id": cost_req.scenario_id
            })
        
        costs = await CostRepository.create_costs_bulk(costs_data)
        
        logger.info(f"✅ {len(costs)} costs created")
        return [CostResponse(**_cost_to_dict(cost)) for cost in costs]
        
    except Exception as e:
        logger.error(f"❌ Error creating costs in bulk: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating costs in bulk: {str(e)}"
        )

@router.put("/{cost_id}", response_model=CostResponse, status_code=status.HTTP_200_OK)
async def update_cost(
    cost_id: UUID,
    request: CostUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """Update a cost item"""
    try:
        logger.info(f"Updating cost: {cost_id}")
        
        existing_cost = await CostRepository.get_cost_by_id(cost_id)
        if not existing_cost:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cost with ID {cost_id} not found"
            )
        
        updated_cost = await CostRepository.update_cost(
            cost_id=cost_id,
            title=request.title,
            value=request.value,
            category=request.category,
            starts_at=request.starts_at,
            end_at=request.end_at,
            freq=request.freq.value if request.freq else None,  # Get enum value if provided
            scenario_id=request.scenario_id
        )
        
        if not updated_cost:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cost with ID {cost_id} not found"
            )
        
        logger.info(f"✅ Cost updated: ID={updated_cost.id}")
        return CostResponse(**_cost_to_dict(updated_cost))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating cost: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating cost: {str(e)}"
        )
