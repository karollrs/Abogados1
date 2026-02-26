import { z } from "zod";

// ============================================================
// ERROR SCHEMAS
// ============================================================

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================================
// LEAD SCHEMA
// ============================================================

export const leadSchema = z.object({
  _id: z.any(),
  id: z.number(),
  name: z.string(),
  phone: z.string(),

  caseType: z.string().optional(),
  urgency: z.string().optional(),

  status: z.string(),

  attorneyId: z.string().optional(),

  retellCallId: z.string().optional(),
  retellAgentId: z.string().optional(),

  summary: z.string().optional(),
  transcript: z.string().optional(),

  lastContactedAt: z.number().optional(),
  createdAt: z.number(),
});

// ============================================================
// CALL LOG SCHEMA
// ============================================================

export const callLogSchema = z.object({
  _id: z.any(),
  id: z.number(),

  leadId: z.number().optional(),

  retellCallId: z.string(),

  agentId: z.string().optional(),
  phoneNumber: z.string().optional(),

  status: z.string(),

  direction: z.string().optional(),
  duration: z.number().optional(),

  recordingUrl: z.string().optional(),

  summary: z.string().optional(),
  transcript: z.string().optional(),
  sentiment: z.string().optional(),
  city: z.string().optional(),
  stateProvince: z.string().optional(),
  location: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  caseType: z.string().optional(),
  caseNotes: z.string().optional(),

  analysis: z.any().optional(),

  createdAt: z.number(),
});

// ============================================================
// API CONTRACT
// ============================================================

export const api = {
  leads: {
    list: {
      method: "GET" as const,
      path: "/api/leads" as const,
      input: z
        .object({
          search: z.string().optional(),
          status: z.string().optional(),
        })
        .optional(),
      responses: {
        200: z.array(leadSchema),
      },
    },

    get: {
      method: "GET" as const,
      path: "/api/leads/:id" as const,
      responses: {
        200: leadSchema,
        404: errorSchemas.notFound,
      },
    },

    update: {
      method: "PATCH" as const,
      path: "/api/leads/:id" as const,
      input: leadSchema.partial(),
      responses: {
        200: leadSchema,
        404: errorSchemas.notFound,
      },
    },

    // 🔥 ESTA ERA LA QUE FALTABA
    stats: {
      method: "GET" as const,
      path: "/api/stats" as const,
      responses: {
        200: z.object({
          totalLeads: z.number(),
          qualifiedLeads: z.number(),
          convertedLeads: z.number(),
          avgResponseTimeMinutes: z.number(),
        }),
      },
    },
  },

  callLogs: {
    list: {
      method: "GET" as const,
      path: "/api/call-logs" as const,
      responses: {
        200: z.array(callLogSchema),
      },
    },

    get: {
      method: "GET" as const,
      path: "/api/call-logs/:id" as const,
      responses: {
        200: callLogSchema,
        404: errorSchemas.notFound,
      },
    },
  },

  webhooks: {
    retell: {
      method: "POST" as const,
      path: "/api/retell-webhook" as const,
      input: z.any(),
      responses: {
        200: z.object({
          success: z.boolean(),
        }),
      },
    },
  },
};

// ============================================================
// URL BUILDER
// ============================================================

export function buildUrl(
  path: string,
  params?: Record<string, string | number>
): string {
  let url = path;

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }

  return url;
}
