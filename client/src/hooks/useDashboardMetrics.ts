import { useQuery } from "@tanstack/react-query";

import { getQueryFn } from "@/utils/queryClient";
import type { DashboardMetrics } from "@/types/dashboard";

export function useDashboardMetrics() {
  return useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
    queryFn: getQueryFn({ on401: "throw" }),
    retry: 1,
    refetchInterval: 30000,
  });
}
