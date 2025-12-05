import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["/api/user"],
    retry: false,
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  return {
    user,
    isLoading,
    isError,
    isAuthenticated: !!user,
  };
}
