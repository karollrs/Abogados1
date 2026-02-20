import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({

  // ============================================================
  // ATTORNEYS
  // ============================================================

  attorneys: defineTable({
    id: v.number(), // legacy id incremental
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    city: v.optional(v.string()),
    stateProvince: v.optional(v.string()),
    specialties: v.array(v.string()),
    createdAt: v.number(),
  })
    .index("by_id", ["id"])
    .index("by_email", ["email"]),

  // ============================================================
  // LEADS
  // ============================================================

  leads: defineTable({
    id: v.number(), // IMPORTANTE: lo usas como legacy id
    name: v.string(),
    phone: v.string(),

    caseType: v.optional(v.string()),
    urgency: v.optional(v.string()),

    status: v.string(),

    attorneyId: v.optional(v.number()),

    retellCallId: v.optional(v.string()),
    retellAgentId: v.optional(v.string()),

    summary: v.optional(v.string()),
    transcript: v.optional(v.string()),

    lastContactedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_id", ["id"])
    .index("by_retellCallId", ["retellCallId"])
    .index("by_status", ["status"]),

  // ============================================================
  // CALL LOGS
  // ============================================================

  callLogs: defineTable({
    id: v.number(), // legacy incremental id

    leadId: v.optional(v.number()),

    retellCallId: v.string(),

    agentId: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),

    status: v.string(),

    direction: v.optional(v.string()),
    duration: v.optional(v.number()),

    recordingUrl: v.optional(v.string()),

    summary: v.optional(v.string()),
    transcript: v.optional(v.string()),
    sentiment: v.optional(v.string()),

    analysis: v.optional(v.any()),

    createdAt: v.number(),
  })
    .index("by_id", ["id"])
    .index("by_retellCallId", ["retellCallId"])
    .index("by_leadId", ["leadId"])
    .index("by_status", ["status"]),

  // ============================================================
  // COUNTERS (para nextId)
  // ============================================================

  counters: defineTable({
    name: v.string(),
    value: v.number(),
  }).index("by_name", ["name"]),

});
