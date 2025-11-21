import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateCost,
  type CostUpdateRequest,
  type CostResponse,
} from "@/api/cost";
import { AxiosError } from "axios";

interface CostError {
  message: string;
  detail?: string;
}

interface UpdateCostVariables {
  costId: string;
  data: CostUpdateRequest;
}

export const useUpdateCost = () => {
  const queryClient = useQueryClient();

  return useMutation<CostResponse, AxiosError<CostError>, UpdateCostVariables>({
    mutationFn: async ({ costId, data }) => {
      return await updateCost(costId, data);
    },
    onSuccess: (data) => {
      // Invalidate and refetch costs queries
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      queryClient.invalidateQueries({ queryKey: ["cost", data.id] });
      console.log("✅ Cost updated successfully");
    },
    onError: (error) => {
      console.error("❌ Failed to update cost:", error);
    },
  });
};
