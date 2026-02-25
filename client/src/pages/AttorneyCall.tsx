import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Clock, Phone, FileText, Copy, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import { useAssignedAttorneyCall } from "@/hooks/use-attorney-call";
import { useToast } from "@/hooks/use-toast";
import { withApiBase } from "@/lib/queryClient";
import { US_CITIES } from "@/hooks/usCities";
import { CASE_TYPES } from "@/hooks/caseTypes";

function formatDuration(seconds?: number | null) {
  const s = Math.max(0, Number(seconds ?? 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}

function getRecordingUrl(call: any): string {
  return String(
    call?.recordingUrl ??
      call?.recording_url ??
      call?.recording_url_public ??
      call?.recording?.url ??
      call?.recording?.recording_url ??
      call?.recording?.recording_url_public ??
      call?.recording?.public_url ??
      call?.scrubbed_recording_url ??
      call?.recording_multi_channel_url ??
      call?.scrubbed_recording_multi_channel_url ??
      call?.analysis?.recordingUrl ??
      call?.analysis?.recording_url ??
      call?.analysis?.recording_url_public ??
      call?.analysis?.recording?.url ??
      call?.analysis?.recording?.recording_url ??
      call?.analysis?.recording?.recording_url_public ??
      call?.analysis?.post_call_analysis?.recordingUrl ??
      call?.analysis?.post_call_analysis?.recording_url ??
      call?.analysis?.post_call_analysis?.recording_url_public ??
      call?.analysis?.post_call_analysis?.recording?.url ??
      call?.analysis?.scrubbed_recording_url ??
      call?.analysis?.recording_multi_channel_url ??
      call?.analysis?.scrubbed_recording_multi_channel_url ??
      ""
  ).trim();
}

function getCallKey(call: any): string {
  return String(call?.retellCallId ?? call?.call_id ?? call?.callId ?? call?.id ?? "");
}

function normalizeCaseStatus(status?: string | null) {
  const s = String(status ?? "").toLowerCase().trim();
  if (s === "closed" || s === "finalized" || s === "finalizada") return "finalizado";
  return s;
}

function getErrorMessage(error: unknown, fallback: string): string {
  const message = String((error as any)?.message ?? "").trim();
  if (!message) return fallback;
  try {
    const parsed = JSON.parse(message);
    if (typeof parsed === "string" && parsed.trim()) return parsed.trim();
    if (parsed && typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message.trim();
    }
  } catch {
    // Keep raw message when it is not JSON.
  }
  return message;
}

const norm = (v: any) => String(v ?? "").trim().toLowerCase();

function firstText(...values: any[]): string {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
}

function getCallCity(call: any): string {
  return firstText(
    call?.city,
    call?.analysis?.city,
    call?.analysis?.post_call_data?.city,
    call?.post_call_data?.city,
    call?.extracted?.city,
    call?.analysis?.custom_analysis_data?.city
  );
}

function getCallCaseType(call: any): string {
  return firstText(
    call?.caseType,
    call?.analysis?.case_type,
    call?.analysis?.post_call_data?.case_type,
    call?.analysis?.custom_analysis_data?.case_type
  );
}

function getCallPhoneNumber(call: any): string {
  return firstText(
    call?.phoneNumber,
    call?.phone,
    call?.from_number,
    call?.analysis?.from_number,
    call?.analysis?.post_call_data?.phone
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  const s = normalizeCaseStatus(status || "pendiente");

  if (s === "finalizado") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-900/30 dark:text-slate-300">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
        Finalizado
      </span>
    );
  }

  if (s === "asignada") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950/30 dark:text-green-300">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        Aceptada por abogado
      </span>
    );
  }

  if (s === "rechazada_por_abogado") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Reasignar
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300">
      <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
      Pendiente
    </span>
  );
}

