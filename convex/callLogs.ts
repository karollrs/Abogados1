import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { nextId } from "./helpers";

function normalizePhone(phone: string | undefined): string {
  if (!phone) return "";
  return String(phone).replace(/\D+/g, "");
}

function isRealPhone(phone: string | undefined): boolean {
  return normalizePhone(phone).length >= 7;
}

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
    const byCallId = await ctx.db
      .query("callLogs")
      .withIndex("by_retellCallId", (q) => q.eq("retellCallId", retellCallId))
      .collect();

    const sortedByCallId = byCallId.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    const existing = sortedByCallId[0];

    // Si ya hay duplicados históricos para el mismo callId, conservamos el más reciente.
    for (const duplicate of sortedByCallId.slice(1)) {
      await ctx.db.delete(duplicate._id);
    }

    if (!existing) {
      const newId = await nextId(ctx, "callLogs");
      const now = Date.now();

      // Dedupe defensivo cuando Retell cambia callId para la misma llamada.
      // Priorizamos coincidencia por leadId (si existe) y luego por agente + teléfono
      // en una ventana corta para evitar duplicados en CRM.
      const recentWindowMs = 30 * 60 * 1000;
      const recentLogs = (await ctx.db.query("callLogs").collect())
        .filter((log) => now - (log.createdAt ?? 0) <= recentWindowMs)
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

      const incomingLeadId =
        typeof updates?.leadId === "number" && Number.isFinite(updates.leadId)
          ? updates.leadId
          : undefined;
      const incomingAgent =
        typeof updates?.agentId === "string" && updates.agentId.trim().length > 0
          ? updates.agentId.trim()
          : undefined;
      const incomingPhone =
        typeof updates?.phoneNumber === "string" && updates.phoneNumber.trim().length > 0
          ? updates.phoneNumber
          : undefined;
      const incomingPhoneDigits = normalizePhone(incomingPhone);

      const byLeadId =
        incomingLeadId == null
          ? undefined
          : recentLogs.find((log) => log.leadId != null && log.leadId === incomingLeadId);

      const byAgentAndPhone =
        incomingAgent && isRealPhone(incomingPhone)
          ? recentLogs.find((log) => {
              const sameAgent =
                typeof log.agentId === "string" && log.agentId.trim() === incomingAgent;
              const samePhone =
                isRealPhone(log.phoneNumber) &&
                normalizePhone(log.phoneNumber) === incomingPhoneDigits;
              return sameAgent && samePhone;
            })
          : undefined;

      const dedupeMatch = byLeadId || byAgentAndPhone;

      if (dedupeMatch) {
        await ctx.db.patch(dedupeMatch._id, {
          ...updates,
          retellCallId,
        });
        return await ctx.db.get(dedupeMatch._id);
      }

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
