import { get, post, put, del } from "./request";

export interface ScenarioCreateRequest {
  name: string;
  description?: string | null;
  funding?: number | null;
  revenue?: number | null; // Add this field
}

export interface ScenarioUpdateRequest {
  name?: string;
  description?: string | null;
  funding?: number | null;
  revenue?: number | null; // Add this field
}

export interface ScenarioResponse {
  id: string;
  name: string;
  description: string | null;
  funding: number | null;
  revenue: number | null; // Add this field
  created_at: string;
  updated_at: string;
}

export const createScenario = async (
  data: ScenarioCreateRequest
): Promise<ScenarioResponse> => {
  return await post<ScenarioResponse, ScenarioCreateRequest>(
    "/scenarios",
    data
  );
};

export const getScenarios = async (): Promise<ScenarioResponse[]> => {
  return await get<ScenarioResponse[]>("/scenarios");
};

export const getScenario = async (
  scenarioId: string
): Promise<ScenarioResponse> => {
  return await get<ScenarioResponse>(`/scenarios/${scenarioId}`);
};

export const updateScenario = async (
  scenarioId: string,
  data: ScenarioUpdateRequest
): Promise<ScenarioResponse> => {
  return await put<ScenarioResponse, ScenarioUpdateRequest>(
    `/scenarios/${scenarioId}`,
    data
  );
};

export const deleteScenario = async (scenarioId: string): Promise<void> => {
  return await del<void>(`/scenarios/${scenarioId}`);
};