export default function AttorneyCall() {
  const ITEMS_PER_PAGE = 5;
  const [copiedCallKey, setCopiedCallKey] = useState<string | null>(null);
  const [closingCallKey, setClosingCallKey] = useState<string | null>(null);
  const [activePage, setActivePage] = useState(1);
  const [finalizedPage, setFinalizedPage] = useState(1);
  const [openActiveSection, setOpenActiveSection] = useState(false);
  const [openFinalizedSection, setOpenFinalizedSection] = useState(false);
  const [cityText, setCityText] = useState("");
  const [caseTypeText, setCaseTypeText] = useState("");
  const [nameOrPhoneText, setNameOrPhoneText] = useState("");
  const { toast } = useToast();
  const callId = useMemo(
    () => new URLSearchParams(window.location.search).get("callId") ?? undefined,
    []
  );

  const { data, isLoading, error, refetch } = useAssignedAttorneyCall(callId);
  const calls = useMemo(() => {
    const rows = Array.isArray(data?.calls)
      ? data.calls
      : data?.call
        ? [data.call]
        : [];
    return rows.filter(Boolean);
  }, [data]);

  const filteredCalls = useMemo(() => {
    return calls.filter((call: any) => {
      const callLocationText = norm(getCallCity(call));
      const callCaseType = norm(getCallCaseType(call));

      const cityMatch = !cityText || callLocationText.includes(norm(cityText));
      const caseMatch = !caseTypeText || callCaseType.includes(norm(caseTypeText));

      const searchQuery = norm(nameOrPhoneText);
      const queryDigits = searchQuery.replace(/\D/g, "");
      const callName = norm(
        call?.leadName ??
          call?.analysis?.custom_analysis_data?.name ??
          call?.analysis?.post_call_data?.name ??
          call?.name
      );
      const callPhoneRaw = String(getCallPhoneNumber(call));
      const callPhoneNorm = callPhoneRaw.replace(/\D/g, "");
      const nameMatch = !searchQuery || callName.includes(searchQuery);
      const phoneMatch =
        !searchQuery ||
        (queryDigits.length > 0
          ? callPhoneNorm.includes(queryDigits)
          : norm(callPhoneRaw).includes(searchQuery));
      const nameOrPhoneMatch = !searchQuery || nameMatch || phoneMatch;

      return cityMatch && caseMatch && nameOrPhoneMatch;
    });
  }, [calls, cityText, caseTypeText, nameOrPhoneText]);

  const activeCalls = useMemo(
    () => filteredCalls.filter((call: any) => normalizeCaseStatus(call?.status) !== "finalizado"),
    [filteredCalls]
  );
  const finalizedCalls = useMemo(
    () => filteredCalls.filter((call: any) => normalizeCaseStatus(call?.status) === "finalizado"),
    [filteredCalls]
  );

  const activeTotalPages = Math.max(1, Math.ceil(activeCalls.length / ITEMS_PER_PAGE));
  const finalizedTotalPages = Math.max(1, Math.ceil(finalizedCalls.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setActivePage(1);
    setFinalizedPage(1);
  }, [filteredCalls]);

  useEffect(() => {
    setActivePage((p) => Math.min(p, activeTotalPages));
  }, [activeTotalPages]);

  useEffect(() => {
    setFinalizedPage((p) => Math.min(p, finalizedTotalPages));
  }, [finalizedTotalPages]);

  const activeCallsPage = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE;
    return activeCalls.slice(start, start + ITEMS_PER_PAGE);
  }, [activeCalls, activePage]);

  const finalizedCallsPage = useMemo(() => {
    const start = (finalizedPage - 1) * ITEMS_PER_PAGE;
    return finalizedCalls.slice(start, start + ITEMS_PER_PAGE);
  }, [finalizedCalls, finalizedPage]);

  useEffect(() => {
    if (!callId) return;
    const targetCallId = String(callId);

    const targetActiveIndex = activeCalls.findIndex(
      (call: any) => getCallKey(call) === targetCallId
    );
    if (targetActiveIndex >= 0) {
      const page = Math.floor(targetActiveIndex / ITEMS_PER_PAGE) + 1;
      setActivePage(page);
      setOpenActiveSection(true);
      setOpenFinalizedSection(false);
      return;
    }

    const targetFinalizedIndex = finalizedCalls.findIndex(
      (call: any) => getCallKey(call) === targetCallId
    );
    if (targetFinalizedIndex >= 0) {
      const page = Math.floor(targetFinalizedIndex / ITEMS_PER_PAGE) + 1;
      setFinalizedPage(page);
      setOpenFinalizedSection(true);
      setOpenActiveSection(false);
    }
  }, [callId, activeCalls, finalizedCalls]);

  async function closeCase(call: any) {
    const retellCallId = getCallKey(call);
    if (!retellCallId) {
      toast({
        variant: "destructive",
        title: "No se puede cerrar este caso",
        description: "No encontre el identificador de la llamada.",
      });
      return;
    }

    try {
      setClosingCallKey(retellCallId);
      const response = await fetch(withApiBase("/api/attorney/close-case"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ retellCallId }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({
        title: "Caso finalizado",
        description: "El caso fue marcado como finalizado en todo el CRM.",
        className: "border-emerald-200 bg-emerald-50 text-emerald-900",
      });

      await refetch();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error al cerrar caso",
        description: getErrorMessage(err, "No se pudo finalizar el caso"),
      });
    } finally {
      setClosingCallKey(null);
    }
  }

  function renderCaseCard(call: any, idx: number) {
    const callKey = getCallKey(call);
    const copied = copiedCallKey === callKey;
    const isFinalized = normalizeCaseStatus(call?.status) === "finalizado";
    const isClosing = closingCallKey === callKey;
    const callPhone = getCallPhoneNumber(call);

    return (
      <Card key={callKey || String(call?.id ?? idx)} className="border-border/60 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-xl">Detalle del caso</CardTitle>
            <div className="flex items-center gap-2">
              <StatusBadge status={call.status} />
              {!isFinalized && (
                <button
                  type="button"
                  onClick={() => closeCase(call)}
                  disabled={isClosing}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {isClosing ? "Cerrando..." : "Cerrar caso"}
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {call.leadName ?? "AI Lead"}
            </span>

            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4 opacity-60" />
              {formatDuration(call.duration)}
            </span>

            {callPhone && (
              <span className="flex items-center gap-1">
                <Phone className="h-4 w-4 opacity-60" />
                {callPhone}
              </span>
            )}

            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4 opacity-60" />
              {call.summary ? "Con resumen" : "Sin resumen"}
            </span>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="resumen" className="w-full">
            <TabsList className="grid w-full grid-cols-4 rounded-xl">
              <TabsTrigger value="resumen" className="rounded-lg">
                Resumen
              </TabsTrigger>
              <TabsTrigger value="transcripcion" className="rounded-lg">
                Transcripcion
              </TabsTrigger>
              <TabsTrigger value="analisis" className="rounded-lg">
                Analisis
              </TabsTrigger>
              <TabsTrigger value="audio" className="rounded-lg" disabled={!getRecordingUrl(call)}>
                Audio
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resumen" className="mt-4">
              <Card className="rounded-2xl border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Resumen</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-foreground/80 leading-relaxed">
                  {call.summary ?? call.analysis?.call_summary ?? "Sin resumen disponible."}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transcripcion" className="mt-4">
              <Card className="rounded-2xl border-border/60 shadow-sm">
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-base">Transcripcion</CardTitle>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(call.transcript ?? "");
                      setCopiedCallKey(callKey);
                      setTimeout(() => setCopiedCallKey(null), 1500);
                    }}
                    disabled={!call.transcript}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Copy className="h-4 w-4" />
                    {copied ? "Copiado" : "Copiar"}
                  </button>
                </CardHeader>

                <CardContent>
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm whitespace-pre-wrap leading-relaxed">
                    {call.transcript ?? "Sin transcripcion disponible."}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analisis" className="mt-4">
              <Card className="rounded-2xl border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Analisis</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <Separator />
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                        <div className="text-xs text-muted-foreground">Sentimiento</div>
                        <div className="font-medium">
                          {call.analysis?.user_sentiment ?? "-"}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                        <div className="text-xs text-muted-foreground">Exitosa</div>
                        <div className="font-medium">
                          {String(call.analysis?.call_successful ?? "-")}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                      <div className="text-xs text-muted-foreground mb-2">Resumen IA</div>
                      <div className="leading-relaxed text-foreground/80">
                        {call.analysis?.call_summary ?? "-"}
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
                  {getRecordingUrl(call) ? (
                    <audio controls className="w-full">
                      <source src={getRecordingUrl(call)} />
                    </audio>
                  ) : (
                    <div className="text-sm text-muted-foreground">No hay audio disponible.</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div className="md:pl-64">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Mis casos</h1>
              <p className="text-muted-foreground">
                Aqui aparecen todos los casos enviados por admin o agente
              </p>
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-xl px-4 py-2 text-sm font-medium border border-border hover:bg-muted transition"
            >
              Actualizar
            </button>
          </div>

          {isLoading && <div className="text-muted-foreground">Cargando casos...</div>}

          {error && (
            <div className="text-destructive">
              Error cargando casos: {String((error as any)?.message ?? error)}
            </div>
          )}

          {!isLoading && !error && calls.length === 0 && (
            <Card className="border-border/60 shadow-sm">
              <CardContent className="py-8 text-muted-foreground">
                No tienes casos enviados por ahora.
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && calls.length > 0 && (
            <>
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Buscar por nombre o numero
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Maria o +1 555..."
                    value={nameOrPhoneText}
                    onChange={(e) => setNameOrPhoneText(e.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Ciudad / Ubicacion (EE. UU.)
                  </label>
                  <input
                    list="attorney-us-cities"
                    type="text"
                    placeholder="Escribe una ciudad..."
                    value={cityText}
                    onChange={(e) => setCityText(e.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <datalist id="attorney-us-cities">
                    {US_CITIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Tipo de caso</label>
                  <input
                    list="attorney-case-types"
                    type="text"
                    placeholder="Escribe un tipo de caso..."
                    value={caseTypeText}
                    onChange={(e) => setCaseTypeText(e.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <datalist id="attorney-case-types">
                    {CASE_TYPES.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                  <span className="text-xs text-muted-foreground">
                    Puedes escribir cualquier otro tipo si no aparece.
                  </span>
                </div>
              </div>

              <Card className="border-border/60 shadow-sm">
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Casos
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-0">
                  {filteredCalls.length === 0 ? (
                    <div className="text-muted-foreground">
                      No hay casos que coincidan con los filtros.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <section className="space-y-4 rounded-xl border border-border/60 p-4">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setOpenActiveSection((v) => !v)}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-300"
                          >
                            {openActiveSection ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            Casos activos
                          </button>
                          <span className="inline-flex min-w-9 items-center justify-center rounded-full bg-muted px-3 py-1 text-lg font-bold text-foreground">
                            {activeCalls.length}
                          </span>
                        </div>

                        {openActiveSection && (
                          <>
                            {activeCalls.length === 0 ? (
                              <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                                No hay casos activos.
                              </div>
                            ) : (
                              <>
                                {activeCallsPage.map(renderCaseCard)}
                                <div className="flex items-center justify-end gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                                    disabled={activePage <= 1}
                                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    Anterior
                                  </button>
                                  <span className="text-xs text-muted-foreground">
                                    Pagina {activePage} de {activeTotalPages}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActivePage((p) => Math.min(activeTotalPages, p + 1))
                                    }
                                    disabled={activePage >= activeTotalPages}
                                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    Siguiente
                                  </button>
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </section>

                      <section className="space-y-4 rounded-xl border border-border/60 p-4">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setOpenFinalizedSection((v) => !v)}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"
                          >
                            {openFinalizedSection ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            Casos finalizados
                          </button>
                          <span className="inline-flex min-w-9 items-center justify-center rounded-full bg-muted px-3 py-1 text-lg font-bold text-foreground">
                            {finalizedCalls.length}
                          </span>
                        </div>

                        {openFinalizedSection && (
                          <>
                            {finalizedCalls.length === 0 ? (
                              <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                                Aun no hay casos finalizados.
                              </div>
                            ) : (
                              <>
                                {finalizedCallsPage.map(renderCaseCard)}
                                <div className="flex items-center justify-end gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setFinalizedPage((p) => Math.max(1, p - 1))}
                                    disabled={finalizedPage <= 1}
                                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    Anterior
                                  </button>
                                  <span className="text-xs text-muted-foreground">
                                    Pagina {finalizedPage} de {finalizedTotalPages}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFinalizedPage((p) => Math.min(finalizedTotalPages, p + 1))
                                    }
                                    disabled={finalizedPage >= finalizedTotalPages}
                                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    Siguiente
                                  </button>
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </section>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
