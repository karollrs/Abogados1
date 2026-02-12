import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =============================================================================
// TABLES
// =============================================================================

export const attorneys = pgTable("attorneys", {
  // ✅ En Neon lo tienes como UUID (según tu captura). Debe ser uuid().
  id: uuid("id").primaryKey(),

  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  city: text("city"),
  stateProvince: text("state_province"),

  // ✅ Postgres text[] real
  specialties: text("specialties").array().notNull().default(sql`ARRAY[]::text[]`),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("Unknown Lead"),
  phone: text("phone").notNull(),
  caseType: text("case_type").default("General"),
  urgency: text("urgency").default("Medium"),
  status: text("status").notNull().default("New"),

  // ✅ FK a UUID
  attorneyId: uuid("attorney_id").references(() => attorneys.id),

  retellCallId: text("retell_call_id").unique(),
  retellAgentId: text("retell_agent_id"),
  summary: text("summary"),
  transcript: text("transcript"),
  lastContactedAt: timestamp("last_contacted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const callLogs = pgTable("call_logs", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id),
  retellCallId: text("retell_call_id").notNull().unique(),
  agentId: text("agent_id"),
  phoneNumber: text("phone_number"),
  status: text("status"),
  direction: text("direction").default("inbound"),
  duration: integer("duration"),
  recordingUrl: text("recording_url"),

  summary: text("summary"),
  transcript: text("transcript"),
  sentiment: text("sentiment"),

  analysis: jsonb("analysis"),
  createdAt: timestamp("created_at").defaultNow(),
});

// =============================================================================
// USERS (AUTH)
// =============================================================================

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("agent"), // agent | admin
  passwordHash: text("password_hash").notNull(),
  isActive: integer("is_active").notNull().default(1), // 1=active, 0=disabled
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// =============================================================================
// RELATIONS
// =============================================================================

export const attorneysRelations = relations(attorneys, ({ many }) => ({
  leads: many(leads),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  attorney: one(attorneys, {
    fields: [leads.attorneyId],
    references: [attorneys.id],
  }),
  callLogs: many(callLogs),
}));

export const callLogsRelations = relations(callLogs, ({ one }) => ({
  lead: one(leads, {
    fields: [callLogs.leadId],
    references: [leads.id],
  }),
}));

export const usersRelations = relations(users, ({}) => ({}));

// =============================================================================
// ZOD
// =============================================================================

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  lastContactedAt: true,
});

export const insertCallLogSchema = createInsertSchema(callLogs).omit({
  id: true,
  createdAt: true,
});

export const insertAttorneySchema = createInsertSchema(attorneys).omit({
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
  passwordHash: true,
  id: true,
});

// =============================================================================
// TYPES
// =============================================================================

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type CallLog = typeof callLogs.$inferSelect;
export type InsertCallLog = z.infer<typeof insertCallLogSchema>;

export type Attorney = typeof attorneys.$inferSelect;
export type InsertAttorney = z.infer<typeof insertAttorneySchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema> & { password: string };

export type CreateLeadRequest = InsertLead;
export type UpdateLeadRequest = Partial<InsertLead>;

// =============================================================================
// DASHBOARD STATS
// =============================================================================

export interface DashboardStats {
  totalLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  avgResponseTimeMinutes: number;
}
