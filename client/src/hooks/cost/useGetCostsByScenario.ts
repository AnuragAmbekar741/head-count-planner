import { useQuery } from "@tanstack/react-query";
import { getCostsByScenario, type CostResponse } from "@/api/cost";
import { AxiosError } from "axios";

export const useGetCostsByScenario = (scenarioId: string | null) => {
  return useQuery<CostResponse[], AxiosError>({
    queryKey: ["costs", "scenario", scenarioId],
    queryFn: () => getCostsByScenario(scenarioId!),
    enabled: !!scenarioId,
    retry: 1,
  });
};
