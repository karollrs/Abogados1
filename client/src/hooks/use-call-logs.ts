import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient"; // ajusta si tu ruta es distinta

export function useCallLogs() {
  return useQuery({
    queryKey: ["/api/call-logs"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
}
