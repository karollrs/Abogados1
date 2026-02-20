import { useQuery } from "@tanstack/react-query";
import { withApiBase } from "@/lib/queryClient";

type AssignedCallResponse = {
  call: any | null;
  attorneyId: string | null;
};

export function useAssignedAttorneyCall(callId?: string) {
  return useQuery<AssignedCallResponse>({
    queryKey: ["/api/attorney/assigned-call", callId ?? ""],
    queryFn: async () => {
      const qs = callId ? `?callId=${encodeURIComponent(callId)}` : "";
      const res = await fetch(withApiBase(`/api/attorney/assigned-call${qs}`), {
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
  });
}
