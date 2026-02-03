import { useQuery } from "@tanstack/react-query";

import { getQueryFn } from "@/lib/queryClient";

export type DashboardMetrics = {
  incidents: number;
  objects: number;
  users: number;
  reports: number;
  inspections: number;
  adminCases: number;
};

export function useDashboardMetrics() {
  return useQuery<DashboardMetrics>({
    queryKey: ["/api/stats/dashboard"],
    queryFn: getQueryFn({ on401: "throw" }),
    retry: 1,
    refetchInterval: 30000,
  });
}
