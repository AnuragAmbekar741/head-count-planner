import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createScenario,
  type ScenarioCreateRequest,
  type ScenarioResponse,
} from "@/api/scenario";
import { AxiosError } from "axios";

interface ScenarioError {
  message: string;
  detail?: string;
}

export const useCreateScenario = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ScenarioResponse,
    AxiosError<ScenarioError>,
    ScenarioCreateRequest
  >({
    mutationFn: async (data) => {
      return await createScenario(data);
    },
    onSuccess: () => {
      // Invalidate and refetch scenarios queries
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      console.log("✅ Scenario created successfully");
    },
    onError: (error) => {
      console.error("❌ Failed to create scenario:", error);
    },
  });
};
