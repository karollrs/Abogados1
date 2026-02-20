import { convexClient } from "./convexClient";
import { randomUUID } from "node:crypto";
import type {
  Lead,
  InsertLead,
  UpdateLeadRequest,
  CallLog,
  InsertCallLog,
  DashboardStats,
  Attorney,
  InsertAttorney,
  User,
} from "@shared/types";
import type { Id } from "../convex/_generated/dataModel";


// Normalizador fuerte para specialties
function normalizeSpecialties(v: any): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);

  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return [];

    if (s.startsWith("[") && s.endsWith("]")) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed.map((x) => String(x).trim()).filter(Boolean);
      } catch {}
    }

    if (s.includes(",")) return s.split(",").map((x) => x.trim()).filter(Boolean);
    return [s];
  }

  return [];
}

export interface IStorage {
  // Leads
  getLeads(search?: string, status?: string): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  getLeadByRetellCallId(retellCallId: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, updates: UpdateLeadRequest): Promise<Lead>;
  assignAttorneyToLead(leadId: number, attorneyId: string): Promise<Lead>;

  // Call Logs
  getCallLogs(): Promise<any[]>;
  createCallLog(log: InsertCallLog): Promise<CallLog>;
  getCallLogByRetellCallId(retellCallId: string): Promise<CallLog | undefined>;
  updateCallLogByRetellCallId(retellCallId: string, updates: Partial<InsertCallLog>): Promise<CallLog>;

  // Attorneys
  getAttorneys(filters?: { q?: string; city?: string; state?: string; specialty?: string }): Promise<Attorney[]>;
  createAttorney(attorney: InsertAttorney): Promise<Attorney>;
  getAttorney(attorneyId: string): Promise<Attorney | undefined>;

  // Stats
  getDashboardStats(): Promise<DashboardStats>;

  // Users (Auth)
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  listUsers(): Promise<User[]>;
  createUser(user: { email: string; name: string; role: string; passwordHash: string; id?: string }): Promise<User>;
  setUserActive(id: string, isActive: boolean): Promise<User>;
}

export class ConvexStorage implements IStorage {
  // -------------------------
  // Leads
  // -------------------------
  async getLeads(search?: string, status?: string): Promise<Lead[]> {
    const { client, api } = convexClient();
    const rows: any[] = await client.query(api.leads.list, {
      search: search || undefined,
      status: status && status !== "All" ? status : undefined,
    });
    // Convert timestamps to Date objects to match old shape if needed
    return rows.map((l) => ({
      ...l,
      createdAt: l.createdAt ? new Date(l.createdAt) : null,
      lastContactedAt: l.lastContactedAt ? new Date(l.lastContactedAt) : null,
    })) as any;
  }

  async getLead(id: number): Promise<Lead | undefined> {
    const { client, api } = convexClient();
    const l: any = await client.query(api.leads.get, { id });
    if (!l) return undefined;
    return {
      ...l,
      createdAt: l.createdAt ? new Date(l.createdAt) : null,
      lastContactedAt: l.lastContactedAt ? new Date(l.lastContactedAt) : null,
    } as any;
  }

  async getLeadByRetellCallId(retellCallId: string): Promise<Lead | undefined> {
    const { client, api } = convexClient();
    const l: any = await client.query(api.leads.getByRetellCallId, { retellCallId });
    if (!l) return undefined;
    return {
      ...l,
      createdAt: l.createdAt ? new Date(l.createdAt) : null,
      lastContactedAt: l.lastContactedAt ? new Date(l.lastContactedAt) : null,
    } as any;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const { client, api } = convexClient();
    const created: any = await client.mutation(api.leads.create, {
      name: (lead as any).name ?? "Unknown Lead",
      phone: (lead as any).phone,
      caseType: (lead as any).caseType ?? "General",
      urgency: (lead as any).urgency ?? "Medium",
      status: (lead as any).status ?? "New",
      attorneyId: (lead as any).attorneyId ?? undefined,
      retellCallId: (lead as any).retellCallId ?? undefined,
      retellAgentId: (lead as any).retellAgentId ?? undefined,
      summary: (lead as any).summary ?? undefined,
      transcript: (lead as any).transcript ?? undefined,
    });
    return {
      ...created,
      createdAt: created.createdAt ? new Date(created.createdAt) : null,
      lastContactedAt: created.lastContactedAt ? new Date(created.lastContactedAt) : null,
    } as any;
  }

