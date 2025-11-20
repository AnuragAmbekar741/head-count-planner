import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCostsBulk,
  type CostBulkCreateRequest,
  type CostResponse,
} from "@/api/cost";
import { AxiosError } from "axios";

interface CostError {
  message: string;
  detail?: string;
}

export const useCreateCostsBulk = () => {
  const queryClient = useQueryClient();

  return useMutation<
    CostResponse[],
    AxiosError<CostError>,
    CostBulkCreateRequest
  >({
    mutationFn: async (data) => {
      return await createCostsBulk(data);
    },
    onSuccess: (data) => {
      // Invalidate and refetch costs queries
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      console.log(`✅ ${data.length} costs created successfully`);
    },
    onError: (error) => {
      console.error("❌ Failed to create costs in bulk:", error);
    },
  });
};
