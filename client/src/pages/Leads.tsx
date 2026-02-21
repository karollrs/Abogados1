import { useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useLeads, useUpdateLead } from "@/hooks/use-leads";
import { useCallLogs } from "@/hooks/use-call-logs";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function fmtDate(ts?: number | null) {
  if (!ts) return "-";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "-";
  }
}

function normalizeLeadStatus(status?: string | null) {
  const s = String(status ?? "")
    .trim()
    .toLowerCase();

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

function statusBadge(status?: string | null) {
  const normalized = normalizeLeadStatus(status);

  if (normalized === "pendiente") {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
        Pendiente
      </Badge>
    );
  }

  if (normalized === "en_espera_aceptacion") {
    return (
      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
        En revisión
      </Badge>
    );
  }

  if (normalized === "asignada") {
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        Asignada
      </Badge>
    );
  }

  return <Badge variant="outline">{status ?? "Pendiente"}</Badge>;
}


export default function Leads() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [, setLocation] = useLocation();

  const { data: leads, isLoading, error } = useLeads(
    
    search.trim() || undefined,
    status === "all" ? undefined : status
  );
  console.log("LEADS DATA:", leads);

  const { data: callLogs } = useCallLogs();

  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selectedLead = useMemo(() => {
    return (leads ?? []).find((l: any) => l.id === selectedId) ?? null;
  }, [leads, selectedId]);

  const relatedCalls = useMemo(() => {
    if (!selectedLead) return [];
    const all = callLogs ?? [];

    return all
      .filter((c: any) =>
        Number(c.leadId ?? c.lead_id ?? 0) === Number(selectedLead.id)
      )
      .sort((a: any, b: any) => {
        const ta = new Date(a.createdAt ?? a.created_at ?? 0).getTime();
        const tb = new Date(b.createdAt ?? b.created_at ?? 0).getTime();
        return ta - tb;
      });
  }, [callLogs, selectedLead]);

  const updateStatus = useUpdateLead();

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-8 space-y-6">

        {/* HEADER */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
            <p className="text-muted-foreground mt-1">
              Gestión y seguimiento de potenciales clientes
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o teléfono..."
              className="md:w-[320px]"
            />

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="md:w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_espera_aceptacion">En revisión</SelectItem>
                <SelectItem value="asignada">Asignada</SelectItem>

              </SelectContent>
            </Select>
          </div>
        </div>

        {/* LISTADO */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Listado de Leads</CardTitle>
          </CardHeader>

          <CardContent>
            {isLoading && <div>Cargando leads...</div>}
            {error && <div>Error cargando leads.</div>}

            <div className="grid grid-cols-1 gap-4">
              {(leads ?? []).map((l: any) => (
                <button
                  key={l.id}
                  className="w-full rounded-2xl border border-border/60 bg-card/60 p-5 text-left shadow-sm hover:shadow-md hover:bg-card transition"
                  onClick={() => {
                    setSelectedId(l.id);
                    setOpen(true);
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="font-semibold text-foreground">
                        {l.name}
                      </div>

                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                          #{l.id}
                        </span>
                        {l.phone}
                      </div>
                    </div>

                    <div>{statusBadge(l.status)}</div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* MODAL LEAD */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl p-0">
            <div className="flex max-h-[85vh] flex-col">

              {/* HEADER */}
              <div className="border-b px-6 py-4 bg-muted/30">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">
                    Detalle del Lead
                  </DialogTitle>
                </DialogHeader>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

                {!selectedLead ? (
                  <div>Selecciona un lead</div>
                ) : (
                  <>
                    {/* INFO PRINCIPAL */}
                    <Card className="rounded-2xl border-border/60 shadow-sm">
                      <CardContent className="p-5 space-y-2">
                        <div className="text-lg font-semibold">
                          {selectedLead.name}
                        </div>

                        <div className="text-sm text-muted-foreground">
                          {selectedLead.phone}
                        </div>

                        <div className="pt-2">
                          {statusBadge(selectedLead.status)}
                        </div>
                      </CardContent>
                    </Card>

                    {/* LLAMADAS */}
                    <div className="space-y-3">
                      <div className="font-medium text-base">
                        Llamadas asociadas ({relatedCalls.length})
                      </div>

                      {relatedCalls.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                          Sin llamadas asociadas.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {relatedCalls.map((c: any, idx: number) => {
                            const label =
                              idx === 0
                                ? "Llamada inicial"
                                : `Llamada de seguimiento #${idx}`;

                            const callId =
                              c.retellCallId ??
                              c.callId ??
                              c.call_id ??
                              c.id;

                            return (
                              <button
                                key={callId}
                                className="w-full rounded-2xl border border-border/60 bg-card/60 p-4 text-left shadow-sm hover:shadow-md hover:bg-card transition"
                                onClick={() => {
                                  setOpen(false);

                                  setLocation(
                                    `/calls?callId=${encodeURIComponent(
                                      String(callId)
                                    )}&from=${encodeURIComponent("/leads")}`
                                  );
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-semibold text-sm">
                                      {label}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {fmtDate(c.createdAt ?? c.created_at)}
                                    </div>
                                  </div>

                                  <Badge variant="outline" className="text-xs">
                                    Ver detalle ⬅️
                                  </Badge>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 flex justify-end">
                      <Button variant="secondary" onClick={() => setOpen(false)}>
                        Cerrar
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
