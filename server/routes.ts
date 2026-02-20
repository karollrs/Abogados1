import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { requireAuth } from "./auth";
import bcrypt from "bcryptjs";

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
      if (!user || !user.passwordHash) {
        return res
          .status(401)
          .json({ message: "Credenciales inválidas" });
      }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        return res
          .status(401)
          .json({ message: "Credenciales inválidas" });
      }

      (req.session as any).userId = user.id;
      (req.session as any).role = user.role;

      return res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
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

  /* ================= RETELL WEBHOOK ================= */

  app.post(api.webhooks.retell.path, async (req, res) => {
    const payload = req.body || {};
    const event = normalizeEvent(payload.event || payload.type);

    try {
      const call = payload.call || {};
      const callId = pickFirstString(
        call.call_id,
        payload.call_id,
        payload.callId
      );

      if (!callId) return res.json({ success: true });

      if (!isAnalyzedEvent(event) && !isFinalEvent(event)) {
        return res.json({ success: true });
      }

      const analysis =
        call.call_analysis || payload.call_analysis || {};

      const transcript =
        safeString(call.transcript) ||
        safeString(payload.transcript) ||
        safeString(analysis?.transcript) ||
        "";

      const durationMs =
        call.duration_ms ?? payload.duration_ms ?? 0;

      const durationSec =
        typeof durationMs === "number"
          ? Math.round(durationMs / 1000)
          : 0;

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
        summary: analysis?.call_summary,
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
        retellCallId: callId,
        status: "ended",
        duration: durationSec,
        transcript,
        summary: analysis?.call_summary,
        analysis: analysis as any,
      });

      return res.json({ success: true });

    } catch (err) {
      console.error("Webhook Error:", err);
      return res.status(200).json({ success: false });
    }
  });

  return httpServer;
}
