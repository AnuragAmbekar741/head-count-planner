import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createRevenuesBulk,
  type RevenueBulkCreateRequest,
  type RevenueResponse,
} from "@/api/revenue";
import { AxiosError } from "axios";

interface RevenueError {
  message: string;
  detail?: string;
}

export const useCreateRevenuesBulk = () => {
  const queryClient = useQueryClient();

  return useMutation<
    RevenueResponse[],
    AxiosError<RevenueError>,
    RevenueBulkCreateRequest
  >({
    mutationFn: async (data) => {
      return await createRevenuesBulk(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["revenues"] });
      console.log(`✅ ${data.length} revenues created successfully`);
    },
    onError: (error) => {
      console.error("❌ Failed to create revenues in bulk:", error);
    },
  });
};
