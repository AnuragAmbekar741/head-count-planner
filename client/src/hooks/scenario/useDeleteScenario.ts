import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteScenario } from "@/api/scenario";
import { AxiosError } from "axios";

interface ScenarioError {
  message: string;
  detail?: string;
}

export const useDeleteScenario = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ScenarioError>, string>({
    mutationFn: async (scenarioId) => {
      return await deleteScenario(scenarioId);
    },
    onSuccess: (_, scenarioId) => {
      // Invalidate and refetch scenarios queries
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      queryClient.removeQueries({ queryKey: ["scenario", scenarioId] });
      console.log("✅ Scenario deleted successfully");
    },
    onError: (error) => {
      console.error("❌ Failed to delete scenario:", error);
    },
  });
};
