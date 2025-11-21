from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.llm_service import get_llm_service, LLMService

router = APIRouter(prefix="/llm", tags=["LLM"])


class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    system_prompt: Optional[str] = None


class TextGenerationRequest(BaseModel):
    prompt: str
    system_prompt: Optional[str] = None


class ScenarioAnalysisRequest(BaseModel):
    scenario_data: Dict[str, Any]
    question: Optional[str] = None


@router.post("/chat", response_model=Dict[str, str])
async def chat(
    request: ChatRequest,
    _current_user: User = Depends(get_current_user),
    llm_service: LLMService = Depends(get_llm_service)
):
    """Chat endpoint for LLM interactions"""
    try:
        response = await llm_service.chat(
            messages=request.messages,
            system_prompt=request.system_prompt
        )
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")


@router.post("/generate", response_model=Dict[str, str])
async def generate_text(
    request: TextGenerationRequest,
    _current_user: User = Depends(get_current_user),
    llm_service: LLMService = Depends(get_llm_service)
):
    """Simple text generation endpoint"""
    try:
        response = await llm_service.generate_text(
            prompt=request.prompt,
            system_prompt=request.system_prompt
        )
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")


@router.post("/analyze-scenario", response_model=Dict[str, str])
async def analyze_scenario(
    request: ScenarioAnalysisRequest,
    _current_user: User = Depends(get_current_user),
    llm_service: LLMService = Depends(get_llm_service)
):
    """Analyze scenario data and provide insights"""
    try:
        response = await llm_service.analyze_scenario(
            scenario_data=request.scenario_data,
            question=request.question
        )
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.llm_service import get_llm_service, LLMService
from app.repositories.scenario_repo import ScenarioRepository
from app.repositories.cost_repo import CostRepository
from app.repositories.revenue_repo import RevenueRepository

router = APIRouter(prefix="/llm", tags=["LLM"])


class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    system_prompt: Optional[str] = None


class TextGenerationRequest(BaseModel):
    prompt: str
    system_prompt: Optional[str] = None


class ScenarioAnalysisRequest(BaseModel):
    scenario_data: Dict[str, Any]
    question: Optional[str] = None


class NLPToScenarioRequest(BaseModel):
    """Request schema for NLP to scenario conversion"""
    nlp_input: str = Field(..., min_length=1, description="Natural language description of the scenario")


@router.post("/chat", response_model=Dict[str, str])
async def chat(
    request: ChatRequest,
    _current_user: User = Depends(get_current_user),
    llm_service: LLMService = Depends(get_llm_service)
):
    """Chat endpoint for LLM interactions"""
    try:
        response = await llm_service.chat(
            messages=request.messages,
            system_prompt=request.system_prompt
        )
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")


@router.post("/generate", response_model=Dict[str, str])
async def generate_text(
    request: TextGenerationRequest,
    _current_user: User = Depends(get_current_user),
    llm_service: LLMService = Depends(get_llm_service)
):
    """Simple text generation endpoint"""
    try:
        response = await llm_service.generate_text(
            prompt=request.prompt,
            system_prompt=request.system_prompt
        )
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")


@router.post("/analyze-scenario", response_model=Dict[str, str])
async def analyze_scenario(
    request: ScenarioAnalysisRequest,
    _current_user: User = Depends(get_current_user),
    llm_service: LLMService = Depends(get_llm_service)
):
    """Analyze scenario data and provide insights"""
    try:
        response = await llm_service.analyze_scenario(
            scenario_data=request.scenario_data,
            question=request.question
        )
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")


@router.post("/nlp-to-scenario", response_model=Dict[str, Any])
async def nlp_to_scenario(
    request: NLPToScenarioRequest,
    _current_user: User = Depends(get_current_user),
    llm_service: LLMService = Depends(get_llm_service)
):
    """Convert natural language input to a scenario with costs and revenues"""
    try:
        # Parse NLP input using LLM
        parsed_data = await llm_service.parse_nlp_to_scenario(request.nlp_input)
        
        # Create scenario
        scenario = await ScenarioRepository.create_scenario(
            name=parsed_data["scenario"]["name"],
            description=parsed_data["scenario"].get("description"),
            funding=parsed_data["scenario"].get("funding")
        )
        
        scenario_id = scenario.id
        
        # Create costs in bulk
        costs_data = []
        for cost in parsed_data.get("costs", []):
            costs_data.append({
                "title": cost["title"],
                "value": cost["value"],
                "category": cost["category"],
                "starts_at": cost["starts_at"],
                "end_at": cost.get("end_at"),
                "freq": cost["freq"],
                "is_active": cost.get("is_active", True),
                "scenario_id": scenario_id
            })
        
        created_costs = []
        if costs_data:
            created_costs = await CostRepository.create_costs_bulk(costs_data)
        
        # Create revenues in bulk
        revenues_data = []
        for revenue in parsed_data.get("revenues", []):
            revenues_data.append({
                "title": revenue["title"],
                "value": revenue["value"],
                "category": revenue.get("category", "Revenue"),
                "starts_at": revenue["starts_at"],
                "end_at": revenue.get("end_at"),
                "freq": revenue["freq"],
                "is_active": revenue.get("is_active", True),
                "scenario_id": scenario_id
            })
        
        created_revenues = []
        if revenues_data:
            created_revenues = await RevenueRepository.create_revenues_bulk(revenues_data)
        
        return {
            "scenario": {
                "id": str(scenario.id),
                "name": scenario.name,
                "description": scenario.description,
                "funding": float(scenario.funding) if scenario.funding else None,
            },
            "costs_created": len(created_costs),
            "revenues_created": len(created_revenues),
            "message": f"Successfully created scenario with {len(created_costs)} cost items and {len(created_revenues)} revenue items"
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse input: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating scenario: {str(e)}")

class NLPToTemplateRequest(BaseModel):
    """Request schema for NLP to template conversion (preview only)"""
    nlp_input: str = Field(..., min_length=1, description="Natural language description of the scenario")


@router.post("/nlp-to-template", response_model=Dict[str, Any])
async def nlp_to_template(
    request: NLPToTemplateRequest,
    _current_user: User = Depends(get_current_user),
    llm_service: LLMService = Depends(get_llm_service)
):
    """Convert natural language input to template format (for preview in modal, doesn't create scenario)"""
    try:
        # Parse NLP input using LLM and return in template format
        template_data = await llm_service.parse_nlp_to_template(request.nlp_input)
        
        return {
            "scenario": {
                "name": template_data["scenario"]["name"],
                "description": template_data["scenario"].get("description", ""),
                "funding": template_data["scenario"].get("funding"),
            },
            "costs": template_data.get("costs", []),
            "revenues": template_data.get("revenues", []),
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse input: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")