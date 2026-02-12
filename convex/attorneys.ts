import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Obtener abogado por el ID nativo de Convex (_id)
 */
export const getById = query({
  args: { id: v.id("attorneys") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

/**
 * Listar / filtrar abogados (filtro en memoria por simplicidad)
 */
export const list = query({
  args: {
    q: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    specialty: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("attorneys").collect();

    const q = (args.q ?? "").toLowerCase().trim();
    const city = (args.city ?? "").toLowerCase().trim();
    const state = (args.state ?? "").toLowerCase().trim();
    const specialty = (args.specialty ?? "").toLowerCase().trim();

    return all.filter((a) => {
      if (q) {
        const hay = `${a.name ?? ""} ${a.email ?? ""} ${a.phone ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (city && String(a.city ?? "").toLowerCase() !== city) return false;
      if (state && String(a.stateProvince ?? "").toLowerCase() !== state) return false;

      if (specialty) {
        const specs = (a.specialties ?? []).map((s) => String(s).toLowerCase());
        if (!specs.some((s) => s.includes(specialty))) return false;
      }
      return true;
    });
  },
});

/**
 * Crear abogado (según tu schema actual)
 * - Mantiene id:string (uuid legacy)
 * - email es obligatorio
 * - specialties es obligatorio (si no llega, se usa [])
 */
export const create = mutation({
  args: {
    id: v.string(),                 // requerido por tu schema
    name: v.string(),
    email: v.string(),              // requerido por tu schema
    phone: v.optional(v.string()),
    city: v.optional(v.string()),
    stateProvince: v.optional(v.string()),
    specialties: v.optional(v.array(v.string())), // en schema es requerido, aquí lo hacemos optional y ponemos default
  },
  handler: async (ctx, a) => {
    const now = Date.now();

    const newDocId = await ctx.db.insert("attorneys", {
      id: a.id,
      name: a.name,
      email: a.email,
      phone: a.phone,
      city: a.city,
      stateProvince: a.stateProvince,
      specialties: a.specialties ?? [],
      createdAt: now,
    });

    return await ctx.db.get(newDocId);
  },
});
