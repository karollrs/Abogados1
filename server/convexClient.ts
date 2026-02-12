import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

let _client: ConvexHttpClient | null = null;

export function convexClient(): { client: ConvexHttpClient; api: typeof api } {
  const url = process.env.CONVEX_URL || process.env.CONVEX_HTTP_URL || "";
  if (!url) {
    throw new Error("CONVEX_URL no está configurada. Ejecuta `npx convex dev` y copia la URL en tu .env");
  }
  if (!_client) _client = new ConvexHttpClient(url);
  return { client: _client, api };
}

console.log("CONVEX_URL backend =", process.env.CONVEX_URL);
