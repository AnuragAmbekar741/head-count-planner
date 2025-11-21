from uuid import UUID
from typing import Optional, List
from enum import Enum
from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel, Field
from app.middleware.auth import get_current_user
from app.models.user import User
from app.repositories.revenue_repo import RevenueRepository
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/revenues", tags=["Revenues"])

# Frequency enum (same as costs)
class RevenueFrequency(str, Enum):
    """Frequency options for revenue items"""
    ONE_TIME = "one_time"
    MONTHLY = "monthly"
    YEARLY = "yearly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"

# Request/Response Schemas
class RevenueCreateRequest(BaseModel):
    """Request schema for creating a single revenue"""
    title: str = Field(..., min_length=1, max_length=255)
    value: float = Field(..., gt=0)
    category: Optional[str] = Field(None, max_length=100)
    starts_at: int = Field(..., ge=1)
    end_at: Optional[int] = Field(None, ge=1)
    freq: RevenueFrequency = Field(...)
    scenario_id: UUID = Field(...)
    is_active: bool = Field(default=True)

class RevenueUpdateRequest(BaseModel):
    """Request schema for updating a revenue"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    value: Optional[float] = Field(None, gt=0)
    category: Optional[str] = Field(None, max_length=100)
    starts_at: Optional[int] = Field(None, ge=1)
    end_at: Optional[int] = Field(None, ge=1)
    freq: Optional[RevenueFrequency] = None
    scenario_id: Optional[UUID] = None
    is_active: Optional[bool] = None

class RevenueBulkCreateRequest(BaseModel):
    """Request schema for bulk creating revenues"""
    revenues: List[RevenueCreateRequest] = Field(..., min_length=1)

class RevenueResponse(BaseModel):
    """Response schema for revenue"""
    id: UUID
    title: str
    value: float
    category: Optional[str]
    starts_at: int
    end_at: Optional[int]
    freq: str
    is_active: bool
    scenario_id: UUID
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

def _revenue_to_dict(revenue) -> dict:
    """Helper to convert Revenue model to dict"""
    return {
        "id": revenue.id,
        "title": revenue.title,
        "value": float(revenue.value),
        "category": revenue.category,
        "starts_at": revenue.starts_at,
        "end_at": revenue.end_at,
        "freq": revenue.freq,
        "is_active": revenue.is_active,
        "scenario_id": revenue.scenario_id,
        "created_at": revenue.created_at.isoformat(),
        "updated_at": revenue.updated_at.isoformat(),
    }

# API Endpoints

@router.post("", response_model=RevenueResponse, status_code=status.HTTP_201_CREATED)
async def create_revenue(
    request: RevenueCreateRequest,
    _current_user: User = Depends(get_current_user)
):
    """Create a single revenue item"""
    try:
        logger.info(f"Creating revenue: {request.title} for scenario {request.scenario_id}")
        
        revenue = await RevenueRepository.create_revenue(
            title=request.title,
            value=request.value,
            category=request.category,
            starts_at=request.starts_at,
            end_at=request.end_at,
            freq=request.freq.value,
            scenario_id=request.scenario_id,
            is_active=request.is_active
        )
        
        return _revenue_to_dict(revenue)
    except Exception as e:
        logger.error(f"Error creating revenue: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create revenue: {str(e)}"
        )

@router.post("/bulk", response_model=List[RevenueResponse], status_code=status.HTTP_201_CREATED)
async def create_revenues_bulk(
    request: RevenueBulkCreateRequest,
    _current_user: User = Depends(get_current_user)
):
    """Create multiple revenue items in bulk"""
    try:
        logger.info(f"Creating {len(request.revenues)} revenues in bulk")
        
        revenues_data = []
        for rev in request.revenues:
            revenues_data.append({
                "title": rev.title,
                "value": rev.value,
                "category": rev.category,
                "starts_at": rev.starts_at,
                "end_at": rev.end_at,
                "freq": rev.freq.value,
                "scenario_id": rev.scenario_id,
                "is_active": rev.is_active,
            })
        
        revenues = await RevenueRepository.create_revenues_bulk(revenues_data)
        
        return [_revenue_to_dict(rev) for rev in revenues]
    except Exception as e:
        logger.error(f"Error creating revenues in bulk: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create revenues: {str(e)}"
        )

@router.get("", response_model=List[RevenueResponse])
async def get_revenues(
    scenario_id: Optional[UUID] = Query(None, description="Filter by scenario ID"),
    _current_user: User = Depends(get_current_user)
):
    """Get all revenues, optionally filtered by scenario"""
    try:
        if scenario_id:
            revenues = await RevenueRepository.get_revenues_by_scenario(scenario_id)
        else:
            revenues = await RevenueRepository.get_all_revenues()
        
        return [_revenue_to_dict(rev) for rev in revenues]
    except Exception as e:
        logger.error(f"Error fetching revenues: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch revenues: {str(e)}"
        )

@router.get("/{revenue_id}", response_model=RevenueResponse)
async def get_revenue(
    revenue_id: UUID,
    _current_user: User = Depends(get_current_user)
):
    """Get a single revenue by ID"""
    try:
        revenue = await RevenueRepository.get_revenue_by_id(revenue_id)
        if not revenue:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Revenue not found"
            )
        return _revenue_to_dict(revenue)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching revenue: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch revenue: {str(e)}"
        )

@router.put("/{revenue_id}", response_model=RevenueResponse)
async def update_revenue(
    revenue_id: UUID,
    request: RevenueUpdateRequest,
    _current_user: User = Depends(get_current_user)
):
    """Update a revenue item"""
    try:
        revenue = await RevenueRepository.update_revenue(
            revenue_id=revenue_id,
            title=request.title,
            value=request.value,
            category=request.category,
            starts_at=request.starts_at,
            end_at=request.end_at,
            freq=request.freq.value if request.freq else None,
            scenario_id=request.scenario_id,
            is_active=request.is_active
        )
        
        if not revenue:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Revenue not found"
            )
        
        return _revenue_to_dict(revenue)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating revenue: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update revenue: {str(e)}"
        )

@router.delete("/{revenue_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_revenue(
    revenue_id: UUID,
    _current_user: User = Depends(get_current_user)
):
    """Delete a revenue item"""
    try:
        revenue = await RevenueRepository.get_revenue_by_id(revenue_id)
        if not revenue:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Revenue not found"
            )
        
        await revenue.delete()
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting revenue: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete revenue: {str(e)}"
        )
