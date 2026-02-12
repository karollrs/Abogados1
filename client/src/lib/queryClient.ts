import { QueryClient } from "@tanstack/react-query";

/**
 * React Query client
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Base URL del backend (para cuando el front corre en 5173)
 * Si no está definida, funciona igual en "mismo origen".
 */
const API_BASE = (import.meta as any).env?.VITE_API_URL?.toString()?.trim() || "";

/**
 * Convierte "/api/..." a "http://127.0.0.1:5000/api/..."
 */
export function withApiBase(url: string) {
  if (!API_BASE) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (!url.startsWith("/")) return `${API_BASE}/${url}`;
  return `${API_BASE}${url}`;
}

/**
 * Request helper: SIEMPRE envía cookies (sesión)
 */
export async function apiRequest(method: string, url: string, body?: unknown) {
  const res = await fetch(withApiBase(url), {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res;
}

/**
 * Query helper: maneja 401 como null o throw
 */
export function getQueryFn({ on401 }: { on401: "throw" | "returnNull" }) {
  return async ({ queryKey }: { queryKey: any[] }) => {
    const url = String(queryKey[0]);
    const res = await fetch(withApiBase(url), {
      credentials: "include",
    });

    if (res.status === 401) {
      if (on401 === "returnNull") return null;
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed: ${res.status}`);
    }

    return res.json();
  };
}
