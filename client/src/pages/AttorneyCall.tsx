import { useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Clock, Phone, FileText, Copy } from "lucide-react";
import { useAssignedAttorneyCall } from "@/hooks/use-attorney-call";

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

function StatusBadge({ status }: { status?: string | null }) {
  const s = (status ?? "pendiente").toLowerCase();

  if (s === "pendiente_aprobacion_abogado") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 dark:bg-orange-950/30 dark:text-orange-300">
        <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
        Pendiente por tu aprobacion
      </span>
    );
  }

  if (s === "asignada") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950/30 dark:text-green-300">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        Asignada
      </span>
    );
  }

  if (s === "rechazada_por_abogado") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Rechazada
      </span>
    );
  }

  if (s === "en_espera_aceptacion") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        En espera de aceptaciÃ³n
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
  const [copied, setCopied] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [deciding, setDeciding] = useState<"accept" | "reject" | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const callId = useMemo(
    () => new URLSearchParams(window.location.search).get("callId") ?? undefined,
    []
  );

  const { data, isLoading, error, refetch } = useAssignedAttorneyCall(callId);
  const call = data?.call ?? null;

  async function submitDecision(decision: "accept" | "reject") {
    if (!call?.retellCallId) return;
    try {
      setDecisionError(null);
      setDeciding(decision);

      const r = await fetch("/api/attorney/call-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          retellCallId: call.retellCallId,
          decision,
          notes: decisionNotes || undefined,
        }),
      });

      if (!r.ok) throw new Error(await r.text());

      setDecisionNotes("");
      await refetch();
    } catch (e: any) {
      setDecisionError(e?.message ?? "No se pudo procesar la decision");
    } finally {
      setDeciding(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div className="md:pl-64">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Llamada asignada</h1>
              <p className="text-muted-foreground">
                Vista completa de la llamada que te fue asignada
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

          {isLoading && <div className="text-muted-foreground">Cargando llamadaâ€¦</div>}

          {error && (
            <div className="text-destructive">
              Error cargando llamada: {String((error as any)?.message ?? error)}
            </div>
          )}

          {!isLoading && !error && !call && (
            <Card className="border-border/60 shadow-sm">
              <CardContent className="py-8 text-muted-foreground">
                No tienes llamadas asignadas por ahora.
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && call && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-xl">Detalle de llamada</CardTitle>
                  <StatusBadge status={call.status} />
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {call.leadName ?? "AI Lead"}
                  </span>

                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4 opacity-60" />
                    {formatDuration(call.duration)}
                  </span>

                  {call.phoneNumber && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4 opacity-60" />
                      {call.phoneNumber}
                    </span>
                  )}

                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4 opacity-60" />
                    {call.summary ? "Con resumen" : "Sin resumen"}
                  </span>
                </div>
              </CardHeader>

              <CardContent>
                {String(call.status ?? "").toLowerCase() === "pendiente_aprobacion_abogado" ? (
                  <div className="mb-4 rounded-2xl border border-orange-200 bg-orange-50/60 p-4 space-y-3">
                    <div className="text-sm font-medium text-orange-800">
                      Esta llamada esta pendiente por tu aprobacion.
                    </div>
                    <div className="text-sm text-orange-900/80">
                      Nota enviada por el equipo:{" "}
                      <span className="font-medium">
                        {(call as any).assignmentNotes || "Sin notas adicionales"}
                      </span>
                    </div>
                    <textarea
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      placeholder="Opcional: agrega una nota al aceptar o rechazar..."
                      className="w-full rounded-md border border-orange-200 bg-white px-3 py-2 text-sm min-h-[88px]"
                    />

                    {decisionError ? (
                      <div className="text-sm text-red-600">{decisionError}</div>
                    ) : null}

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={!!deciding}
                        onClick={() => submitDecision("reject")}
                        className="rounded-xl px-4 py-2 text-sm font-medium border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        {deciding === "reject" ? "Procesando..." : "Rechazar"}
                      </button>
                      <button
                        type="button"
                        disabled={!!deciding}
                        onClick={() => submitDecision("accept")}
                        className="rounded-xl px-4 py-2 text-sm font-medium bg-green-600 text-white hover:opacity-90 disabled:opacity-50"
                      >
                        {deciding === "accept" ? "Procesando..." : "Aceptar llamada"}
                      </button>
                    </div>
                  </div>
                ) : null}

                <Tabs defaultValue="resumen" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 rounded-xl">
                    <TabsTrigger value="resumen" className="rounded-lg">
                      Resumen
                    </TabsTrigger>
                    <TabsTrigger value="transcripcion" className="rounded-lg">
                      TranscripciÃ³n
                    </TabsTrigger>
                    <TabsTrigger value="analisis" className="rounded-lg">
                      AnÃ¡lisis
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
                        <CardTitle className="text-base">TranscripciÃ³n</CardTitle>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(call.transcript ?? "");
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1500);
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
                          {call.transcript ?? "Sin transcripciÃ³n disponible."}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="analisis" className="mt-4">
                    <Card className="rounded-2xl border-border/60 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">AnÃ¡lisis</CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <Separator />
                        <div className="space-y-3 text-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                              <div className="text-xs text-muted-foreground">Sentimiento</div>
                              <div className="font-medium">
                                {call.analysis?.user_sentiment ?? "â€”"}
                              </div>
                            </div>

                            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                              <div className="text-xs text-muted-foreground">Exitosa</div>
                              <div className="font-medium">
                                {String(call.analysis?.call_successful ?? "â€”")}
                              </div>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                            <div className="text-xs text-muted-foreground mb-2">Resumen IA</div>
                            <div className="leading-relaxed text-foreground/80">
                              {call.analysis?.call_summary ?? "â€”"}
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
          )}
        </div>
      </div>
    </div>
  );
}
