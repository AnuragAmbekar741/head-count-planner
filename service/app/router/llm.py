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

class CompareScenariosRequest(BaseModel):
    """Request schema for comparing two scenarios"""
    scenario1_id: str = Field(..., description="UUID of the first scenario")
    scenario2_id: str = Field(..., description="UUID of the second scenario")


@router.post("/compare-scenarios", response_model=Dict[str, str])
async def compare_scenarios(
    request: CompareScenariosRequest,
    _current_user: User = Depends(get_current_user),
    llm_service: LLMService = Depends(get_llm_service)
):
    """Compare two scenarios and generate a comprehensive comparison report"""
    try:
        from uuid import UUID
        from app.repositories.scenario_repo import ScenarioRepository
        from app.repositories.cost_repo import CostRepository
        from app.repositories.revenue_repo import RevenueRepository
        
        # Validate UUIDs
        try:
            scenario1_uuid = UUID(request.scenario1_id)
            scenario2_uuid = UUID(request.scenario2_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid scenario ID format")
        
        # Fetch scenarios
        scenario1 = await ScenarioRepository.get_scenario_by_id(scenario1_uuid)
        scenario2 = await ScenarioRepository.get_scenario_by_id(scenario2_uuid)
        
        if not scenario1:
            raise HTTPException(status_code=404, detail=f"Scenario 1 with ID {request.scenario1_id} not found")
        if not scenario2:
            raise HTTPException(status_code=404, detail=f"Scenario 2 with ID {request.scenario2_id} not found")
        
        # Fetch costs and revenues for both scenarios
        costs1 = await CostRepository.get_costs_by_scenario(scenario1_uuid)
        revenues1 = await RevenueRepository.get_revenues_by_scenario(scenario1_uuid)
        costs2 = await CostRepository.get_costs_by_scenario(scenario2_uuid)
        revenues2 = await RevenueRepository.get_revenues_by_scenario(scenario2_uuid)
        
        # Helper function to calculate first-year value
        def calculate_first_year_value(item, year_start_month=1, year_end_month=12):
            """Calculate first-year value based on starts_at and ends_at"""
            value = float(item.value)
            starts_at = item.starts_at
            ends_at = item.end_at
            
            # Calculate active months in first year
            first_active = max(year_start_month, starts_at)
            last_active = min(year_end_month, ends_at) if ends_at else year_end_month
            
            # If not active in first year
            if first_active > year_end_month or last_active < year_start_month:
                return 0
            
            # Convert annual value to monthly, then multiply by active months
            monthly = value / 12
            active_months = last_active - first_active + 1
            return monthly * active_months
        
        # Calculate metrics for scenario 1
        total_costs1 = sum(
            calculate_first_year_value(cost) 
            for cost in costs1 
            if cost.is_active
        )
        total_revenue1 = sum(
            calculate_first_year_value(revenue) 
            for revenue in revenues1 
            if revenue.is_active
        )
        net_burn1 = total_costs1 - total_revenue1
        growth_rate1 = ((total_revenue1 - total_costs1) / total_costs1 * 100) if total_costs1 > 0 else 0
        
        # Calculate runway for scenario 1
        funding1 = float(scenario1.funding) if scenario1.funding else 0
        monthly_net_burn1 = net_burn1 / 12
        runway1 = None
        if funding1 and monthly_net_burn1 > 0:
            runway1 = funding1 / monthly_net_burn1
        elif funding1 and monthly_net_burn1 <= 0:
            runway1 = float('inf')
        
        # Calculate metrics for scenario 2
        total_costs2 = sum(
            calculate_first_year_value(cost) 
            for cost in costs2 
            if cost.is_active
        )
        total_revenue2 = sum(
            calculate_first_year_value(revenue) 
            for revenue in revenues2 
            if revenue.is_active
        )
        net_burn2 = total_costs2 - total_revenue2
        growth_rate2 = ((total_revenue2 - total_costs2) / total_costs2 * 100) if total_costs2 > 0 else 0
        
        # Calculate runway for scenario 2
        funding2 = float(scenario2.funding) if scenario2.funding else 0
        monthly_net_burn2 = net_burn2 / 12
        runway2 = None
        if funding2 and monthly_net_burn2 > 0:
            runway2 = funding2 / monthly_net_burn2
        elif funding2 and monthly_net_burn2 <= 0:
            runway2 = float('inf')
        
        # Format scenario data for LLM
        def format_scenario_data(scenario, costs, revenues, metrics):
            """Format scenario data for LLM comparison"""
            return {
                "scenario": {
                    "name": scenario.name,
                    "description": scenario.description or "",
                    "funding": float(scenario.funding) if scenario.funding else None,
                },
                "costs": [
                    {
                        "title": cost.title,
                        "value": str(float(cost.value)),
                        "category": cost.category,
                        "starts_at": str(cost.starts_at),
                        "end_at": str(cost.end_at) if cost.end_at else "",
                        "freq": cost.freq,
                    }
                    for cost in costs if cost.is_active
                ],
                "revenues": [
                    {
                        "title": revenue.title,
                        "value": str(float(revenue.value)),
                        "category": revenue.category or "",
                        "starts_at": str(revenue.starts_at),
                        "end_at": str(revenue.end_at) if revenue.end_at else "",
                        "freq": revenue.freq,
                    }
                    for revenue in revenues if revenue.is_active
                ],
                "metrics": {
                    "total_costs": metrics["total_costs"],
                    "total_revenue": metrics["total_revenue"],
                    "net_burn": metrics["net_burn"],
                    "growth_rate": metrics["growth_rate"],
                    "runway": metrics["runway"],
                }
            }
        
        scenario1_data = format_scenario_data(
            scenario1,
            costs1,
            revenues1,
            {
                "total_costs": total_costs1,
                "total_revenue": total_revenue1,
                "net_burn": net_burn1,
                "growth_rate": growth_rate1,
                "runway": runway1,
            }
        )
        
        scenario2_data = format_scenario_data(
            scenario2,
            costs2,
            revenues2,
            {
                "total_costs": total_costs2,
                "total_revenue": total_revenue2,
                "net_burn": net_burn2,
                "growth_rate": growth_rate2,
                "runway": runway2,
            }
        )
        
        # Call LLM service to generate comparison report
        comparison_report = await llm_service.compare_scenarios(
            scenario1_data,
            scenario2_data
        )
        
        return {
            "report": comparison_report,
            "scenario1": {
                "id": str(scenario1.id),
                "name": scenario1.name,
            },
            "scenario2": {
                "id": str(scenario2.id),
                "name": scenario2.name,
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comparing scenarios: {str(e)}")