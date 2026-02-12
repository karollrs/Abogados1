import { useQuery } from "@tanstack/react-query";

export function useCallLogs() {
  return useQuery({
    queryKey: ["call-logs"],
    queryFn: async () => {
      const res = await fetch("http://127.0.0.1:5000/api/call-logs", {credentials: "include",});
      if (!res.ok) throw new Error("Failed to fetch call logs");
      return await res.json();
    },
  });
}
