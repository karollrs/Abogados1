import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { requireAuth, requireAdmin } from "./auth";
import bcrypt from "bcryptjs";
import { sendAttorneyAssignmentEmail } from "./mailer";

/* ============================================================
   HELPERS
============================================================ */

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

function extractRecordingUrl(
  payload: any,
  call: any,
  analysis: any,
  retellCallDetails?: any
): string | undefined {
  const post = analysis?.post_call_analysis || {};

  return pickFirstString(
    call?.recordingUrl,
    call?.recording_url,
    call?.recording_url_public,
    call?.recording?.url,
    call?.recording?.recording_url,
    call?.recording?.recording_url_public,
    call?.recording?.public_url,
    payload?.recordingUrl,
    payload?.recording_url,
    payload?.recording_url_public,
    payload?.recording?.url,
    payload?.recording?.recording_url,
    payload?.recording?.recording_url_public,
    payload?.recording?.public_url,
    analysis?.recordingUrl,
    analysis?.recording_url,
    analysis?.recording_url_public,
    analysis?.recording?.url,
    analysis?.recording?.recording_url,
    analysis?.recording?.recording_url_public,
    post?.recordingUrl,
    post?.recording_url,
    post?.recording_url_public,
    post?.recording?.url,
    post?.recording?.recording_url,
    post?.recording?.recording_url_public,
    retellCallDetails?.recording_url,
    retellCallDetails?.recordingUrl,
    retellCallDetails?.scrubbed_recording_url,
    retellCallDetails?.recording_multi_channel_url,
    retellCallDetails?.scrubbed_recording_multi_channel_url
  );
}

