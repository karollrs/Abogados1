import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getById = query({
  // ESTE id es tu campo legacy "attorneys.id" (string uuid)
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    return await ctx.db
      .query("attorneys")
      .withIndex("by_attorneyId", (q) => q.eq("id", id))
      .unique();
  },
});

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
        const hay = `${a.name ?? ""} ${a.email ?? ""} ${a.phone ?? ""} ${a.notes ?? ""}`.toLowerCase();
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

export const create = mutation({
  args: {
    id: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    city: v.optional(v.string()),
    stateProvince: v.optional(v.string()),
    notes: v.optional(v.string()),
    specialties: v.optional(v.array(v.string())),
  },
  handler: async (ctx, a) => {
    const now = Date.now();

    const docId = await ctx.db.insert("attorneys", {
      id: a.id,
      name: a.name,
      email: a.email,
      phone: a.phone,
      city: a.city,
      stateProvince: a.stateProvince,
      notes: a.notes,
      specialties: a.specialties ?? [],
      createdAt: now,
    });

    // Devuelve el documento recién creado
    return await ctx.db.get(docId);
  },
});
