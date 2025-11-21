import { useQuery } from "@tanstack/react-query";
import { getRevenues, type RevenueResponse } from "@/api/revenue";
import { AxiosError } from "axios";

export const useGetRevenues = () => {
  return useQuery<RevenueResponse[], AxiosError>({
    queryKey: ["revenues", "all"],
    queryFn: () => getRevenues(),
    retry: 1,
  });
};
