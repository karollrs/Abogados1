import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useCallLogs } from "@/hooks/use-call-logs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Phone, Clock, FileText, Copy, Gavel } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// ✅ usa data (no hooks)
import { US_CITIES } from "@/hooks/usCities";
import { CASE_TYPES } from "@/hooks/caseTypes";

function formatDuration(seconds?: number | null) {
  const s = Math.max(0, Number(seconds ?? 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}

function StatusBadge({ status }: { status?: string | null }) {
  const s = (status ?? "ended").toLowerCase();

  if (s.includes("complete") || s.includes("ended") || s.includes("success")) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950/30 dark:text-green-300">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        {status ?? "ended"}
      </span>
    );
  }

  if (s.includes("fail") || s.includes("error")) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        {status ?? "failed"}
      </span>
    );
  }

  if (s.includes("progress") || s.includes("ongoing") || s.includes("active")) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
        {status ?? "in_progress"}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-foreground/40" />
      {status ?? "unknown"}
    </span>
  );
}

const norm = (v: any) => String(v ?? "").trim().toLowerCase();

export default function CallLogs() {
  const { data: logs, isLoading, error } = useCallLogs();

  // modal detalle
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // modal asignar abogado
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [attorneys, setAttorneys] = useState<any[]>([]);
  const [attorneysLoading, setAttorneysLoading] = useState(false);
  const [attorneysError, setAttorneysError] = useState<string | null>(null);

  // filtros
  const [cityText, setCityText] = useState("");
  const [caseTypeText, setCaseTypeText] = useState("");

  // auto open por phone
  const [autoOpened, setAutoOpened] = useState(false);
  const phoneFromUrl = useMemo(() => {
    const sp = new URLSearchParams(window.location.search);
    return sp.get("phone");
  }, []);

  const filteredLogs = useMemo(() => {
    return (logs ?? []).filter((call: any) => {
      const callCity = norm(
        call.city ??
          call.analysis?.city ??
          call.analysis?.post_call_data?.city ??
          call.post_call_data?.city ??
          call.extracted?.city
      );

      const callCaseType = norm(
        call.caseType ??
          call.case_type ??
          call.analysis?.caseType ??
          call.analysis?.case_type ??
          call.analysis?.post_call_data?.case_type ??
          call.post_call_data?.case_type ??
          call.extracted?.case_type
      );

      const cityMatch = !cityText || callCity.includes(norm(cityText));
      const caseMatch = !caseTypeText || callCaseType.includes(norm(caseTypeText));

      return cityMatch && caseMatch;
    });
  }, [logs, cityText, caseTypeText]);

  // ✅ Auto-abrir detalle si llegas desde Dashboard con ?phone=
  useEffect(() => {
    if (!phoneFromUrl) return;
    if (!logs?.length) return;
    if (autoOpened) return;

    const normalizePhone = (s: string) => (s || "").replace(/[^\d+]/g, "");
    const target = normalizePhone(phoneFromUrl);

    const match = [...logs]
      .sort(
        (a: any, b: any) =>
          (b.createdAt ?? b.created_at ?? 0) - (a.createdAt ?? a.created_at ?? 0)
      )
      .find((l: any) => normalizePhone(l.phoneNumber ?? "") === target);

    if (match) {
      setSelected(match);
      setOpen(true);
      setAutoOpened(true);
    }
  }, [phoneFromUrl, logs, autoOpened]);

  // ✅ Cargar abogados cuando abres el modal asignar
  useEffect(() => {
    if (!assignOpen) return;

    (async () => {
      setAttorneysLoading(true);
      setAttorneysError(null);
      try {
        const r = await fetch("/api/attorneys");
        if (!r.ok) throw new Error(await r.text());
        const data = await r.json();
        setAttorneys(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setAttorneysError(e?.message ?? "Error cargando attorneys");
        setAttorneys([]);
      } finally {
        setAttorneysLoading(false);
      }
    })();
  }, [assignOpen]);

  // ✅ ayuda para sacar el leadId correcto del call log seleccionado
  const getLeadIdFromSelected = (s: any) =>
    s?.leadId ?? s?.lead_id ?? s?.lead?.id ?? s?.id;

  const selectedLeadId = selected ? getLeadIdFromSelected(selected) : null;

  // ✅ heurística simple para “mejor abogado”
  const bestAttorneyIds = useMemo(() => {
    if (!selected) return new Set<string>();
    const callCase = norm(
      selected.caseType ??
        selected.case_type ??
        selected.analysis?.case_type ??
        selected.analysis?.post_call_data?.case_type
    );
    const callCity = norm(
      selected.city ??
        selected.analysis?.city ??
        selected.analysis?.post_call_data?.city ??
        selected.post_call_data?.city
    );

    // score por match
    const scored = (attorneys ?? []).map((a) => {
      const specs = Array.isArray(a.specialties) ? a.specialties.join(" ") : "";
      const specMatch = callCase && norm(specs).includes(callCase) ? 2 : 0;
      const cityMatch = callCity && norm(a.city).includes(callCity) ? 1 : 0;
      return { id: String(a.id), score: specMatch + cityMatch };
    });

    const max = Math.max(0, ...scored.map((x) => x.score));
    const set = new Set<string>();
    scored.forEach((x) => {
      if (x.score === max && max > 0) set.add(x.id);
    });
    return set;
  }, [attorneys, selected]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div className="md:pl-64">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Call Logs</h1>
              <p className="text-muted-foreground">
                Historial de llamadas con resumen, análisis y transcripción
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Ciudad */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Ciudad / Ubicación (EE. UU.)
              </label>

              <input
                list="us-cities"
                type="text"
                placeholder="Escribe una ciudad…"
                value={cityText}
                onChange={(e) => setCityText(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              <datalist id="us-cities">
                {US_CITIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            {/* Tipo de caso */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Tipo de caso</label>

              <input
                list="case-types"
                type="text"
                placeholder="Escribe un tipo de caso…"
                value={caseTypeText}
                onChange={(e) => setCaseTypeText(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              <datalist id="case-types">
                {CASE_TYPES.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>

              <span className="text-xs text-muted-foreground">
                Puedes escribir cualquier otro tipo si no aparece.
              </span>
            </div>
          </div>

          {/* Card principal */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Llamadas
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-0">
              {isLoading && <div className="text-muted-foreground">Cargando…</div>}

              {error && (
                <div className="text-destructive">
                  Error cargando call logs: {(error as any)?.message}
                </div>
              )}

              {!isLoading && !error && filteredLogs.length === 0 && (
                <div className="text-muted-foreground">
                  No hay llamadas que coincidan con los filtros.
                </div>
              )}

              <div className="flex flex-col gap-6">
                {filteredLogs.map((l: any) => (
                  <div
                    key={l.id}
                    className="
                      group
                      rounded-2xl
                      border border-border/50
                      bg-card/60
                      p-5
                      shadow-sm
                      hover:shadow-md
                      hover:bg-card
                      transition
                    "
                  >
                    {/* HEADER */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold truncate">
                            {l.leadName ?? "AI Lead"}
                          </span>
                          <StatusBadge status={l.status ?? "ended"} />
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(l);
                            setOpen(true);
                          }}
                          className="
                            inline-flex items-center
                            rounded-lg
                            px-3 py-1.5
                            text-sm
                            text-muted-foreground
                            hover:text-foreground
                            hover:bg-muted/60
                            transition
                          "
                        >
                          Ver detalles →
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelected(l);
                            setAssignOpen(true);
                          }}
                          className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm bg-primary text-primary-foreground hover:opacity-90 transition"
                        >
                          <Gavel className="h-4 w-4" />
                          Asignar abogado
                        </button>
                      </div>
                    </div>

                    {/* METADATA */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4 opacity-70" />
                        {l.phoneNumber ?? "Web Call"}
                      </span>

                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4 opacity-70" />
                        {formatDuration(l.duration)}
                      </span>

                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4 opacity-70" />
                        {l.summary ? "Con resumen" : "Sin resumen"}
                      </span>
                    </div>

                    {/* RESUMEN */}
                    <div className="mt-3 text-sm text-foreground/80 leading-relaxed line-clamp-2 min-h-[2.75rem]">
                      {l.summary ?? "Sin resumen disponible para esta llamada."}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* =========================
          MODAL: DETALLE DE LLAMADA
         ========================= */}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);

          if (!next) {
            const url = new URL(window.location.href);
            url.searchParams.delete("phone");
            window.history.replaceState({}, "", url.toString());
            setSelected(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl p-0">
          <div className="flex max-h-[85vh] flex-col">
            <div className="border-b px-6 py-4">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Detalle de llamada</DialogTitle>
              </DialogHeader>

              {selected && (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {selected.status ?? "ended"}
                  </span>

                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4 opacity-60" />
                    {formatDuration(selected.duration)}
                  </span>

                  {selected.phoneNumber && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4 opacity-60" />
                      {selected.phoneNumber}
                    </span>
                  )}

                  {selected.leadName && (
                    <span className="font-medium text-foreground">{selected.leadName}</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {!selected ? (
                <div className="text-muted-foreground">Selecciona una llamada.</div>
              ) : (
                <Tabs defaultValue="resumen" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 rounded-xl">
                    <TabsTrigger value="resumen" className="rounded-lg">
                      Resumen
                    </TabsTrigger>
                    <TabsTrigger value="transcripcion" className="rounded-lg">
                      Transcripción
                    </TabsTrigger>
                    <TabsTrigger value="analisis" className="rounded-lg">
                      Análisis
                    </TabsTrigger>
                    <TabsTrigger value="audio" className="rounded-lg" disabled={!selected.recordingUrl}>
                      Audio
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="resumen" className="mt-4 space-y-4">
                    <Card className="rounded-2xl border-border/60 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">Resumen</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-foreground/80 leading-relaxed">
                        {selected.summary ?? selected.analysis?.call_summary ?? "Sin resumen (aún)."}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="transcripcion" className="mt-4">
                    <Card className="rounded-2xl border-border/60 shadow-sm">
                      <CardHeader className="flex-row items-center justify-between">
                        <CardTitle className="text-base">Transcripción</CardTitle>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(selected.transcript ?? "");
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1500);
                          }}
                          disabled={!selected.transcript}
                          className="
                            inline-flex items-center gap-2
                            rounded-lg
                            px-3 py-1.5
                            text-sm
                            text-muted-foreground
                            hover:text-foreground
                            hover:bg-muted/60
                            transition
                            disabled:opacity-40
                            disabled:cursor-not-allowed
                          "
                        >
                          <Copy className="h-4 w-4" />
                          {copied ? "Copiado" : "Copiar"}
                        </button>
                      </CardHeader>

                      <CardContent>
                        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm whitespace-pre-wrap leading-relaxed">
                          {selected.transcript ?? "Sin transcripción (aún)."}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="analisis" className="mt-4">
                    <Card className="rounded-2xl border-border/60 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">Análisis</CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <Separator />
                        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                          <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                                <div className="text-xs text-muted-foreground">Sentimiento</div>
                                <div className="font-medium">
                                  {selected.analysis?.user_sentiment ?? "—"}
                                </div>
                              </div>

                              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                                <div className="text-xs text-muted-foreground">Exitosa</div>
                                <div className="font-medium">
                                  {String(selected.analysis?.call_successful ?? "—")}
                                </div>
                              </div>

                              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                                <div className="text-xs text-muted-foreground">Latencia</div>
                                <div className="font-medium">
                                  {selected.analysis?.latency_ms
                                    ? `${selected.analysis.latency_ms} ms`
                                    : "—"}
                                </div>
                              </div>

                              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                                <div className="text-xs text-muted-foreground">Motivo desconexión</div>
                                <div className="font-medium">
                                  {selected.analysis?.disconnect_reason ?? "—"}
                                </div>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                              <div className="text-xs text-muted-foreground mb-2">Resumen IA</div>
                              <div className="leading-relaxed text-foreground/80">
                                {selected.analysis?.call_summary ?? "—"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="audio" className="mt-4">
                    <Card className="rounded-2xl border-border/60 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">Audio</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selected.recordingUrl ? (
                          <audio controls className="w-full">
                            <source src={selected.recordingUrl} />
                          </audio>
                        ) : (
                          <div className="text-sm text-muted-foreground">No hay audio disponible.</div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* =========================
          MODAL: ASIGNAR ABOGADO
         ========================= */}
      <Dialog
        open={assignOpen}
        onOpenChange={(next) => {
          setAssignOpen(next);
          if (!next) {
            setAttorneysError(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Asignar abogado</DialogTitle>
          </DialogHeader>

          {!selectedLeadId ? (
            <div className="text-sm text-destructive">
              No pude detectar el leadId de esta llamada. Revisa que tu backend esté retornando leadId en /api/call-logs.
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                Lead ID: <span className="text-foreground font-medium">{String(selectedLeadId)}</span>
              </div>

              {attorneysLoading && <div className="text-muted-foreground">Cargando abogados…</div>}
              {attorneysError && <div className="text-destructive">Error: {attorneysError}</div>}

              {!attorneysLoading && !attorneysError && attorneys.length === 0 && (
                <div className="text-muted-foreground">No hay abogados registrados.</div>
              )}

              <div className="mt-2 max-h-[55vh] overflow-y-auto rounded-xl border border-border/60">
                {attorneys.map((attorney) => {
                  const isBest = bestAttorneyIds.has(String(attorney.id));
                  return (
                    <div
                      key={attorney.id}
                      className="flex items-start justify-between gap-4 p-4 border-b last:border-b-0"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold truncate">{attorney.name}</div>
                          {isBest && (
                            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">
                              Recomendado
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-muted-foreground truncate">
                          {attorney.email}
                        </div>

                        <div className="mt-2 text-sm">
                          <div className="text-xs text-muted-foreground">Ubicación</div>
                          <div>
                            {[attorney.city, attorney.stateProvince].filter(Boolean).join(", ") || "—"}
                          </div>
                        </div>

                        <div className="mt-2 text-sm">
                          <div className="text-xs text-muted-foreground">Especialidades</div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {Array.isArray(attorney.specialties) && attorney.specialties.length ? (
                              attorney.specialties.map((s: string) => (
                                <span key={s} className="rounded-full bg-muted px-3 py-1 text-xs">
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ✅ AQUÍ VA TU FETCH */}
                      <button
                        type="button"
                        disabled={assigning}
                        onClick={async () => {
                          try {
                            setAssigning(true);

                            const r = await fetch(
                              `/api/leads/${selectedLeadId}/assign-attorney`,
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ attorneyId: attorney.id }),
                              }
                            );

                            if (!r.ok) throw new Error(await r.text());

                            setAssignOpen(false);
                          } catch (e: any) {
                            alert(e?.message ?? "Error asignando abogado");
                          } finally {
                            setAssigning(false);
                          }
                        }}
                        className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
                      >
                        {assigning ? "Asignando…" : "Asignar"}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 text-xs text-muted-foreground">
                * “Recomendado” se calcula por match de especialidad y ciudad con la llamada (heurística simple).
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
