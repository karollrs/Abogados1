import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { nextId } from "./helpers";

export const list = query({
  args: { search: v.optional(v.string()), status: v.optional(v.string()) },
  handler: async (ctx, { search, status }) => {
    let rows;

    if (status) {
      rows = await ctx.db
        .query("leads")
        .withIndex("by_status", (q) => q.eq("status", status))
        .collect();
    } else {
      rows = await ctx.db.query("leads").collect();
    }

    const s = (search ?? "").toLowerCase().trim();

    const sorted = rows.sort(
      (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)
    );

    if (!s) return sorted;

    return sorted.filter((l) => {
      const hay = `${l.name} ${l.phone} ${l.caseType ?? ""} ${
        l.urgency ?? ""
      }`.toLowerCase();
      return hay.includes(s);
    });
  },
});

export const get = query({
  args: { id: v.number() },
  handler: async (ctx, { id }) => {
    return await ctx.db
      .query("leads")
      .filter((q) => q.eq(q.field("id"), id))
      .unique();
  },
});

export const getByRetellCallId = query({
  args: { retellCallId: v.string() },
  handler: async (ctx, { retellCallId }) => {
    return await ctx.db
      .query("leads")
      .withIndex("by_retellCallId", (q) =>
        q.eq("retellCallId", retellCallId)
      )
      .unique();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    caseType: v.optional(v.string()),
    urgency: v.optional(v.string()),
    status: v.optional(v.string()),
    attorneyId: v.optional(v.string()),
    retellCallId: v.optional(v.string()),
    retellAgentId: v.optional(v.string()),
    summary: v.optional(v.string()),
    transcript: v.optional(v.string()),
  },
  handler: async (ctx, a) => {
    const newId = await nextId(ctx, "leads");
    const now = Date.now();

    await ctx.db.insert("leads", {
      id: newId,
      name: a.name,
      phone: a.phone,
      caseType: a.caseType,
      urgency: a.urgency,
      status: a.status ?? "New",
      attorneyId: a.attorneyId,
      retellCallId: a.retellCallId,
      retellAgentId: a.retellAgentId,
      summary: a.summary,
      transcript: a.transcript,
      createdAt: now,
    });

    return await ctx.db
      .query("leads")
      .filter((q) => q.eq(q.field("id"), newId))
      .unique();
  },
});

export const update = mutation({
  args: {
    id: v.number(),
    updates: v.any(),
  },
  handler: async (ctx, { id, updates }) => {
    const lead = await ctx.db
      .query("leads")
      .filter((q) => q.eq(q.field("id"), id))
      .unique();

    if (!lead) throw new Error("Lead not found");

    const allowed = [
      "name",
      "phone",
      "caseType",
      "urgency",
      "status",
      "attorneyId",
      "retellCallId",
      "retellAgentId",
      "summary",
      "transcript",
      "lastContactedAt",
    ];

    const patch: any = {};
    for (const k of allowed) {
      if (updates?.[k] !== undefined) patch[k] = updates[k];
    }

    await ctx.db.patch(lead._id, patch);

    return await ctx.db.get(lead._id);
  },
});

export const assignAttorney = mutation({
  args: { id: v.number(), attorneyId: v.string() },
  handler: async (ctx, { id, attorneyId }) => {
    const lead = await ctx.db
      .query("leads")
      .filter((q) => q.eq(q.field("id"), id))
      .unique();

    if (!lead) throw new Error("Lead not found");

    await ctx.db.patch(lead._id, { attorneyId });

    return await ctx.db.get(lead._id);
  },
});
