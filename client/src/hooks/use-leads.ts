import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

type RetellWebhookPayload = Record<string, unknown>;

function toOptionalString(value: unknown): string | undefined {
  if (value == null) return undefined;
  const text = String(value).trim();
  return text.length ? text : undefined;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function toTimestamp(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") {
    const direct = Number(value);
    if (Number.isFinite(direct)) return direct;
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return Date.now();
}

function normalizeLead(input: any) {
  return {
    ...input,
    name: toOptionalString(input?.name) ?? "Sin nombre",
    phone: toOptionalString(input?.phone) ?? "",
    caseType: toOptionalString(input?.caseType),
    urgency: toOptionalString(input?.urgency),
    status: toOptionalString(input?.status) ?? "New",
    attorneyId: toOptionalNumber(input?.attorneyId),
    retellCallId: toOptionalString(input?.retellCallId),
    retellAgentId: toOptionalString(input?.retellAgentId),
    summary: toOptionalString(input?.summary),
    transcript: toOptionalString(input?.transcript),
    lastContactedAt: toOptionalNumber(input?.lastContactedAt),
    createdAt: toTimestamp(input?.createdAt),
  };
}


export function useLeads(search?: string, status?: string) {
  return useQuery({
    queryKey: [api.leads.list.path, search, status],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (status) params.status = status;
      
      const queryString = new URLSearchParams(params).toString();
      const url = `${api.leads.list.path}?${queryString}`;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leads");

      const raw = await res.json();
      const normalized = Array.isArray(raw) ? raw.map((lead) => normalizeLead(lead)) : [];

      const parsed = api.leads.list.responses[200].safeParse(normalized);
      if (parsed.success) return parsed.data;

      console.warn("Leads payload had unexpected values, returning sanitized rows", parsed.error);
      return normalized;
    },
  });
}

export function useLead(id: number) {
  return useQuery({
    queryKey: [api.leads.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.leads.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch lead");
      return api.leads.get.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Record<string, any>) => {
      const url = buildUrl(api.leads.update.path, { id });
      const res = await fetch(url, {
        method: api.leads.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update lead");
      return api.leads.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.leads.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.leads.stats.path] });
    },
  });
}

export function useStats() {
  return useQuery({
    queryKey: [api.leads.stats.path],
    queryFn: async () => {
      const res = await fetch(api.leads.stats.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return api.leads.stats.responses[200].parse(await res.json());
    },
  });
}

// Simulated hook for webhook trigger if we were to trigger it manually from UI for testing
export function useSimulateWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RetellWebhookPayload) => {
      const res = await fetch(api.webhooks.retell.path, {
        method: api.webhooks.retell.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Webhook simulation failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.leads.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.leads.stats.path] });
    },
  });
}
