import { useQuery } from "@tanstack/react-query";
import { getScenario, type ScenarioResponse } from "@/api/scenario";
import { AxiosError } from "axios";

export const useGetScenario = (scenarioId: string | null) => {
  return useQuery<ScenarioResponse, AxiosError>({
    queryKey: ["scenario", scenarioId],
    queryFn: () => getScenario(scenarioId!),
    enabled: !!scenarioId, // Only run query if scenarioId is provided
    retry: 1,
  });
};
