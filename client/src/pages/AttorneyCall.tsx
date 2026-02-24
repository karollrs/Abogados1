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

function getCallKey(call: any): string {
  return String(call?.retellCallId ?? call?.call_id ?? call?.callId ?? call?.id ?? "");
}

function StatusBadge({ status }: { status?: string | null }) {
  const s = (status ?? "pendiente").toLowerCase();

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
  const [copiedCallKey, setCopiedCallKey] = useState<string | null>(null);
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

          {!isLoading &&
            !error &&
            calls.map((call: any, idx: number) => {
              const callKey = getCallKey(call);
              const copied = copiedCallKey === callKey;
              return (
                <Card key={callKey || String(call?.id ?? idx)} className="border-border/60 shadow-sm">
                  <CardHeader className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <CardTitle className="text-xl">Detalle del caso</CardTitle>
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
            })}
        </div>
      </div>
    </div>
  );
}
