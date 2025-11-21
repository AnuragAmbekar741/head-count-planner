import { useQuery } from "@tanstack/react-query";
import { getRevenuesByScenario, type RevenueResponse } from "@/api/revenue";
import { AxiosError } from "axios";

export const useGetRevenuesByScenario = (scenarioId: string | null) => {
  return useQuery<RevenueResponse[], AxiosError>({
    queryKey: ["revenues", "scenario", scenarioId],
    queryFn: () => getRevenuesByScenario(scenarioId!),
    enabled: !!scenarioId,
    retry: 1,
  });
};