async function fetchRetellCallById(callId: string): Promise<any | null> {
  const apiKey = safeString(process.env.RETELL_API_KEY).trim();
  if (!apiKey) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const r = await fetch(
      `https://api.retellai.com/v2/get-call/${encodeURIComponent(callId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!r.ok) {
      console.warn(`[RETELL] get-call failed ${r.status} for callId=${callId}`);
      return null;
    }

    return await r.json();
  } catch (err: any) {
    console.warn(
      `[RETELL] get-call error for callId=${callId}: ${err?.message ?? "unknown"}`
    );
    return null;
  }
}

function normalizeEvent(event: any): string {
  return String(event || "").trim().toLowerCase();
}

function isAnalyzedEvent(e: string) {
  return e === "call_analyzed" || e === "call.analyzed";
}

function isFinalEvent(e: string) {
  return (
    e === "call_completed" ||
    e === "call.completed" ||
    e === "call_ended" ||
    e === "call.ended"
  );
}

function mapStatusFromAnalysis(
  analysis: any
): "pendiente" | "en_espera_aceptacion" | "asignada" {
  if (analysis?.call_successful === true) return "asignada";
  if (analysis?.user_sentiment === "Positive")
    return "en_espera_aceptacion";
  return "pendiente";
}

function toTimeMs(v: any): number {
  if (v instanceof Date) return v.getTime();
  if (typeof v === "number") return v;
  return 0;
}

function normalizeUserRole(v: any): "admin" | "agent" | "abogado" | null {
  const role = String(v ?? "")
    .toLowerCase()
    .trim();
  if (role === "admin" || role === "agent" || role === "abogado") return role;
  return null;
}

function toPublicUser(u: any) {
  return {
    id: String(u?.id ?? ""),
    email: String(u?.email ?? ""),
    name: String(u?.name ?? ""),
    role: normalizeUserRole(u?.role) ?? "agent",
    isActive: Number(u?.isActive ?? 1),
    createdAt: Number(u?.createdAt ?? 0),
    updatedAt: Number(u?.updatedAt ?? 0),
  };
}

/* ============================================================
   ROUTES
============================================================ */

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  /* ================= AUTH GUARD ================= */

  app.use((req, res, next) => {
    if (!req.path.startsWith("/api")) return next();
    if (req.method === "OPTIONS") return next();
    if (req.path.startsWith("/api/auth")) return next();

    const cleanPath = req.path.replace(/\/+$/, "");
    const retellPath = api.webhooks.retell.path.replace(/\/+$/, "");

    if (cleanPath === retellPath || cleanPath === "/api/webhook")
      return next();

    return requireAuth(req as any, res as any, next);
  });

  /* ================= LOGIN ================= */

  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const email = String(req.body?.email || "")
        .toLowerCase()
        .trim();
      const password = String(req.body?.password || "");

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email y password obligatorios" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || !(user as any).passwordHash) {
        return res
          .status(401)
          .json({ message: "Credenciales invÃ¡lidas" });
      }

      const ok = await bcrypt.compare(password, String((user as any).passwordHash));
      if (!ok) {
        return res
          .status(401)
          .json({ message: "Credenciales invÃ¡lidas" });
      }

      (req.session as any).userId = user.id;
      const normalizedRole = normalizeUserRole((user as any).role) ?? "agent";
      (req.session as any).role = normalizedRole;

      return res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: normalizedRole,
        },
      });
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: err?.message ?? "Login failed" });
    }
  });

  app.post("/api/auth/logout", async (req: any, res) => {
    req.session?.destroy?.(() => {});
    res.clearCookie?.("connect.sid");
    return res.json({ success: true });
  });

  /* ================= USERS (ADMIN) ================= */

  app.get("/api/users", requireAdmin as any, async (_req, res) => {
    try {
      const users = await storage.listUsers();
      return res.json(users.map((u: any) => toPublicUser(u)));
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: err?.message ?? "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireAdmin as any, async (req, res) => {
    try {
      const email = safeString(req.body?.email).toLowerCase().trim();
      const name = safeString(req.body?.name).trim();
      const role = normalizeUserRole(req.body?.role);
      const password = safeString(req.body?.password);

      if (!email || !name || !role || password.length < 8) {
        return res.status(400).json({
          message:
            "email, name, role (admin|agent|abogado) y password (>=8) son obligatorios",
        });
      }

      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "Ese email ya existe" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const created = await storage.createUser({
        email,
        name,
        role,
        passwordHash,
      });

      return res.status(201).json(toPublicUser(created));
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: err?.message ?? "Failed to create user" });
    }
  });

  app.patch("/api/users/:id/active", requireAdmin as any, async (req, res) => {
    try {
      const id = safeString(req.params.id).trim();
      const isActiveRaw = req.body?.isActive;
      const isActive =
        typeof isActiveRaw === "boolean"
          ? isActiveRaw
          : String(isActiveRaw ?? "")
              .toLowerCase()
              .trim() === "true";

      if (!id) {
        return res.status(400).json({ message: "id es obligatorio" });
      }

      const updated = await storage.setUserActive(id, isActive);
      return res.json(toPublicUser(updated));
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: err?.message ?? "Failed to update user" });
    }
  });

  /* ================= CALL LOGS ================= */

  app.get("/api/call-logs", async (_req, res) => {
    const logs = await storage.getCallLogs();
    res.json(logs);
  });

  /* ================= LEADS ================= */

  app.get(api.leads.list.path, async (req, res) => {
    const search = req.query.search as string | undefined;
    const status = req.query.status as string | undefined;
    const leads = await storage.getLeads(search, status);
    res.json(leads);
  });

  app.get(api.leads.stats.path, async (_req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  app.post("/api/leads/:id/assign-attorney", async (req, res) => {
    try {
      const leadId = Number(req.params.id);
      const attorneyId = safeString(req.body?.attorneyId).trim();
      const retellCallId = safeString(req.body?.retellCallId).trim();
      const assignmentNotes = safeString(req.body?.assignmentNotes).trim();
      if (!Number.isFinite(leadId)) {
        return res.status(400).json({ message: "leadId invalido" });
      }
      if (!attorneyId) {
        return res.status(400).json({ message: "attorneyId es obligatorio" });
      }
      const [lead, attorney] = await Promise.all([
        storage.getLead(leadId),
        storage.getAttorney(attorneyId),
      ]);
      if (!lead) {
        return res.status(404).json({ message: "Lead no encontrado" });
      }
      if (!attorney) {
        return res.status(404).json({ message: "Abogado no encontrado" });
      }
      const logs = await storage.getCallLogs();
      const targetLog =
        (retellCallId
          ? logs.find(
              (l: any) =>
                String(l?.retellCallId ?? "") === retellCallId &&
                Number(l?.leadId ?? 0) === leadId
            )
          : null) ??
        logs
          .filter((l: any) => Number(l?.leadId) === leadId)
          .sort(
            (a: any, b: any) => toTimeMs(b?.createdAt) - toTimeMs(a?.createdAt)
          )[0] ??
        null;
      if (!targetLog?.retellCallId) {
        return res.status(404).json({
          message: "No encontre call log para este lead",
        });
      }
      const updatedLead = await storage.updateLead(leadId, {
        status: "en_espera_aceptacion",
      } as any);
      const assignedCall = await storage.updateCallLogByRetellCallId(
        String(targetLog.retellCallId),
        {
          leadId,
          status: "pendiente_aprobacion_abogado",
          pendingAttorneyId: attorneyId,
          assignmentStatus: "pending",
          assignmentNotes: assignmentNotes || undefined,
          assignmentRequestedAt: Date.now(),
        } as any
      );
      const appBaseUrl =
        process.env.APP_URL?.trim() || `${req.protocol}://${req.get("host")}`;
      const assignedCallUrl = assignedCall?.retellCallId
        ? `${appBaseUrl}/attorney-call?callId=${encodeURIComponent(
            String(assignedCall.retellCallId)
          )}`
        : `${appBaseUrl}/attorney-call`;
      let mailSent = false;
      let mailError: string | null = null;
      try {
        await sendAttorneyAssignmentEmail({
          to: String((attorney as any).email ?? ""),
          attorneyName: String((attorney as any).name ?? "Abogado"),
          leadName: String((updatedLead as any).name ?? "Lead"),
          leadPhone: String((updatedLead as any).phone ?? "N/A"),
          caseType: ((updatedLead as any).caseType ?? null) as string | null,
          urgency: ((updatedLead as any).urgency ?? null) as string | null,
          notes: assignmentNotes || undefined,
          callUrl: assignedCallUrl,
        });
        mailSent = true;
      } catch (err: any) {
        mailError = err?.message ?? "No se pudo enviar correo";
        console.error("Assignment mail error:", err);
      }
      return res.json({
        success: true,
        lead: updatedLead,
        attorney,
        call: assignedCall,
        assignedCallUrl,
        assignmentPayload: {
          attorneyName: String((attorney as any).name ?? "Abogado"),
          attorneyEmail: String((attorney as any).email ?? ""),
          leadName: String((updatedLead as any).name ?? "Lead"),
          leadPhone: String((updatedLead as any).phone ?? "N/A"),
          caseType: ((updatedLead as any).caseType ?? null) as string | null,
          urgency: ((updatedLead as any).urgency ?? null) as string | null,
          notes: assignmentNotes || null,
        },
        mailSent,
        mailError,
      });
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: err?.message ?? "Failed to assign attorney" });
    }
  });
  app.post("/api/attorney/call-decision", async (req: any, res) => {
    try {
      const retellCallId = safeString(req.body?.retellCallId).trim();
      const decision = safeString(req.body?.decision).trim().toLowerCase();
      const notes = safeString(req.body?.notes).trim();
      if (!retellCallId) {
        return res.status(400).json({ message: "retellCallId es obligatorio" });
      }
      if (decision !== "accept" && decision !== "reject") {
        return res.status(400).json({ message: "decision invalida" });
      }
      const role = normalizeUserRole(req.user?.role) ?? "agent";
      const userEmail = String(req.user?.email ?? "")
        .toLowerCase()
        .trim();
      if (role !== "abogado" && role !== "admin") {
        return res.status(403).json({ message: "No autorizado" });
      }
      const call = await storage.getCallLogByRetellCallId(retellCallId);
      if (!call) {
        return res.status(404).json({ message: "Call no encontrada" });
      }
      let actingAttorneyId = safeString((call as any).pendingAttorneyId).trim();
      if (role === "abogado") {
        const attorneys = await storage.getAttorneys({ q: userEmail });
        const me = attorneys.find(
          (a: any) =>
            String(a?.email ?? "")
              .toLowerCase()
              .trim() === userEmail
        );
        if (!me) {
          return res.status(403).json({ message: "No encuentro tu perfil de abogado" });
        }
        actingAttorneyId = String((me as any).id ?? "");
        const pendingAttorneyId = safeString((call as any).pendingAttorneyId).trim();
        if (pendingAttorneyId && pendingAttorneyId !== actingAttorneyId) {
          return res.status(403).json({ message: "Esta llamada no esta asignada para ti" });
        }
      }
      if (decision === "accept") {
        const effectiveAttorneyId =
          safeString((call as any).pendingAttorneyId).trim() || actingAttorneyId;
        if (!effectiveAttorneyId) {
          return res.status(400).json({ message: "No hay abogado pendiente en esta llamada" });
        }
        const leadId = Number((call as any).leadId ?? 0);
        if (!Number.isFinite(leadId) || leadId <= 0) {
          return res.status(400).json({ message: "La llamada no tiene leadId valido" });
        }
        await storage.assignAttorneyToLead(leadId, effectiveAttorneyId);
        await storage.updateLead(leadId, { status: "asignada" } as any);
        const updated = await storage.updateCallLogByRetellCallId(retellCallId, {
          status: "asignada",
          pendingAttorneyId: effectiveAttorneyId,
          assignmentStatus: "accepted",
          assignmentDecisionAt: Date.now(),
          assignmentDecisionByAttorneyId: effectiveAttorneyId,
          assignmentDecisionNotes: notes || undefined,
        } as any);
        return res.json({ success: true, call: updated });
      }
      const rejectedLeadId = Number((call as any).leadId ?? 0);
      if (Number.isFinite(rejectedLeadId) && rejectedLeadId > 0) {
        await storage.updateLead(rejectedLeadId, { status: "pendiente" } as any);
      }
      const updated = await storage.updateCallLogByRetellCallId(retellCallId, {
        status: "rechazada_por_abogado",
        assignmentStatus: "rejected",
        assignmentDecisionAt: Date.now(),
        assignmentDecisionByAttorneyId: actingAttorneyId || undefined,
        assignmentDecisionNotes: notes || undefined,
      } as any);
      return res.json({ success: true, call: updated });
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: err?.message ?? "Failed to process attorney decision" });
    }
  });

  /* ================= ATTORNEYS ================= */

  app.get("/api/attorneys", async (req, res) => {
    try {
      const q = req.query.q as string | undefined;
      const city = req.query.city as string | undefined;
      const state = req.query.state as string | undefined;
      const specialty = req.query.specialty as string | undefined;

      const attorneys = await storage.getAttorneys({
        q,
        city,
        state,
        specialty,
      });

      return res.json(attorneys);
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: err?.message ?? "Failed to fetch attorneys" });
    }
  });

  app.post("/api/attorneys", async (req, res) => {
    try {
      const name = safeString(req.body?.name).trim();
      const email = safeString(req.body?.email).trim();
      const notes = safeString(req.body?.notes).trim();

      if (!name || !email) {
        return res
          .status(400)
          .json({ message: "name y email son obligatorios" });
      }

      const created = await storage.createAttorney({
        id: safeString(req.body?.id).trim() || undefined,
        name,
        email,
        phone: pickFirstString(req.body?.phone, undefined),
        city: pickFirstString(req.body?.city, undefined),
        stateProvince: pickFirstString(
          req.body?.stateProvince,
          req.body?.state_province,
          undefined
        ),
        notes: notes || undefined,
        specialties: Array.isArray(req.body?.specialties)
          ? req.body.specialties
          : [],
      } as any);

      return res.status(201).json(created);
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: err?.message ?? "Failed to create attorney" });
    }
  });

  app.get("/api/attorney/assigned-call", async (req: any, res) => {
    try {
      const role = normalizeUserRole(req.user?.role) ?? "agent";
      const userEmail = String(req.user?.email ?? "")
        .toLowerCase()
        .trim();
      const requestedAttorneyId = safeString(req.query.attorneyId).trim();
      const callId = safeString(req.query.callId).trim();

      let attorneyId = requestedAttorneyId;

      if (role !== "admin") {
        const attorneys = await storage.getAttorneys({ q: userEmail });
        const me = attorneys.find(
          (a: any) =>
            String(a?.email ?? "")
              .toLowerCase()
              .trim() === userEmail
        );

        if (!me) {
          return res.json({ call: null, attorneyId: null });
        }

        attorneyId = String((me as any).id ?? "");
      }

      const logs = await storage.getCallLogs();

      const assignedLogs = logs
        .filter((l: any) => {
          const logStatus = String(l?.status ?? "").toLowerCase();
          const logAttorneyId = String(l?.attorneyId ?? "");
          const pendingAttorneyId = String(
            (l as any)?.pendingAttorneyId ?? ""
          );
          const assignmentStatus = String(
            (l as any)?.assignmentStatus ?? ""
          ).toLowerCase();

          const isPendingForAttorney =
            logStatus === "pendiente_aprobacion_abogado" &&
            assignmentStatus !== "rejected" &&
            !!pendingAttorneyId &&
            (!attorneyId || pendingAttorneyId === attorneyId);

          const isAssignedForAttorney =
            logStatus === "asignada" &&
            !!logAttorneyId &&
            (!attorneyId || logAttorneyId === attorneyId);

          if (!isPendingForAttorney && !isAssignedForAttorney) return false;

          if (!callId) return true;
          const rid = String(
            l?.retellCallId ?? l?.call_id ?? l?.callId ?? l?.id ?? ""
          );
          return rid === callId;
        })
        .sort((a: any, b: any) => toTimeMs(b?.createdAt) - toTimeMs(a?.createdAt));

      return res.json({
        call: assignedLogs[0] ?? null,
        attorneyId: attorneyId || null,
      });
    } catch (err: any) {
      return res
        .status(500)
        .json({ message: err?.message ?? "Failed to fetch assigned call" });
    }
  });

  /* ================= RETELL WEBHOOK ================= */

  const handleRetellWebhook = async (req: any, res: any) => {
    const payload = req.body || {};
    const event = normalizeEvent(payload.event || payload.type);

    try {
      const call = payload.call || {};
      const callId = pickFirstString(
        call.call_id,
        call.callId,
        call.id,
        payload.call_id,
        payload.callId,
        payload.id,
        payload?.data?.call_id,
        payload?.data?.callId,
        payload?.data?.id
      );

      console.log(
        `[RETELL] webhook path=${req.path} event=${event || "unknown"} callId=${callId || "none"}`
      );

      if (!callId) return res.json({ success: true });

      const analysisFromWebhook =
        call.call_analysis || payload.call_analysis || {};
      const transcriptFromWebhook =
        safeString(call.transcript) ||
        safeString(payload.transcript) ||
        safeString(analysisFromWebhook?.transcript) ||
        "";
      const provisionalRecordingUrl = extractRecordingUrl(
        payload,
        call,
        analysisFromWebhook
      );
      const shouldTryRetellLookup =
        !!callId &&
        (isAnalyzedEvent(event) || isFinalEvent(event)) &&
        (!provisionalRecordingUrl ||
          transcriptFromWebhook.trim().length === 0 ||
          Object.keys(analysisFromWebhook || {}).length === 0);
      const retellCallDetails = shouldTryRetellLookup
        ? await fetchRetellCallById(callId)
        : null;

      const analysis =
        Object.keys(analysisFromWebhook || {}).length > 0
          ? analysisFromWebhook
          : retellCallDetails?.call_analysis || {};

      const transcript =
        transcriptFromWebhook ||
        safeString(retellCallDetails?.transcript) ||
        safeString(analysis?.transcript) ||
        "";

      const durationMs =
        call.duration_ms ?? payload.duration_ms ?? 0;

      const durationSec =
        typeof durationMs === "number"
          ? Math.round(durationMs / 1000)
          : 0;

      const recordingUrl = extractRecordingUrl(
        payload,
        call,
        analysis,
        retellCallDetails
      );
      const looksProcessable =
        isAnalyzedEvent(event) ||
        isFinalEvent(event) ||
        !!recordingUrl ||
        transcript.trim().length > 0 ||
        Object.keys(analysis || {}).length > 0;

      if (!looksProcessable) {
        return res.json({ success: true });
      }

      const cad = analysis.custom_analysis_data || {};
      const leadName = safeString(cad.name, "").trim();

      const normalizedName = leadName
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

      const isFakeName =
        !normalizedName ||
        normalizedName === "ai lead" ||
        normalizedName === "unknown" ||
        normalizedName === "test" ||
        normalizedName.length < 3;

      const hasConversation =
        transcript.trim().length > 30 &&
        durationSec > 15;

      const isSuccessful =
        analysis?.call_successful === true &&
        analysis?.user_sentiment === "Positive";

      const isValidCall =
        !isFakeName && hasConversation && isSuccessful;

      const existingCall = await storage.getCallLogByRetellCallId(callId);
      const existingStatus = String((existingCall as any)?.status ?? "").toLowerCase();
      const protectedStatuses = new Set([
        "pendiente_aprobacion_abogado",
        "rechazada_por_abogado",
        "asignada",
      ]);
      const webhookStatus = protectedStatuses.has(existingStatus)
        ? existingStatus
        : "ended";

      await storage.updateCallLogByRetellCallId(callId, {
        retellCallId: callId,
        status: webhookStatus,
        duration: durationSec,
        recordingUrl:
          recordingUrl ??
          pickFirstString(
            (existingCall as any)?.recordingUrl,
            (existingCall as any)?.recording_url
          ),
        transcript,
        summary:
          safeString(analysis?.call_summary) ||
          safeString(analysis?.post_call_analysis?.call_summary) ||
          undefined,
        analysis: analysis as any,
      });

      console.log(
        `[RETELL] processed callId=${callId} hasRecording=${Boolean(
          recordingUrl
        )} transcriptLen=${transcript.length}`
      );

      if (!isValidCall) {
        return res.json({ success: true });
      }

      let leadId: number | undefined = undefined;

      const existing =
        await storage.getLeadByRetellCallId(callId);

      const leadPayload = {
        retellCallId: callId,
        name: leadName,
        phone: safeString(call.from_number, "Unknown"),
        caseType: safeString(cad.case_type, "General"),
        urgency: safeString(cad.urgency, "Medium"),
        transcript,
        summary:
          safeString(analysis?.call_summary) ||
          safeString(analysis?.post_call_analysis?.call_summary) ||
          undefined,
        status: mapStatusFromAnalysis(analysis),
      };

      if (existing) {
        const updated = await storage.updateLead(
          existing.id,
          leadPayload
        );
        leadId = updated.id;
      } else {
        const created = await storage.createLead(
          leadPayload as any
        );
        leadId = created.id;
      }

      await storage.updateCallLogByRetellCallId(callId, {
        leadId,
      });

      return res.json({ success: true });

    } catch (err) {
      console.error("Webhook Error:", err);
      return res.status(200).json({ success: false });
    }
  };

  // Keep compatibility with old and current Retell webhook URLs.
  app.post(api.webhooks.retell.path, handleRetellWebhook);
  app.post("/retell-webhook", handleRetellWebhook);
  app.post("/api/webhook", handleRetellWebhook);

  return httpServer;
}

