import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { nextId } from "./helpers";


function normalizeLeadStatus(value: unknown): string {
  const s = String(value ?? "").trim().toLowerCase();

  if (!s || s === "new" || s === "pending" || s === "pendiente") {
    return "pendiente";
  }

  if (
    s === "en_espera_aceptacion" ||
    s === "en espera de aceptacion" ||
    s === "en revision" ||
    s === "en_revision" ||
    s === "review" ||
    s === "in_review" ||
    s === "pendiente_aprobacion_abogado"
  ) {
    return "en_espera_aceptacion";
  }

  if (s === "asignada" || s === "assigned") {
    return "asignada";
  }

  return s;
}

/* ============================= */
/* LIST LEADS */
/* ============================= */

export const list = query({
  args: { search: v.optional(v.string()), status: v.optional(v.string()) },
  handler: async (ctx, { search, status }) => {
    const rows = await ctx.db.query("leads").collect();

    const statusFilter = status ? normalizeLeadStatus(status) : undefined;

    const normalizedRows = rows.map((l) => ({
      ...l,
      status: normalizeLeadStatus(l.status),
    }));

    const s = (search ?? "").toLowerCase().trim();

    const sorted = normalizedRows.sort(
      (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)
    );

    const statusFiltered = statusFilter
      ? sorted.filter((l) => l.status === statusFilter)
      : sorted;

    if (!s) return statusFiltered;

    return statusFiltered.filter((l) => {
      const hay = `${l.name} ${l.phone} ${l.caseType ?? ""} ${
        l.urgency ?? ""
      }`.toLowerCase();
      return hay.includes(s);
    });
  },
});

/* ============================= */
/* CREATE LEAD */
/* ============================= */

export const create = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    practiceArea: v.string(),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const newId = await nextId(ctx, "leads");
    const now = Date.now();

    await ctx.db.insert("leads", {
      id: newId,
      name: args.name,
      phone: args.phone,
      practiceArea: args.practiceArea,
      source: args.source,
      status: "pendiente",
      createdAt: now,
    });

    return newId;
  },
});

/* ============================= */
/* GET LEAD */
/* ============================= */

export const get = query({
  args: { id: v.number() },
  handler: async (ctx, { id }) => {
    return await ctx.db
      .query("leads")
      .filter((q) => q.eq(q.field("id"), id))
      .unique();
  },
});

/* ============================= */
/* UPDATE LEAD */
/* ============================= */

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
      "summary",
      "transcript",
      "lastContactedAt",
    ];

    const patch: any = {};
    for (const k of allowed) {
      if (updates?.[k] !== undefined) {
        patch[k] = updates[k];
      }
    }

    await ctx.db.patch(lead._id, patch);
    return await ctx.db.get(lead._id);
  },
});

/* ============================= */
/* ASSIGN ATTORNEY */
/* ============================= */

export const assignAttorney = mutation({
  args: { id: v.number(), attorneyId: v.string() },
  handler: async (ctx, { id, attorneyId }) => {
    const lead = await ctx.db
      .query("leads")
      .filter((q) => q.eq(q.field("id"), id))
      .unique();

    if (!lead) throw new Error("Lead not found");

    await ctx.db.patch(lead._id, {
      attorneyId,
      status: "asignada",
    });

    return await ctx.db.get(lead._id);
  },
});

export const createManualLead = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    practiceArea: v.string(),
    data: v.any(),
  },

  handler: async (ctx, args) => {
    const newId = await nextId(ctx, "leads");
    const callLogId = await nextId(ctx, "callLogs");
    const now = Date.now();

    // 1️⃣ Crear Lead (solo campos válidos del schema)
    await ctx.db.insert("leads", {
      id: newId,
      name: args.name,
      phone: args.phone,
      practiceArea: args.practiceArea,
      source: "manual",
      status: "pendiente",
      createdAt: now,
    });

    // 2️⃣ Guardar intake en tabla correcta
    await ctx.db.insert("intakes", {
      leadId: newId,
      practiceArea: args.practiceArea,
      data: args.data,
      createdAt: now,
    });

    // 3️⃣ Crear CallLog compatible con schema
    await ctx.db.insert("callLogs", {
      id: callLogId,
      leadId: newId,
      retellCallId: `manual-${newId}-${now}`,
      status: "completed",
      direction: "manual",
      createdAt: now,
    });

    return newId;
  },
});