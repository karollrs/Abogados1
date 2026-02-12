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
 * Base URL del backend (Render) para cuando el front corre en Vercel
 * Ej: VITE_API_URL=https://abogados1.onrender.com
 *
 * Si no existe, usa mismo origen (útil en dev si haces proxy).
 */
const RAW_API_BASE = (import.meta.env.VITE_API_URL || "").toString().trim();
const API_BASE = RAW_API_BASE.replace(/\/+$/, ""); // quita "/" final

/**
 * Convierte "/api/..." a "https://tu-backend.onrender.com/api/..."
 */
export function withApiBase(url: string) {
  if (!API_BASE) return url;

  // Si ya es absoluta, no tocar
  if (/^https?:\/\//i.test(url)) return url;

  // Asegura slash
  if (!url.startsWith("/")) return `${API_BASE}/${url}`;
  return `${API_BASE}${url}`;
}

/**
 * Parsea error de backend de forma segura.
 */
async function readError(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  // Si backend devuelve JSON {message: "..."}
  if (contentType.includes("application/json")) {
    try {
      const data = await res.json();
      return data?.message ? String(data.message) : JSON.stringify(data);
    } catch {
      // cae a texto
    }
  }

  // Si devuelve texto/HTML
  try {
    const text = await res.text();
    return text || `Request failed: ${res.status}`;
  } catch {
    return `Request failed: ${res.status}`;
  }
}

/**
 * Request helper: SIEMPRE envía cookies (sesión)
 */
export async function apiRequest(method: string, url: string, body?: unknown) {
  const res = await fetch(withApiBase(url), {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await readError(res));
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
      headers: {
        Accept: "application/json",
      },
    });

    if (res.status === 401) {
      if (on401 === "returnNull") return null;
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      throw new Error(await readError(res));
    }

    // Si no hay body (204, etc.)
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return null;

    return res.json();
  };
}
