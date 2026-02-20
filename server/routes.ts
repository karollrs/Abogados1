import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { sendAttorneyAssignmentEmail } from "./mailer";
import { requireAuth, requireAdmin } from "./auth";
import bcrypt from "bcryptjs";

function safeString(v: any, fallback = ""): string {
  if (typeof v === "string") return v;
  if (v == null) return fallback;
  return String(v);
}

function pickFirstString(...values: any[]): string | undefined {
  for (const v of values) {
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  return undefined;
}

function mapStatusFromAnalysis(
  analysis: any
): "New" | "Qualified" | "Converted" | "Disqualified" {
  if (analysis?.call_successful === true) return "Converted";
  if (analysis?.user_sentiment === "Positive") return "Qualified";
  if (analysis?.user_sentiment === "Negative") return "Disqualified";
  return "New";
}

function normalizeEvent(event: any): string {
  return String(event || "").trim().toLowerCase();
}

function pickFirstObject<T = Record<string, any>>(...values: any[]): T | undefined {
  for (const v of values) {
    if (v && typeof v === "object" && !Array.isArray(v)) return v as T;
  }
  return undefined;
}

function parseDurationSeconds(...values: any[]): number {
  for (const v of values) {
    if (typeof v !== "number" || Number.isNaN(v) || v <= 0) continue;
    // Retell usualmente manda duration_ms. Si parece ms, convertimos a segundos.
    if (v > 1000) return Math.round(v / 1000);
    return Math.round(v);
  }
  return 0;
}

function isAnalyzedEvent(e: string) {
  return (
    e === "call_analyzed" ||
    e === "call.analyzed" ||
    e === "call_analysis_ready" ||
    e === "call.analysis_ready"
  );
}
function isFinalEvent(e: string) {
  return (
    e === "call_completed" ||
    e === "call.completed" ||
    e === "call_ended" ||
    e === "call.ended" ||
    e === "call_finished" ||
    e === "call.finished"
  );
}

function hasCallData(payload: any): boolean {
  if (!payload || typeof payload !== "object") return false;
  return Boolean(
    payload.call ||
      payload.call_id ||
      payload.callId ||
      payload.transcript ||
      payload.recording_url ||
      payload.recordingUrl ||
      payload.call_analysis ||
      payload.analysis
  );
}

function normalizeSpecialties(v: any): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return [];
    if (s.startsWith("[") && s.endsWith("]")) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed))
          return parsed.map((x) => String(x).trim()).filter(Boolean);
      } catch {}
    }
    if (s.includes(",")) return s.split(",").map((x) => x.trim()).filter(Boolean);
    return [s];
  }
  return [];
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ---------------------------------------------------------------------------
  // AUTH GUARD
  // - Deja libre /api/auth/* y el webhook de Retell
  // - Protege el resto de /api/*
  // ---------------------------------------------------------------------------
  app.use((req, res, next) => {
  // Solo cuidamos /api
  if (!req.path.startsWith("/api")) return next();

  // Siempre permitir preflight
  if (req.method === "OPTIONS") return next();

  // Permitir auth
  if (req.path.startsWith("/api/auth")) return next();

  // Normaliza path (quita slash final)
  const cleanPath = req.path.replace(/\/+$/, "");

  // Permitir webhook Retell (cubre /api/retell-webhook y /api/retell-webhook/)
  const retellPath = api.webhooks.retell.path.replace(/\/+$/, "");
  if (cleanPath === retellPath) return next();

  // (Opcional) si en Retell estás usando /api/webhook también:
  if (cleanPath === "/api/webhook") return next();

  return requireAuth(req as any, res as any, next);
});


  // ---------------------------------------------------------------------------
  // AUTH ROUTES (faltaban) ✅
  // ---------------------------------------------------------------------------

  // GET /api/auth/me -> usuario actual (sesión) o 401
  app.get("/api/auth/me", async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await storage.getUserById(String(userId));
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      return res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: err?.message ?? "Failed to load user" });
    }
  });

  // POST /api/auth/login -> crea sesión
  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const email = String(req.body?.email || "").toLowerCase().trim();
      const password = String(req.body?.password || "");

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email y password son obligatorios" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ message: "Credenciales inválidas" });

      // guardar sesión
      req.session.userId = user.id;
      req.session.role = user.role;

      return res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ message: err?.message ?? "Login failed" });
    }
  });

  // POST /api/auth/logout -> destruye sesión
  app.post("/api/auth/logout", async (req: any, res) => {
    try {
      req.session?.destroy?.(() => {});
      res.clearCookie?.("connect.sid");
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ message: err?.message ?? "Logout failed" });
    }
  });

  // ---------------------------------------------------------------------------
  // DASHBOARD
  // ---------------------------------------------------------------------------
  app.get(api.leads.stats.path, async (_req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  // ✅ ASIGNAR ABOGADO (usa UUID string)
  app.post("/api/leads/:id/assign-attorney", async (req, res) => {
    try {
      const leadId = Number(req.params.id);
      const attorneyId = String(req.body?.attorneyId ?? "").trim(); // ✅ UUID

      if (!leadId || !attorneyId) {
        return res
          .status(400)
          .json({ message: "leadId y attorneyId son obligatorios" });
      }

      // 1) asignar en DB
      const lead = await storage.assignAttorneyToLead(leadId, attorneyId);

      // 2) traer abogado para email
      const attorney = await storage.getAttorney(attorneyId);
      if (!attorney) return res.status(404).json({ message: "Attorney not found" });

      // 3) enviar correo
      await sendAttorneyAssignmentEmail({
        to: attorney.email,
        attorneyName: attorney.name,
        leadName: lead.name,
        leadPhone: lead.phone,
        caseType: lead.caseType ?? null,
        urgency: lead.urgency ?? null,
      });

      return res.json({ success: true, lead, attorney });
    } catch (err: any) {
      console.error("assign-attorney error:", err);
      return res
        .status(500)
        .json({ message: err?.message ?? "Error asignando abogado" });
    }
  });

  // ---------------------------------------------------------------------------
  // LEADS
  // ---------------------------------------------------------------------------
  app.get(api.leads.list.path, async (req, res) => {
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const leads = await storage.getLeads(search, status);
    res.json(leads);
  });

  app.get(api.leads.get.path, async (req, res) => {
    const lead = await storage.getLead(Number(req.params.id));
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json(lead);
  });

  app.patch(api.leads.update.path, async (req, res) => {
    try {
      const updates = api.leads.update.input.parse(req.body);
      const lead = await storage.updateLead(Number(req.params.id), updates);
      res.json(lead);
    } catch {
      res.status(400).json({ message: "Invalid update data" });
    }
  });

  // ---------------------------------------------------------------------------
  // CALL LOGS
  // ---------------------------------------------------------------------------
  app.get("/api/call-logs", async (_req, res) => {
    try {
      const logs = await storage.getCallLogs();
      res.json(logs);
    } catch (err) {
      console.error("Error loading call logs:", err);
      res.status(500).json({ message: "Failed to load call logs" });
    }
  });

  // ---------------------------------------------------------------------------
  // ATTORNEYS
  // ---------------------------------------------------------------------------
  app.get("/api/attorneys", async (req, res) => {
    try {
      const q = String(req.query.q ?? "").trim();
      const city = String(req.query.city ?? "").trim();
      const state = String(req.query.state ?? "").trim();
      const specialty = String(req.query.specialty ?? "").trim();

      const rows = await storage.getAttorneys({
        q: q || undefined,
        city: city || undefined,
        state: state || undefined,
        specialty: specialty || undefined,
      });

      res.json(rows);
    } catch (err: any) {
      console.error("Error loading attorneys:", err);
      res.status(500).json({ message: err?.message ?? "Failed to load attorneys" });
    }
  });

  app.post("/api/attorneys", async (req, res) => {
    try {
      const body = req.body ?? {};
      const name = safeString(body.name, "").trim();
      const email = safeString(body.email, "").trim();
      if (!name || !email) {
        return res.status(400).json({ message: "name y email son obligatorios" });
      }

      const created = await storage.createAttorney({
        name,
        email,
        phone: safeString(body.phone, "").trim() || null,
        city: safeString(body.city, "").trim() || null,
        stateProvince:
          safeString(body.stateProvince ?? body.state_province, "").trim() || null,
        specialties: normalizeSpecialties(body.specialties),
      } as any);

      return res.status(201).json(created);
    } catch (err: any) {
      console.error("Error creating attorney:", err);
      return res
        .status(500)
        .json({ message: err?.message ?? "Failed to create attorney" });
    }
  });

  // ---------------------------------------------------------------------------
  // USERS (ADMIN)
  // ---------------------------------------------------------------------------
  app.get("/api/users", requireAdmin, async (_req, res) => {
    const users = await storage.listUsers();
    const safe = users.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
    return res.json(safe);
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    const email = String(req.body?.email || "").toLowerCase().trim();
    const name = String(req.body?.name || "").trim();
    const role = String(req.body?.role || "agent").trim();
    const password = String(req.body?.password || "");

    if (!email || !name || password.length < 8) {
      return res
        .status(400)
        .json({ message: "email, name y password (>=8) son obligatorios" });
    }

    const exists = await storage.getUserByEmail(email);
    if (exists) return res.status(409).json({ message: "Ese email ya existe" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await storage.createUser({ email, name, role, passwordHash });

    return res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: (user as any).role,
      isActive: (user as any).isActive,
      createdAt: user.createdAt,
      updatedAt: (user as any).updatedAt,
    });
  });

  app.patch("/api/users/:id/active", requireAdmin, async (req, res) => {
    const id = String(req.params.id);
    const isActive = Boolean(req.body?.isActive);
    const user = await storage.setUserActive(id, isActive);

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: (user as any).role,
      isActive: (user as any).isActive,
      createdAt: user.createdAt,
      updatedAt: (user as any).updatedAt,
    });
  });

  // ---------------------------------------------------------------------------
  // RETELL WEBHOOK
  // ---------------------------------------------------------------------------
  const retellWebhookHandler = async (req: any, res: any) => {
    const payload = req.body || {};
    const envelope = pickFirstObject(payload.data, payload.body, payload) || payload;
    const call = pickFirstObject(envelope.call, payload.call) || {};
    const rawEvent =
      payload.event ||
      payload.type ||
      envelope.event ||
      envelope.type ||
      payload.event_type ||
      envelope.event_type;
    const event = normalizeEvent(rawEvent);

    try {
      const callId = pickFirstString(
        call.call_id,
        call.callId,
        envelope.call_id,
        envelope.callId,
        payload.call_id,
        payload.callId
      );
      const agentId = pickFirstString(
        call.agent_id,
        call.agentId,
        envelope.agent_id,
        envelope.agentId,
        payload.agent_id,
        payload.agentId
      );

      if (!callId) return res.json({ success: true });

      const analyzed = isAnalyzedEvent(event);
      const final = isFinalEvent(event);
      // Algunos tenants de Retell mandan eventos con nombres distintos; si ya hay datos de llamada,
      // no descartamos el webhook para evitar perder registros tras reset de base.
      if (!analyzed && !final && !hasCallData(envelope) && !hasCallData(payload)) {
        return res.json({ success: true });
      }

      const callType = safeString(call.call_type, "");
      const fromNumber =
        pickFirstString(
          call.from_number,
          payload.from_number,
          call.caller_number,
          payload.caller_number,
          payload.from,
          call.from
        ) || (callType === "web_call" ? "Web Call" : "Unknown");

      const analysis =
        pickFirstObject(
          call.call_analysis,
          call.analysis,
          envelope.call_analysis,
          envelope.analysis,
          payload.call_analysis,
          payload.analysis
        ) || {};
      const transcriptSingle =
        pickFirstString(
          call.transcript,
          call.transcript_text,
          call.transcription,
          payload.transcript,
          envelope.transcript,
          call.transcript_text,
          payload.transcript_text,
          call.transcription,
          payload.transcription,
          call.call_transcript,
          payload.call_transcript,
          analysis?.transcript
        ) || null;

      let transcriptText: string | null = transcriptSingle;

      const transcriptTurns =
        (Array.isArray(call.transcript) ? call.transcript : null) ||
        (Array.isArray(call.transcript_turns) ? call.transcript_turns : null) ||
        (Array.isArray(envelope.transcript_turns) ? envelope.transcript_turns : null) ||
        (Array.isArray(payload.transcript) ? payload.transcript : null);

      if (!transcriptText && transcriptTurns) {
        transcriptText = transcriptTurns
          .map((t: any) =>
            `${t.role || t.speaker || "user"}: ${t.text || t.content || ""}`.trim()
          )
          .filter(Boolean)
          .join("\n");
      }

      const summary =
        pickFirstString(
          analysis.call_summary,
          analysis.summary,
          envelope.call_summary,
          envelope.summary,
          payload.call_summary,
          payload.summary
        ) || (transcriptText ? "Llamada recibida por Retell" : null);

      const transcriptFinal = transcriptText || analysis?.transcript || null;
      const recordingUrl =
        pickFirstString(
          call.recording_url,
          call.recordingUrl,
          envelope.recording_url,
          envelope.recordingUrl,
          payload.recording_url,
          payload.recordingUrl,
          call.recording?.url,
          envelope.recording?.url,
          payload.recording?.url
        ) || null;

      const durationSec = parseDurationSeconds(
        call.duration_ms,
        envelope.duration_ms,
        payload.duration_ms,
        call.duration,
        envelope.duration,
        payload.duration
      );

      const callStatus =
        pickFirstString(
          call.call_status,
          call.status,
          envelope.call_status,
          envelope.status,
          payload.call_status,
          payload.status
        ) || "ended";

      const cad = pickFirstObject(analysis.custom_analysis_data, analysis.customAnalysisData) || {};
      const leadName = safeString(cad.name, "AI Lead");
      const caseType = safeString(cad.case_type, "General");
      const urgency = safeString(cad.urgency, "Medium");
      const mappedStatus = analyzed ? mapStatusFromAnalysis(analysis) : "New";

      const leadData: any = {
        retellCallId: callId,
        retellAgentId: agentId,
        phone: fromNumber,
        name: leadName,
        caseType,
        urgency,
        summary: summary || undefined,
        transcript: transcriptFinal || undefined,
        status: mappedStatus,
      };

      if (!analyzed) delete leadData.status;
      const lead = await storage.upsertLeadByRetellCallId(callId, leadData);

      const logUpdates: any = {
        leadId: lead.id,
        retellCallId: callId,
        agentId,
        phoneNumber: fromNumber,
        status: callStatus,
        duration: durationSec,
        recordingUrl,
        transcript: transcriptFinal || undefined,
        summary: summary || undefined,
        analysis,
      };

      await storage.updateCallLogByRetellCallId(callId, logUpdates);

      return res.json({ success: true });
    } catch (err) {
      console.error("Webhook Error:", err);
      console.error("Webhook Payload:", JSON.stringify(req.body || {}));
      return res.status(200).json({ success: false });
    }
  };

  // Ruta principal (actual)
  app.post(api.webhooks.retell.path, retellWebhookHandler);
  // Ruta legacy documentada en README y usada en varios paneles de Retell
  app.post("/retell-webhook", retellWebhookHandler);

  return httpServer;
}
