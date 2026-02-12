import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// USERS
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
  },
});

/**
 * OJO: este "id" es tu id string legacy (uuid-like) guardado en el campo users.id,
 * NO es el _id de Convex.
 * Como no tienes índice por users.id (y no puedes llamarlo by_id), usamos filter.
 */
export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("id"), id))
      .unique();
  },
});

export const create = mutation({
  args: {
    id: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, a) => {
    const exists = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", a.email))
      .unique();
    if (exists) throw new Error("Ese email ya existe");

    const now = Date.now();

    await ctx.db.insert("users", {
      id: a.id,
      email: a.email,
      name: a.name,
      role: a.role,
      passwordHash: a.passwordHash,
      isActive: 1,
      createdAt: now,
      updatedAt: now,
    });

    // Buscar por campo users.id (string legacy)
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("id"), a.id))
      .unique();
  },
});

export const setActive = mutation({
  args: { id: v.string(), isActive: v.number() },
  handler: async (ctx, { id, isActive }) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("id"), id))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, { isActive, updatedAt: Date.now() });
    return await ctx.db.get(user._id);
  },
});
