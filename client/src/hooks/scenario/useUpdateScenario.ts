import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateScenario,
  type ScenarioUpdateRequest,
  type ScenarioResponse,
} from "@/api/scenario";
import { AxiosError } from "axios";

interface ScenarioError {
  message: string;
  detail?: string;
}

interface UpdateScenarioVariables {
  scenarioId: string;
  data: ScenarioUpdateRequest;
}

export const useUpdateScenario = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ScenarioResponse,
    AxiosError<ScenarioError>,
    UpdateScenarioVariables
  >({
    mutationFn: async ({ scenarioId, data }) => {
      return await updateScenario(scenarioId, data);
    },
    onSuccess: (data) => {
      // Invalidate and refetch scenarios queries
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      queryClient.invalidateQueries({ queryKey: ["scenario", data.id] });
      console.log("✅ Scenario updated successfully");
    },
    onError: (error) => {
      console.error("❌ Failed to update scenario:", error);
    },
  });
};