  async updateLead(id: number, updates: UpdateLeadRequest): Promise<Lead> {
    const { client, api } = convexClient();
    const mapped: any = { ...updates };
    // convert Date -> number
    if ((mapped as any).lastContactedAt instanceof Date) mapped.lastContactedAt = (mapped as any).lastContactedAt.getTime();
    const updated: any = await client.mutation(api.leads.update, { id, updates: mapped });
    return {
      ...updated,
      createdAt: updated.createdAt ? new Date(updated.createdAt) : null,
      lastContactedAt: updated.lastContactedAt ? new Date(updated.lastContactedAt) : null,
    } as any;
  }

  async assignAttorneyToLead(leadId: number, attorneyId: string): Promise<Lead> {
    const { client, api } = convexClient();
    const updated: any = await client.mutation(api.leads.assignAttorney, { id: leadId, attorneyId });
    return {
      ...updated,
      createdAt: updated.createdAt ? new Date(updated.createdAt) : null,
      lastContactedAt: updated.lastContactedAt ? new Date(updated.lastContactedAt) : null,
    } as any;
  }

  // -------------------------
  // Call Logs
  // -------------------------
  async getCallLogs(): Promise<any[]> {
    const { client, api } = convexClient();
    const rows: any[] = await client.query(api.callLogs.listWithLead, {});
    return rows.map((r) => ({
      ...r,
      createdAt: r.createdAt ? new Date(r.createdAt) : null,
    }));
  }

  async createCallLog(log: InsertCallLog): Promise<CallLog> {
    const { client, api } = convexClient();
    const created: any = await client.mutation(api.callLogs.upsertByRetellCallId, {
      retellCallId: (log as any).retellCallId,
      updates: {
        leadId: (log as any).leadId ?? undefined,
        agentId: (log as any).agentId ?? undefined,
        phoneNumber: (log as any).phoneNumber ?? undefined,
        status: (log as any).status ?? undefined,
        direction: (log as any).direction ?? undefined,
        duration: (log as any).duration ?? undefined,
        recordingUrl: (log as any).recordingUrl ?? undefined,
        summary: (log as any).summary ?? undefined,
        transcript: (log as any).transcript ?? undefined,
        sentiment: (log as any).sentiment ?? undefined,
        city: (log as any).city ?? undefined,
        stateProvince: (log as any).stateProvince ?? undefined,
        location: (log as any).location ?? undefined,
        email: (log as any).email ?? undefined,
        address: (log as any).address ?? undefined,
        caseType: (log as any).caseType ?? undefined,
        caseNotes: (log as any).caseNotes ?? undefined,
        analysis: (log as any).analysis ?? undefined,
        pendingAttorneyId: (log as any).pendingAttorneyId ?? undefined,
        assignmentStatus: (log as any).assignmentStatus ?? undefined,
        assignmentNotes: (log as any).assignmentNotes ?? undefined,
        assignmentRequestedAt: (log as any).assignmentRequestedAt ?? undefined,
        assignmentDecisionAt: (log as any).assignmentDecisionAt ?? undefined,
        assignmentDecisionByAttorneyId:
          (log as any).assignmentDecisionByAttorneyId ?? undefined,
        assignmentDecisionNotes:
          (log as any).assignmentDecisionNotes ?? undefined,
      },
    });
    return { ...created, createdAt: created.createdAt ? new Date(created.createdAt) : null } as any;
  }

