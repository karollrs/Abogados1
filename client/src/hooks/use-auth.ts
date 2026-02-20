import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";

export type User = {
  id: string;
  email: string;
  name: string;
  role: "agent" | "admin" | "abogado";
};

type LoginResponse = { user: User };

/**
 * Helper: convierte lo que devuelva apiRequest en JSON.
 * - Si apiRequest devuelve Response -> usamos .json()
 * - Si apiRequest ya devuelve objeto -> lo retornamos
 */
async function asJson<T>(res: any): Promise<T> {
  if (res && typeof res === "object" && typeof res.json === "function") {
    return (await res.json()) as T;
  }
  return res as T;
}

export function useUser() {
  return useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }) as any,
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", input);
      const data = await asJson<LoginResponse>(res);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data.user);
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
      return true;
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.invalidateQueries();
    },
  });
}
