import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCost,
  type CostCreateRequest,
  type CostResponse,
} from "@/api/cost";
import { AxiosError } from "axios";

interface CostError {
  message: string;
  detail?: string;
}

export const useCreateCost = () => {
  const queryClient = useQueryClient();

  return useMutation<CostResponse, AxiosError<CostError>, CostCreateRequest>({
    mutationFn: async (data) => {
      return await createCost(data);
    },
    onSuccess: () => {
      // Invalidate and refetch costs queries if you have them
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      console.log("✅ Cost created successfully");
    },
    onError: (error) => {
      console.error("❌ Failed to create cost:", error);
    },
  });
};
