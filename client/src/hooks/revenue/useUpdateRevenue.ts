import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateRevenue,
  type RevenueUpdateRequest,
  type RevenueResponse,
} from "@/api/revenue";
import { AxiosError } from "axios";

interface RevenueError {
  message: string;
  detail?: string;
}

interface UpdateRevenueVariables {
  revenueId: string;
  data: RevenueUpdateRequest;
}

export const useUpdateRevenue = () => {
  const queryClient = useQueryClient();

  return useMutation<
    RevenueResponse,
    AxiosError<RevenueError>,
    UpdateRevenueVariables
  >({
    mutationFn: async ({ revenueId, data }) => {
      return await updateRevenue(revenueId, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["revenues"] });
      queryClient.invalidateQueries({ queryKey: ["revenue", data.id] });
      console.log("✅ Revenue updated successfully");
    },
    onError: (error) => {
      console.error("❌ Failed to update revenue:", error);
    },
  });
};
