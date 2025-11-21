from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from app.config import settings
from typing import Optional, List, Dict, Any
import json


class LLMService:
    """Service for interacting with ChatGPT via LangChain"""
    
    def __init__(self):
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not set in environment variables")
        
        self.llm = ChatOpenAI(
            model=settings.OPENAI_MODEL,
            api_key=settings.OPENAI_API_KEY,
            temperature=settings.OPENAI_TEMPERATURE,
            max_tokens=2048,
        )
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None
    ) -> str:
        """
        Send messages to the LLM and get a response.
        
        Args:
            messages: List of message dicts with 'role' and 'content' keys
            system_prompt: Optional system prompt to set context
        
        Returns:
            LLM response as string
        """
        langchain_messages = []
        
        if system_prompt:
            langchain_messages.append(SystemMessage(content=system_prompt))
        
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            
            if role == "user":
                langchain_messages.append(HumanMessage(content=content))
            elif role == "assistant":
                from langchain_core.messages import AIMessage
                langchain_messages.append(AIMessage(content=content))
        
        response = await self.llm.ainvoke(langchain_messages)
        return response.content
    
    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None
    ) -> str:
        """
        Simple text generation from a single prompt.
        
        Args:
            prompt: User prompt
            system_prompt: Optional system prompt for context
        
        Returns:
            Generated text response
        """
        messages = [{"role": "user", "content": prompt}]
        return await self.chat(messages, system_prompt)
    
    async def analyze_scenario(
        self,
        scenario_data: Dict[str, Any],
        question: Optional[str] = None
    ) -> str:
        """
        Analyze scenario data and provide insights.
        
        Args:
            scenario_data: Dictionary containing scenario information
            question: Optional specific question about the scenario
        
        Returns:
            Analysis response
        """
        system_prompt = """You are a financial planning assistant specializing in startup burn rate analysis and runway calculations. 
        Provide clear, actionable insights about financial scenarios."""
        
        prompt = f"""Analyze the following scenario data:
        
        Scenario Name: {scenario_data.get('name', 'N/A')}
        Funding: ${scenario_data.get('funding', 0):,.2f}
        Total Costs: ${scenario_data.get('total_costs', 0):,.2f}
        Total Revenue: ${scenario_data.get('total_revenue', 0):,.2f}
        Net Burn: ${scenario_data.get('net_burn', 0):,.2f}
        Runway: {scenario_data.get('runway', 'N/A')} months
        
        {f'Question: {question}' if question else 'Provide a comprehensive analysis of this scenario, including burn rate insights, runway sustainability, and recommendations.'}
        """
        
        return await self.generate_text(prompt, system_prompt)
    
    async def parse_nlp_to_scenario(self, nlp_input: str) -> Dict[str, Any]:
        """
        Parse natural language input to extract scenario, costs, and revenues.
        
        Args:
            nlp_input: Natural language description of the scenario
        
        Returns:
            Dictionary with scenario, costs, and revenues data
        """
        system_prompt = """You are a financial planning assistant that converts natural language descriptions into structured scenario data.

Extract the following information from the user's input:
1. Scenario name (generate a descriptive name if not provided)
2. Funding amount (in dollars, convert abbreviations like 1M to 1000000)
3. Cost items (hiring plans, salaries, expenses):
   - For engineers: assume $150,000 annual salary per engineer
   - For designers: assume $100,000 annual salary per designer
   - For other roles: use reasonable market rates
   - All salaries should be annual values
   - Start month defaults to 1 if not specified
   - Frequency is "yearly" for salaries
4. Revenue items:
   - MRR (Monthly Recurring Revenue) should be converted to annual value (MRR * 12)
   - Start month should be extracted (e.g., "from 3rd month" = 3)
   - Frequency is "monthly" for MRR

Return ONLY valid JSON in this exact format:
{
  "scenario": {
    "name": "string",
    "description": "string (optional)",
    "funding": number (in dollars)
  },
  "costs": [
    {
      "title": "string (e.g., 'Engineer #1')",
      "value": number (annual value in dollars),
      "category": "string (e.g., 'Engineering', 'Design', 'Operations')",
      "starts_at": number (month number, 1-based),
      "end_at": null or number,
      "freq": "yearly",
      "is_active": true
    }
  ],
  "revenues": [
    {
      "title": "string (e.g., 'Monthly Revenue')",
      "value": number (annual value in dollars, MRR * 12),
      "category": "Revenue",
      "starts_at": number (month number, 1-based),
      "end_at": null,
      "freq": "monthly",
      "is_active": true
    }
  ]
}"""

        prompt = f"""Parse this scenario description and extract structured data:

{nlp_input}

Return ONLY the JSON object, no other text."""

        response = await self.generate_text(prompt, system_prompt)
        
        # Try to extract JSON from response (handle markdown code blocks)
        response = response.strip()
        if response.startswith("on"):
            response = response[7:]
        if response.startswith("```"):
            response = response[3:]
        if response.endswith("```"):
            response = response[:-3]
        response = response.strip()
        
        try:
            return json.loads(response)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse LLM response as JSON: {str(e)}\nResponse: {response}")


    async def parse_nlp_to_template(self, nlp_input: str) -> Dict[str, Any]:
        """
        Parse natural language input to extract scenario, costs, and revenues in template format.
        Returns data in the same format as scenario templates for display in modal.
        
        Args:
            nlp_input: Natural language description of the scenario
        
        Returns:
            Dictionary with scenario, costs, and revenues in template format
        """
        system_prompt = """
You are a financial planning assistant that converts natural language descriptions into structured scenario data in template format for a headcount and revenue planning tool.

Your job:
- Read the user's scenario description.
- Infer a clean, structured scenario object plus lists of cost and revenue items.
- Return ONLY valid JSON in the exact schema described below. Do NOT include explanations or extra text.

Extract the following information from the user's input:
1. Scenario name
   - Use the scenario name mentioned, if any.
   - If none is given, generate a short, descriptive name.

2. Scenario description
   - Generate a brief, one-sentence description summarizing the team and plan.

3. Funding amount
   - Total funding amount in dollars (numeric, not a string).
   - Convert abbreviations:
     - 1M, 1m, $1M  -> 1000000
     - 500k, 500K   -> 500000
   - If funding is not mentioned, set funding to 0.

4. Cost items (hiring plans, salaries, expenses)
   - These represent ANNUAL values.
   - For engineers: assume $150,000 annual salary per engineer if no salary is specified.
   - For designers: assume $100,000 annual salary per designer if no salary is specified.
   - For other roles: use reasonable market rates (e.g., PM ~ 120000, Ops ~ 90000) and be consistent.
   - All salaries are ANNUAL values, so freq MUST be "annual".
   - Start month (starts_at) defaults to 1 if not specified.
   - All numeric fields in costs (value, starts_at, end_at) MUST be strings (e.g., "150000" not 150000).
   - To estimate first-year cost for a salary that starts mid-year, use:
       active_months = 12 - start_month
       first_year_cost ≈ (annual_salary / 12) * active_months
     Example:
       engineer with 180K annual salary starting in month 3:
         active_months = 12 - 3 = 9
         first_year_cost ≈ 180000 / 12 * 9 = 135000
     - Store this first-year cost in "value" as a string, e.g., "135000".

5. Revenue items
   - All revenue items MUST have freq = "annual".
   - All numeric fields in revenues (value, starts_at, end_at) MUST be strings (e.g., "90000").
   - starts_at: month number as string ("1"–"12"), default "1" if not specified.
   - end_at: month number as string or "" if not specified.

   MRR (Monthly Recurring Revenue):
   - For MRR, convert to first-year revenue by multiplying the MRR by the number of active months remaining in the year:
       active_months = 12 - start_month
       annual_value = MRR * active_months
     Examples:
       - 10K MRR starting from month 3:
         active_months = 12 - 3 = 9
         annual_value = 10K * 9 = 90K  -> "90000"
       - 50K MRR starting from month 6:
         active_months = 12 - 6 = 6
         annual_value = 50K * 6 = 300K -> "300000"

   Multiple MRR phases:
   - If revenue ramps (e.g., “25K MRR starting month 5 and 50K MRR from month 8”),
     model this as two revenue items:
       1) 25K MRR from month 5 until month 8:
          starts_at = "5", end_at = "8"
          approximate first-year value ≈ 25K * (8 - 5)
       2) 50K MRR from month 8 until end of year:
          starts_at = "8", end_at = ""
          approximate first-year value ≈ 50K * (12 - 8)

   ARR (Annual Recurring Revenue):
   - For ARR, values are already annual, so do NOT convert them by months.
   - Example: 600K ARR stays "600000".

Return ONLY valid JSON in this exact format (matching template structure):
{
  "scenario": {
    "name": "string",
    "description": "string",
    "funding": number (in dollars, for reference only)
  },
  "costs": [
    {
      "title": "string (e.g., 'Senior Software Engineer #1')",
      "value": "string (annual or first-year value as string, e.g., '150000')",
      "category": "string (e.g., 'Engineering', 'Design', 'Operations')",
      "starts_at": "string (month number as string, e.g., '1')",
      "end_at": "string (empty string '' or month number as string)",
      "freq": "annual"
    }
  ],
  "revenues": [
    {
      "title": "string (e.g., 'Annual Revenue')",
      "value": "string (first-year annualized value as string, e.g., '90000' for 10K MRR from month 3)",
      "category": "string (e.g., 'Revenue', 'Sales')",
      "starts_at": "string (month number as string, e.g., '3')",
      "end_at": "string (empty string '')",
      "freq": "annual"
    }
  ]
}

CRITICAL RULES:
- All cost items MUST have freq: "annual" (salaries are annual; if they start mid-year, first-year cost should approximate using active_months = 12 - start_month).
- All revenue items MUST have freq: "annual" (values are annualized from MRR or given as ARR).
- All numeric values MUST be strings (value, starts_at, end_at).
- end_at should be empty string "" if not specified.
- For MRR: convert to first-year annual value using annual_value = MRR * (12 - start_month),
  e.g., 10K MRR from month 3 => 10K * 9 = "90000".
- The response MUST be a single valid JSON object with exactly these top-level keys: "scenario", "costs", "revenues".
"""

        prompt = f"""
Parse this scenario description and extract structured data in the required template format.

SCENARIO DESCRIPTION:
\"\"\"{nlp_input}\"\"\"

Requirements:
- Infer scenario.name, scenario.description, and scenario.funding as described in the system instructions.
- Extract all hiring, salary, and expense items as costs.
  - Salaries are ANNUAL; freq MUST be "annual".
  - If a salary starts mid-year, estimate first-year cost using:
    (annual_salary / 12) * (12 - start_month).
  - All numeric fields in costs (value, starts_at, end_at) MUST be strings.
- Extract all revenue mentions as revenues.
  - For MRR, compute first-year revenue as:
    MRR * (12 - start_month).
  - For ARR, use the annual amount directly (no month-based conversion).
  - All revenue items MUST have freq = "annual".
  - All numeric fields in revenues (value, starts_at, end_at) MUST be strings.
- starts_at and end_at must always be strings.
  - starts_at defaults to "1" if the month is not specified.
  - end_at must be "" if not specified.

Return ONLY the JSON object, no other text.
"""

        response = await self.generate_text(prompt, system_prompt)
        
        # Try to extract JSON from response (handle markdown code blocks)
        response = response.strip()
        if response.startswith("on"):
            response = response[7:]
        if response.startswith("```"):
            response = response[3:]
        if response.endswith("```"):
            response = response[:-3]
        response = response.strip()
        
        try:
            parsed_data = json.loads(response)
            
            # Validate and enforce correct format
            # Ensure all values are strings and frequencies are correct
            for cost in parsed_data.get("costs", []):
                # Convert to strings if needed
                if isinstance(cost.get("value"), (int, float)):
                    cost["value"] = str(int(cost["value"]))
                if isinstance(cost.get("starts_at"), (int, float)):
                    cost["starts_at"] = str(int(cost["starts_at"]))
                if cost.get("end_at") is None:
                    cost["end_at"] = ""
                elif isinstance(cost.get("end_at"), (int, float)):
                    cost["end_at"] = str(int(cost["end_at"]))
                # Force annual for all cost items
                if cost.get("freq") not in ["annual", "yearly"]:
                    cost["freq"] = "annual"
            
            for revenue in parsed_data.get("revenues", []):
                # Convert to strings if needed
                if isinstance(revenue.get("value"), (int, float)):
                    revenue["value"] = str(int(revenue["value"]))
                if isinstance(revenue.get("starts_at"), (int, float)):
                    revenue["starts_at"] = str(int(revenue["starts_at"]))
                if revenue.get("end_at") is None:
                    revenue["end_at"] = ""
                elif isinstance(revenue.get("end_at"), (int, float)):
                    revenue["end_at"] = str(int(revenue["end_at"]))
                # Force annual for all revenue items (all values are annual)
                if revenue.get("freq") not in ["annual", "yearly"]:
                    revenue["freq"] = "annual"
            
            # Ensure scenario description exists
            if not parsed_data.get("scenario", {}).get("description"):
                parsed_data["scenario"]["description"] = parsed_data.get("scenario", {}).get("name", "Generated scenario")
            
            return parsed_data
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse LLM response as JSON: {str(e)}\nResponse: {response}")


    async def compare_scenarios(
        self,
        scenario1_data: Dict[str, Any],
        scenario2_data: Dict[str, Any]
    ) -> str:
        """
        Compare two scenarios and generate a comprehensive comparison report.
        
        Args:
            scenario1_data: Dictionary containing first scenario data with:
                - scenario: {name, description, funding}
                - costs: List of cost items
                - revenues: List of revenue items
                - metrics: {total_costs, total_revenue, net_burn, growth_rate, runway} (optional)
            scenario2_data: Dictionary containing second scenario data (same structure)
        
        Returns:
            Comparison report as a string
        """
        system_prompt = """You are a financial planning assistant specializing in startup financial analysis and scenario comparison. 
You provide clear, actionable insights comparing different financial scenarios, focusing on:
- Burn rate and runway analysis
- Cost structure differences
- Revenue projections and growth potential
- Risk assessment
- Strategic recommendations

Provide comprehensive, well-structured comparison reports that help founders make informed decisions."""

        # Format scenario data for comparison
        def format_scenario_data(scenario_data: Dict[str, Any], scenario_label: str) -> str:
            scenario = scenario_data.get("scenario", {})
            costs = scenario_data.get("costs", [])
            revenues = scenario_data.get("revenues", [])
            metrics = scenario_data.get("metrics", {})
            
            formatted = f"""
{scenario_label}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: {scenario.get('name', 'N/A')}
Description: {scenario.get('description', 'N/A')}
Funding: ${scenario.get('funding', 0):,.2f} if scenario.get('funding') else 'Not specified'

Financial Metrics:
  • Total Costs (First Year): ${metrics.get('total_costs', 0):,.2f}
  • Total Revenue (First Year): ${metrics.get('total_revenue', 0):,.2f}
  • Net Burn Rate: ${metrics.get('net_burn', 0):,.2f}
  • Growth Rate: {metrics.get('growth_rate', 0):.2f}%
  • Runway: {metrics.get('runway', 'N/A')} months if isinstance(metrics.get('runway'), (int, float)) else metrics.get('runway', 'N/A')

Cost Structure ({len(costs)} items):
"""
            if costs:
                # Group costs by category
                costs_by_category = {}
                for cost in costs:
                    category = cost.get('category', 'Other')
                    if category not in costs_by_category:
                        costs_by_category[category] = []
                    costs_by_category[category].append(cost)
                
                for category, category_costs in costs_by_category.items():
                    total_category_cost = sum(float(c.get('value', 0)) for c in category_costs)
                    formatted += f"  {category}: ${total_category_cost:,.2f} ({len(category_costs)} items)\n"
                    for cost in category_costs[:3]:  # Show first 3 items per category
                        formatted += f"    - {cost.get('title', 'N/A')}: ${float(cost.get('value', 0)):,.2f} (starts month {cost.get('starts_at', 'N/A')})\n"
                    if len(category_costs) > 3:
                        formatted += f"    ... and {len(category_costs) - 3} more items\n"
            else:
                formatted += "  No costs defined\n"
            
            formatted += f"""
Revenue Structure ({len(revenues)} items):
"""
            if revenues:
                total_revenue = sum(float(r.get('value', 0)) for r in revenues)
                formatted += f"  Total Revenue: ${total_revenue:,.2f}\n"
                for revenue in revenues:
                    formatted += f"  - {revenue.get('title', 'N/A')}: ${float(revenue.get('value', 0)):,.2f} (starts month {revenue.get('starts_at', 'N/A')}, category: {revenue.get('category', 'N/A')})\n"
            else:
                formatted += "  No revenues defined\n"
            
            return formatted

        scenario1_formatted = format_scenario_data(scenario1_data, "SCENARIO 1")
        scenario2_formatted = format_scenario_data(scenario2_data, "SCENARIO 2")

        prompt = f"""Compare the following two financial scenarios and provide a comprehensive analysis.

{scenario1_formatted}

{scenario2_formatted}

Please provide a detailed comparison report covering:

1. **Executive Summary**
   - Key differences at a glance
   - Which scenario appears more sustainable

2. **Financial Metrics Comparison**
   - Burn rate differences
   - Runway comparison
   - Growth potential analysis
   - Funding adequacy

3. **Cost Structure Analysis**
   - Team composition differences
   - Cost efficiency comparison
   - Hiring timeline impact

4. **Revenue Projections**
   - Revenue generation differences
   - Growth trajectory comparison
   - Time to profitability

5. **Risk Assessment**
   - Risk factors for each scenario
   - Sustainability concerns
   - Cash flow risks

6. **Strategic Recommendations**
   - Which scenario to choose and why
   - Hybrid approaches or modifications
   - Key milestones to monitor

Format your response in a clear, structured manner with sections and bullet points where appropriate."""

        response = await self.generate_text(prompt, system_prompt)
        return response


# Singleton instance
_llm_service: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    """Get or create the LLM service instance"""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service


