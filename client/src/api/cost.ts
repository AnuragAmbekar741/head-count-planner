import { post, put, get } from "./request";

// Frequency constants matching backend
export const CostFrequency = {
  ONE_TIME: "one_time",
  MONTHLY: "monthly",
  YEARLY: "yearly",
  QUARTERLY: "quarterly",
  ANNUAL: "annual",
} as const;

// Union type for frequency values
export type CostFrequencyType =
  (typeof CostFrequency)[keyof typeof CostFrequency];

// Request interfaces
export interface CostCreateRequest {
  title: string;
  value: number;
  category: string;
  starts_at: number;
  end_at?: number | null;
  freq: CostFrequencyType;
  scenario_id: string; // UUID as string
  is_active?: boolean; // Add this field
}

export interface CostUpdateRequest {
  title?: string;
  value?: number;
  category?: string;
  starts_at?: number;
  end_at?: number | null;
  freq?: CostFrequencyType;
  scenario_id?: string;
  is_active?: boolean; // Add this field
}

export interface CostBulkCreateRequest {
  costs: CostCreateRequest[];
}

// Response interface
export interface CostResponse {
  id: string;
  title: string;
  value: number;
  category: string;
  starts_at: number;
  end_at: number | null;
  freq: string;
  is_active: boolean; // Add this field
  scenario_id: string;
  created_at: string;
  updated_at: string;
}

export const createCost = async (
  data: CostCreateRequest
): Promise<CostResponse> => {
  return await post<CostResponse, CostCreateRequest>("/costs", data);
};

export const createCostsBulk = async (
  data: CostBulkCreateRequest
): Promise<CostResponse[]> => {
  return await post<CostResponse[], CostBulkCreateRequest>("/costs/bulk", data);
};

export const updateCost = async (
  costId: string,
  data: CostUpdateRequest
): Promise<CostResponse> => {
  return await put<CostResponse, CostUpdateRequest>(`/costs/${costId}`, data);
};

export const getCosts = async (): Promise<CostResponse[]> => {
  return await get<CostResponse[]>("/costs");
};

export const getCostsByScenario = async (
  scenarioId: string
): Promise<CostResponse[]> => {
  return await get<CostResponse[]>(`/costs?scenario_id=${scenarioId}`);
};
