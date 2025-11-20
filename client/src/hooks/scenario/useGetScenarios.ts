import { useQuery } from "@tanstack/react-query";
import { getScenarios, type ScenarioResponse } from "@/api/scenario";
import { AxiosError } from "axios";

export const useGetScenarios = () => {
  return useQuery<ScenarioResponse[], AxiosError>({
    queryKey: ["scenarios"],
    queryFn: getScenarios,
    retry: 1,
  });
};