  async getCallLogByRetellCallId(retellCallId: string): Promise<CallLog | undefined> {
    const { client, api } = convexClient();
    const row: any = await client.query(api.callLogs.getByRetellCallId, { retellCallId });
    if (!row) return undefined;
    return { ...row, createdAt: row.createdAt ? new Date(row.createdAt) : null } as any;
  }

  async updateCallLogByRetellCallId(retellCallId: string, updates: Partial<InsertCallLog>): Promise<CallLog> {
    const { client, api } = convexClient();
    const patch: any = { ...updates };
    const row: any = await client.mutation(api.callLogs.upsertByRetellCallId, { retellCallId, updates: patch });
    return { ...row, createdAt: row.createdAt ? new Date(row.createdAt) : null } as any;
  }

  // -------------------------
  // Attorneys
  // -------------------------
  async getAttorney(attorneyId: string): Promise<Attorney | undefined> {
    const { client, api } = convexClient();
    const row: any = await client.query(api.attorneys.getById, { id: attorneyId as Id<"attorneys"> });
    if (!row) return undefined;
    return { ...row, createdAt: row.createdAt ? new Date(row.createdAt) : null } as any;
  }

  async getAttorneys(filters?: { q?: string; city?: string; state?: string; specialty?: string }): Promise<Attorney[]> {
    const { client, api } = convexClient();
    const rows: any[] = await client.query(api.attorneys.list, {
      q: filters?.q || undefined,
      city: filters?.city || undefined,
      state: filters?.state || undefined,
      specialty: filters?.specialty || undefined,
    });
    return rows.map((a) => ({ ...a, createdAt: a.createdAt ? new Date(a.createdAt) : null })) as any;
  }

  async createAttorney(attorney: InsertAttorney): Promise<Attorney> {
    const { client, api } = convexClient();
    const created: any = await client.mutation(api.attorneys.create, {
      id: (attorney as any).id || randomUUID(),
      name: (attorney as any).name,
      email: (attorney as any).email,
      phone: (attorney as any).phone ?? undefined,
      city: (attorney as any).city ?? undefined,
      stateProvince: (attorney as any).stateProvince ?? undefined,
      notes: (attorney as any).notes ?? undefined,
      specialties: normalizeSpecialties((attorney as any).specialties),
    });
    return { ...created, createdAt: created.createdAt ? new Date(created.createdAt) : null } as any;
  }

  async upsertLeadByRetellCallId(retellCallId: string, data: any) {
  const { client, api } = convexClient();
  return await client.mutation(api.leads.upsertByRetellCallId, {
    retellCallId,
    data,
  });
}

  // -------------------------
  // Stats
  // -------------------------
  async getDashboardStats(): Promise<DashboardStats> {
    const { client, api } = convexClient();
    return (await client.query(api.stats.dashboard, {})) as any;
  }

  // -------------------------
  // Users (Auth)
  // -------------------------
  async getUserById(id: string): Promise<User | undefined> {
    const { client, api } = convexClient();
    const u: any = await client.query(api.users.getById, { id });
    return u as any;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { client, api } = convexClient();
    const u: any = await client.query(api.users.getByEmail, { email: email.toLowerCase().trim() });
    return u as any;
  }

  async listUsers(): Promise<User[]> {
    const { client, api } = convexClient();
    const rows: any[] = await client.query(api.users.list, {});
    return rows as any;
  }

  async createUser(user: { email: string; name: string; role: string; passwordHash: string; id?: string }): Promise<User> {
    const { client, api } = convexClient();
    const id = user.id || randomUUID();
    const created: any = await client.mutation(api.users.create, {
      id,
      email: user.email.toLowerCase().trim(),
      name: user.name.trim(),
      role: user.role,
      passwordHash: user.passwordHash,
    });
    return created as any;
  }

  async setUserActive(id: string, isActive: boolean): Promise<User> {
    const { client, api } = convexClient();
    const updated: any = await client.mutation(api.users.setActive, { id, isActive: isActive ? 1 : 0 });
    return updated as any;
  }
}

export const storage = new ConvexStorage();
