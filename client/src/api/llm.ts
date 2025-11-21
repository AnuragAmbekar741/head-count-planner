import { post } from "./request";

export interface NLPToTemplateRequest {
  nlp_input: string;
}

export interface TemplateCost {
  title: string;
  value: string;
  category: string;
  starts_at: string;
  end_at: string;
  freq: "annual" | "yearly" | "monthly" | "quarterly" | "one_time";
}

export interface TemplateRevenue {
  title: string;
  value: string;
  category: string;
  starts_at: string;
  end_at: string;
  freq: "annual" | "yearly" | "monthly" | "quarterly" | "one_time";
}

export interface NLPToTemplateResponse {
  scenario: {
    name: string;
    description: string;
    funding?: number | null;
  };
  costs: TemplateCost[];
  revenues: TemplateRevenue[];
}

export const nlpToTemplate = async (
  data: NLPToTemplateRequest
): Promise<NLPToTemplateResponse> => {
  return await post<NLPToTemplateResponse, NLPToTemplateRequest>(
    "/llm/nlp-to-template",
    data
  );
};
