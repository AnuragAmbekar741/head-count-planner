import { useQuery } from "@tanstack/react-query";
import { getCosts, type CostResponse } from "@/api/cost";
import { AxiosError } from "axios";

export const useGetCosts = () => {
  return useQuery<CostResponse[], AxiosError>({
    queryKey: ["costs", "all"],
    queryFn: () => getCosts(),
    retry: 1,
  });
};
