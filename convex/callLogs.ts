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

export const updateCallStatus = mutation({
  args: {
    callId: v.id("callLogs"),
    status: v.union(
      v.literal("pendiente"),
      v.literal("en_espera_aceptacion"),
      v.literal("asignada")
    ),
  },
  handler: async (ctx, { callId, status }) => {
    // 1. Actualizar callLog
    await ctx.db.patch(callId, { status });

    // 2. Buscar callLog actualizado
    const call = await ctx.db.get(callId);
    if (!call?.leadId) return;

    // 3. Buscar lead por legacy id
    const lead = await ctx.db
      .query("leads")
      .filter((q) => q.eq(q.field("id"), call.leadId))
      .unique();

    if (!lead) return;

    // 4. Sincronizar estado del lead
    await ctx.db.patch(lead._id, {
      status,
    });
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
      status: "pendiente",
      direction: a.direction ?? "inbound",
      duration: a.duration,
      recordingUrl: a.recordingUrl,
      summary: a.summary,
      transcript: a.transcript,
      sentiment: a.sentiment,
      analysis: a.analysis,
      createdAt: now,
    });
    // 🔁 Sincronizar lead a pendiente
    if (a.leadId != null) {
      const lead = await ctx.db
        .query("leads")
        .filter((q) => q.eq(q.field("id"), a.leadId))
        .unique();

      if (lead) {
        await ctx.db.patch(lead._id, {
          status: "pendiente",
        });
      }
    }


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
      const summaryFromAnalysis =
        updates?.analysis?.call_summary ??
        updates?.analysis?.post_call_analysis?.call_summary ??
        null;

      await ctx.db.insert("callLogs", {
        id: newId,
        retellCallId,
        status: "pendiente",
        createdAt: now,
        ...updates,
        summary: updates.summary ?? summaryFromAnalysis ?? null,
      });


      if (updates?.leadId != null) {
        const lead = await ctx.db
          .query("leads")
          .filter((q) => q.eq(q.field("id"), updates.leadId))
          .unique();

        if (lead) {
          await ctx.db.patch(lead._id, {
            status: "pendiente",
          });
        }
      }



      return await ctx.db
        .query("callLogs")
        .withIndex("by_retellCallId", (q) => q.eq("retellCallId", retellCallId))
        .unique();
    }

    const summaryFromAnalysis =
      updates?.analysis?.call_summary ??
      updates?.analysis?.post_call_analysis?.call_summary ??
      null;

    await ctx.db.patch(existing._id, {
      ...updates,
      summary: updates.summary ?? summaryFromAnalysis ?? existing.summary,
    });


    const updated = await ctx.db.get(existing._id);

    // 🔁 Sincronizar lead si cambió el status
    if (updated?.leadId && updates?.status) {
      const lead = await ctx.db
        .query("leads")
        .filter((q) => q.eq(q.field("id"), updated.leadId))
        .unique();

      if (lead) {
        await ctx.db.patch(lead._id, {
          status: updates.status,
        });
      }
    }

    return updated;

  },
});
