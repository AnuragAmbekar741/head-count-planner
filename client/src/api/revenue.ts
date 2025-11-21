import { post, put, get } from "./request";

// Frequency constants matching backend
export const RevenueFrequency = {
  ONE_TIME: "one_time",
  MONTHLY: "monthly",
  YEARLY: "yearly",
  QUARTERLY: "quarterly",
  ANNUAL: "annual",
} as const;

// Union type for frequency values
export type RevenueFrequencyType =
  (typeof RevenueFrequency)[keyof typeof RevenueFrequency];

// Request interfaces
export interface RevenueCreateRequest {
  title: string;
  value: number;
  category?: string | null;
  starts_at: number;
  end_at?: number | null;
  freq: RevenueFrequencyType;
  scenario_id: string;
  is_active?: boolean;
}

export interface RevenueUpdateRequest {
  title?: string;
  value?: number;
  category?: string | null;
  starts_at?: number;
  end_at?: number | null;
  freq?: RevenueFrequencyType;
  scenario_id?: string;
  is_active?: boolean;
}

export interface RevenueBulkCreateRequest {
  revenues: RevenueCreateRequest[];
}

// Response interface
export interface RevenueResponse {
  id: string;
  title: string;
  value: number;
  category: string | null;
  starts_at: number;
  end_at: number | null;
  freq: string;
  is_active: boolean;
  scenario_id: string;
  created_at: string;
  updated_at: string;
}

export const createRevenue = async (
  data: RevenueCreateRequest
): Promise<RevenueResponse> => {
  return await post<RevenueResponse, RevenueCreateRequest>("/revenues", data);
};

export const createRevenuesBulk = async (
  data: RevenueBulkCreateRequest
): Promise<RevenueResponse[]> => {
  return await post<RevenueResponse[], RevenueBulkCreateRequest>(
    "/revenues/bulk",
    data
  );
};

export const updateRevenue = async (
  revenueId: string,
  data: RevenueUpdateRequest
): Promise<RevenueResponse> => {
  return await put<RevenueResponse, RevenueUpdateRequest>(
    `/revenues/${revenueId}`,
    data
  );
};

export const getRevenues = async (): Promise<RevenueResponse[]> => {
  return await get<RevenueResponse[]>("/revenues");
};

export const getRevenuesByScenario = async (
  scenarioId: string
): Promise<RevenueResponse[]> => {
  return await get<RevenueResponse[]>(`/revenues?scenario_id=${scenarioId}`);
};
