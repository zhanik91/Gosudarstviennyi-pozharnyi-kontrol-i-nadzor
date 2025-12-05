import { useQuery } from "@tanstack/react-query";

import { getQueryFn } from "@/lib/queryClient";

export type DashboardMetrics = {
  incidents: number;
  packages: number;
  usersOnline: number;
  reportsReady: number;
};

export function useDashboardMetrics() {
  return useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
    queryFn: getQueryFn({ on401: "throw" }),
    retry: 1,
    refetchInterval: 30000,
  });
}
