import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { nextId } from "./helpers";

/* ============================================================
   LISTAR CALL LOGS
============================================================ */

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
        const recordingUrl =
          (log as any).recordingUrl ??
          (log as any).recording_url ??
          (log as any).recording_url_public ??
          (log as any).recording?.url ??
          (log as any).recording?.recording_url ??
          (log as any).recording?.recording_url_public ??
          (log as any).recording?.public_url ??
          (log as any).scrubbed_recording_url ??
          (log as any).recording_multi_channel_url ??
          (log as any).scrubbed_recording_multi_channel_url ??
          (log as any).analysis?.recordingUrl ??
          (log as any).analysis?.recording_url ??
          (log as any).analysis?.recording_url_public ??
          (log as any).analysis?.recording?.url ??
          (log as any).analysis?.recording?.recording_url ??
          (log as any).analysis?.recording?.recording_url_public ??
          (log as any).analysis?.post_call_analysis?.recordingUrl ??
          (log as any).analysis?.post_call_analysis?.recording_url ??
          (log as any).analysis?.post_call_analysis?.recording_url_public ??
          (log as any).analysis?.post_call_analysis?.recording?.url ??
          (log as any).analysis?.scrubbed_recording_url ??
          (log as any).analysis?.recording_multi_channel_url ??
          (log as any).analysis?.scrubbed_recording_multi_channel_url ??
          undefined;
        const pendingAttorneyId =
          (log as any).pendingAttorneyId ??
          (log as any).analysis?.assignment?.requestedAttorneyId ??
          null;
        const assignmentStatus =
          (log as any).assignmentStatus ??
          (log as any).analysis?.assignment?.decision ??
          null;

        return {
          ...log,
          recordingUrl,
          pendingAttorneyId,
          assignmentStatus,
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

/* ============================================================
   GET POR RETELL CALL ID
============================================================ */

export const getByRetellCallId = query({
  args: { retellCallId: v.string() },
  handler: async (ctx, { retellCallId }) => {
    return await ctx.db
      .query("callLogs")
      .withIndex("by_retellCallId", (q) =>
        q.eq("retellCallId", retellCallId)
      )
      .unique();
  },
});

/* ============================================================
   ACTUALIZAR STATUS DESDE FRONT
============================================================ */

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
    await ctx.db.patch(callId, { status });

    const call = await ctx.db.get(callId);
    if (!call?.leadId) return;

    const lead = await ctx.db
      .query("leads")
      .filter((q) => q.eq(q.field("id"), call.leadId))
      .unique();

    if (lead) {
      await ctx.db.patch(lead._id, { status });
    }
  },
});

/* ============================================================
   UPSERT SEGURO (ANTI-DUPLICADOS REAL)
============================================================ */

export const upsertByRetellCallId = mutation({
  args: {
    retellCallId: v.string(),
    updates: v.any(),
  },
  handler: async (ctx, { retellCallId, updates }) => {
    // 1️⃣ Buscar existente
    const existing = await ctx.db
      .query("callLogs")
      .withIndex("by_retellCallId", (q) =>
        q.eq("retellCallId", retellCallId)
      )
      .unique();

    // 2️⃣ Si existe → patch
    if (existing) {
      const summaryFromAnalysis =
        updates?.analysis?.call_summary ??
        updates?.analysis?.post_call_analysis?.call_summary ??
        null;

      await ctx.db.patch(existing._id, {
        ...updates,
        summary:
          updates.summary ??
          summaryFromAnalysis ??
          existing.summary ??
          null,
      });

      const updated = await ctx.db.get(existing._id);

      // 🔁 Sincronizar lead si cambió status
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
    }

    // 3️⃣ Si no existe → intentar insertar
    try {
      const newId = await nextId(ctx, "callLogs");
      const now = Date.now();

      const summaryFromAnalysis =
        updates?.analysis?.call_summary ??
        updates?.analysis?.post_call_analysis?.call_summary ??
        null;

      const docId = await ctx.db.insert("callLogs", {
        id: newId,
        retellCallId,
        status: "pendiente",
        createdAt: now,
        ...updates,
        summary: updates.summary ?? summaryFromAnalysis ?? null,
      });

      const inserted = await ctx.db.get(docId);

      // 🔁 Sincronizar lead
      if (updates?.leadId != null) {
        const lead = await ctx.db
          .query("leads")
          .filter((q) => q.eq(q.field("id"), updates.leadId))
          .unique();

        if (lead) {
          await ctx.db.patch(lead._id, {
            status: updates.status ?? "pendiente",
          });
        }
      }

      return inserted;

    } catch (err) {
      // 4️⃣ Si ocurre condición de carrera → reconsultar
      const retry = await ctx.db
        .query("callLogs")
        .withIndex("by_retellCallId", (q) =>
          q.eq("retellCallId", retellCallId)
        )
        .unique();

      if (retry) return retry;

      throw err;
    }
  },
});
