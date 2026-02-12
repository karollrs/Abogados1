import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { nextId } from "./helpers";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("callLogs").collect();
    return rows.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  },
});

export const listWithLead = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db.query("callLogs").collect();
    const leads = await ctx.db.query("leads").collect();

    const leadById = new Map(leads.map((l) => [l.id, l]));

    return logs
      .map((log) => {
        const lead = log.leadId != null ? leadById.get(log.leadId) : undefined;
        return {
          ...log,
          leadId: lead?.id ?? log.leadId ?? null,
          leadName: lead?.name ?? null,
          caseType: lead?.caseType ?? null,
          urgency: lead?.urgency ?? null,
          attorneyId: lead?.attorneyId ?? null,
        };
      })
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  },
});

export const getByRetellCallId = query({
  args: { retellCallId: v.string() },
  handler: async (ctx, { retellCallId }) => {
    return await ctx.db
      .query("callLogs")
      .withIndex("by_retellCallId", (q) => q.eq("retellCallId", retellCallId))
      .unique();
  },
});

export const create = mutation({
  args: {
    leadId: v.optional(v.number()),
    retellCallId: v.string(),
    agentId: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    status: v.optional(v.string()),
    direction: v.optional(v.string()),
    duration: v.optional(v.number()),
    recordingUrl: v.optional(v.string()),
    summary: v.optional(v.string()),
    transcript: v.optional(v.string()),
    sentiment: v.optional(v.string()),
    analysis: v.optional(v.any()),
  },
  handler: async (ctx, a) => {
    const newId = await nextId(ctx, "callLogs");
    const now = Date.now();

    await ctx.db.insert("callLogs", {
      id: newId,
      leadId: a.leadId,
      retellCallId: a.retellCallId,
      agentId: a.agentId,
      phoneNumber: a.phoneNumber,
      status: a.status,
      direction: a.direction ?? "inbound",
      duration: a.duration,
      recordingUrl: a.recordingUrl,
      summary: a.summary,
      transcript: a.transcript,
      sentiment: a.sentiment,
      analysis: a.analysis,
      createdAt: now,
    });

    // Buscar por legacy id (id:number) sin índice by_id
    return await ctx.db
      .query("callLogs")
      .filter((q) => q.eq(q.field("id"), newId))
      .unique();
  },
});

export const upsertByRetellCallId = mutation({
  args: {
    retellCallId: v.string(),
    updates: v.any(),
  },
  handler: async (ctx, { retellCallId, updates }) => {
    const existing = await ctx.db
      .query("callLogs")
      .withIndex("by_retellCallId", (q) => q.eq("retellCallId", retellCallId))
      .unique();

    if (!existing) {
      const newId = await nextId(ctx, "callLogs");
      const now = Date.now();

      // OJO: updates podría traer campos raros. Si quieres lo sanitizamos como en leads.
      await ctx.db.insert("callLogs", {
        id: newId,
        retellCallId,
        createdAt: now,
        ...updates,
      });

      return await ctx.db
        .query("callLogs")
        .withIndex("by_retellCallId", (q) => q.eq("retellCallId", retellCallId))
        .unique();
    }

    await ctx.db.patch(existing._id, updates);
    return await ctx.db.get(existing._id);
  },
});
