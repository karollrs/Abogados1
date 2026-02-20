import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { nextId } from "./helpers";

function normalizePhone(phone: string | undefined): string {
  if (!phone) return "";
  return String(phone).replace(/\D+/g, "");
}

function isRealPhone(phone: string | undefined): boolean {
  const digits = normalizePhone(phone);
  return digits.length >= 7;
}

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

export const upsertByRetellCallId = mutation({
  args: {
    retellCallId: v.string(),
    updates: v.any(),
  },
  handler: async (ctx, { retellCallId, updates }) => {
    const existingRows = await ctx.db
      .query("leads")
      .withIndex("by_retellCallId", (q) => q.eq("retellCallId", retellCallId))
      .collect();

    const existing = existingRows.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))[0];

    const allowed = [
      "name",
      "phone",
      "caseType",
      "urgency",
      "status",
      "attorneyId",
      "retellAgentId",
      "summary",
      "transcript",
      "lastContactedAt",
    ];

    const patch: any = {};
    for (const k of allowed) {
      if (updates?.[k] !== undefined) patch[k] = updates[k];
    }

    if (!existing) {
      // Dedupe defensivo: si la misma llamada llega con callId inconsistente,
      // reusar lead reciente por teléfono real para evitar duplicados visibles en CRM.
      const phone = patch.phone as string | undefined;
      if (isRealPhone(phone)) {
        const phoneDigits = normalizePhone(phone);
        const now = Date.now();
        const recentWindowMs = 30 * 60 * 1000;

        const recentByPhone = (await ctx.db.query("leads").collect())
          .filter((l) => isRealPhone(l.phone) && normalizePhone(l.phone) === phoneDigits)
          .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))[0];

        if (recentByPhone && now - (recentByPhone.createdAt ?? 0) <= recentWindowMs) {
          await ctx.db.patch(recentByPhone._id, {
            retellCallId,
            ...patch,
          });
          return await ctx.db.get(recentByPhone._id);
        }
      }

      const newId = await nextId(ctx, "leads");
      const now = Date.now();

      await ctx.db.insert("leads", {
        id: newId,
        retellCallId,
        retellAgentId: patch.retellAgentId,
        name: patch.name ?? "AI Lead",
        phone: patch.phone ?? "Unknown",
        caseType: patch.caseType,
        urgency: patch.urgency,
        status: patch.status ?? "New",
        summary: patch.summary,
        transcript: patch.transcript,
        attorneyId: patch.attorneyId,
        lastContactedAt: patch.lastContactedAt,
        createdAt: now,
      });

      const insertedRows = await ctx.db
        .query("leads")
        .withIndex("by_retellCallId", (q) => q.eq("retellCallId", retellCallId))
        .collect();
      const inserted = insertedRows.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))[0];
      if (!inserted) throw new Error("Lead upsert failed");
      return inserted;
    }

    await ctx.db.patch(existing._id, {
      retellCallId,
      ...patch,
    });

    return await ctx.db.get(existing._id);
  },
});
