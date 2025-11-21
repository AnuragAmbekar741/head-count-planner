from uuid import UUID
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from app.middleware.auth import get_current_user
from app.models.user import User
from app.repositories.scenario_repo import ScenarioRepository
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])

# Request/Response Schemas
class ScenarioCreateRequest(BaseModel):
    """Request schema for creating a scenario"""
    name: str = Field(..., min_length=1, max_length=255, description="Scenario name")
    description: Optional[str] = Field(None, description="Scenario description")
    funding: Optional[float] = Field(None, ge=0, description="Scenario funding")
    revenue: Optional[float] = Field(None, ge=0, description="Scenario revenue")  # Add this field

class ScenarioUpdateRequest(BaseModel):
    """Request schema for updating a scenario"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    funding: Optional[float] = Field(None, ge=0)
    revenue: Optional[float] = Field(None, ge=0)  # Add this field

class ScenarioResponse(BaseModel):
    """Response schema for scenario"""
    id: UUID
    name: str
    description: Optional[str]
    funding: Optional[float]
    revenue: Optional[float]  # Add this field
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

def _scenario_to_dict(scenario) -> dict:
    """Helper to convert Scenario model to dict"""
    return {
        "id": scenario.id,
        "name": scenario.name,
        "description": scenario.description,
        "funding": float(scenario.funding) if scenario.funding else None,
        "revenue": float(scenario.revenue) if scenario.revenue else None,  # Add this field
        "created_at": scenario.created_at.isoformat(),
        "updated_at": scenario.updated_at.isoformat(),
    }

# API Endpoints

@router.post("", response_model=ScenarioResponse, status_code=status.HTTP_201_CREATED)
async def create_scenario(
    request: ScenarioCreateRequest,
    _current_user: User = Depends(get_current_user)
):
    """Create a new scenario"""
    try:
        logger.info(f"Creating scenario: {request.name}")
        
        scenario = await ScenarioRepository.create_scenario(
            name=request.name,
            description=request.description,
            funding=request.funding,
            revenue=request.revenue  # Add this parameter
        )
        
        logger.info(f"✅ Scenario created: ID={scenario.id}")
        return ScenarioResponse(**_scenario_to_dict(scenario))
        
    except Exception as e:
        logger.error(f"Error creating scenario: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating scenario: {str(e)}"
        )

@router.get("", response_model=List[ScenarioResponse])
async def get_all_scenarios(
    _current_user: User = Depends(get_current_user)
):
    """Get all scenarios"""
    try:
        scenarios = await ScenarioRepository.get_all_scenarios()
        return [ScenarioResponse(**_scenario_to_dict(scenario)) for scenario in scenarios]
    except Exception as e:
        logger.error(f"Error getting scenarios: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting scenarios: {str(e)}"
        )

@router.get("/{scenario_id}", response_model=ScenarioResponse)
async def get_scenario(
    scenario_id: UUID,
    _current_user: User = Depends(get_current_user)
):
    """Get a scenario by ID"""
    try:
        scenario = await ScenarioRepository.get_scenario_by_id(scenario_id)
        if not scenario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Scenario with ID {scenario_id} not found"
            )
        return ScenarioResponse(**_scenario_to_dict(scenario))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting scenario: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting scenario: {str(e)}"
        )

@router.put("/{scenario_id}", response_model=ScenarioResponse, status_code=status.HTTP_200_OK)
async def update_scenario(
    scenario_id: UUID,
    request: ScenarioUpdateRequest,
    _current_user: User = Depends(get_current_user)
):
    """Update a scenario"""
    try:
        logger.info(f"Updating scenario: {scenario_id}")
        
        existing_scenario = await ScenarioRepository.get_scenario_by_id(scenario_id)
        if not existing_scenario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Scenario with ID {scenario_id} not found"
            )
        
        updated_scenario = await ScenarioRepository.update_scenario(
            scenario_id=scenario_id,
            name=request.name,
            description=request.description,
            funding=request.funding,
            revenue=request.revenue  # Add this parameter
        )
        
        if not updated_scenario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Scenario with ID {scenario_id} not found"
            )
        
        logger.info(f"✅ Scenario updated: ID={updated_scenario.id}")
        return ScenarioResponse(**_scenario_to_dict(updated_scenario))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating scenario: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating scenario: {str(e)}"
        )

@router.delete("/{scenario_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scenario(
    scenario_id: UUID,
    _current_user: User = Depends(get_current_user)
):
    """Delete a scenario (cascade deletes related costs)"""
    try:
        logger.info(f"Deleting scenario: {scenario_id}")
        
        # Check if scenario exists
        existing_scenario = await ScenarioRepository.get_scenario_by_id(scenario_id)
        if not existing_scenario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Scenario with ID {scenario_id} not found"
            )
        
        deleted = await ScenarioRepository.delete_scenario(scenario_id)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Scenario with ID {scenario_id} not found"
            )
        
        logger.info(f"✅ Scenario deleted: ID={scenario_id}")
        return None  # 204 No Content
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting scenario: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting scenario: {str(e)}"
        )
