import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  counters: defineTable({
    name: v.string(),
    value: v.number(),
  }).index("by_name", ["name"]),

  users: defineTable({
    id: v.string(), // uuid-like string used by session/auth
    email: v.string(),
    name: v.string(),
    role: v.string(), // "admin" | "agent" | "abogado"
    passwordHash: v.string(),
    isActive: v.number(), // 1 active, 0 disabled
    createdAt: v.number(),
    updatedAt: v.number(),
  })

    .index("by_email", ["email"]),

attorneys: defineTable({
  id: v.string(),
  name: v.string(),
  email: v.string(),
  phone: v.optional(v.string()),
  city: v.optional(v.string()),
  stateProvince: v.optional(v.string()),
  notes: v.optional(v.string()),
  specialties: v.array(v.string()),
  createdAt: v.number(),
})
  .index("by_email", ["email"])
  .index("by_city", ["city"])
  .index("by_stateProvince", ["stateProvince"])
  .index("by_attorneyId", ["id"]),

  leads: defineTable({
    id: v.number(), // legacy numeric id used by your UI/routes
    name: v.string(),
    phone: v.string(),
    caseType: v.optional(v.string()),
    urgency: v.optional(v.string()),
    status: v.string(),
    attorneyId: v.optional(v.string()), // attorney uuid
    retellCallId: v.optional(v.string()),
    retellAgentId: v.optional(v.string()),
    summary: v.optional(v.string()),
    transcript: v.optional(v.string()),
    lastContactedAt: v.optional(v.number()),
    createdAt: v.number(),
email: v.optional(v.string()),
city: v.optional(v.string()),
age: v.optional(v.number()),
  })
    
    .index("by_status", ["status"])
    .index("by_retellCallId", ["retellCallId"]),

  callLogs: defineTable({
    id: v.number(), // legacy numeric id
    leadId: v.optional(v.number()), // legacy lead id
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
    city: v.optional(v.string()),
    stateProvince: v.optional(v.string()),
    location: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    caseType: v.optional(v.string()),
    caseNotes: v.optional(v.string()),
    analysis: v.optional(v.any()),
    pendingAttorneyId: v.optional(v.string()),
    assignmentStatus: v.optional(v.string()), // pending | accepted | rejected
    assignmentNotes: v.optional(v.string()),
    assignmentRequestedAt: v.optional(v.number()),
    assignmentDecisionAt: v.optional(v.number()),
    assignmentDecisionByAttorneyId: v.optional(v.string()),
    assignmentDecisionNotes: v.optional(v.string()),
    createdAt: v.number(),
  })
    
    .index("by_retellCallId", ["retellCallId"])
    .index("by_leadId", ["leadId"]),
});
