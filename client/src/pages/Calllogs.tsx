import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useCallLogs } from "@/hooks/use-call-logs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Phone, Clock, FileText, Copy, Gavel, MapPin, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";

import { US_CITIES } from "@/hooks/usCities";
import { CASE_TYPES } from "@/hooks/caseTypes";





function formatDuration(seconds?: number | null) {
  const s = Math.max(0, Number(seconds ?? 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}

function StatusBadge({ status }: { status?: string | null }) {
  const s = (status ?? "pendiente").toLowerCase();

  if (s === "pendiente_aprobacion_abogado") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 dark:bg-orange-950/30 dark:text-orange-300">
        <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
        Pendiente por aprobacion del abogado
      </span>
    );
  }

  if (s === "pendiente") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
        Pendiente
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
        Rechazada por abogado
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
      {status ?? "â€”"}
    </span>
  );
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

function getCallState(call: any): string {
  return firstText(
    call?.stateProvince,
    call?.state,
    call?.analysis?.state,
    call?.analysis?.state_province,
    call?.analysis?.post_call_data?.state,
    call?.analysis?.post_call_data?.state_province,
    call?.analysis?.custom_analysis_data?.state,
    call?.analysis?.custom_analysis_data?.state_province
  );
}

function getCallLocation(call: any): string {
  return firstText(
    call?.location,
    call?.analysis?.location,
    call?.analysis?.post_call_data?.location,
    call?.analysis?.custom_analysis_data?.location,
    call?.analysis?.custom_analysis_data?.ubicacion
  );
}

function getCallLocationLabel(call: any): string {
  const location = getCallLocation(call);
  if (location) return location;

  const city = getCallCity(call);
  const state = getCallState(call);
  if (city && state) return `${city}, ${state}`;
  return city || state || "Ubicacion no capturada";
}

function getCallCaseType(call: any): string {
  return firstText(
    call?.caseType,
    call?.case_type,
    call?.analysis?.caseType,
    call?.analysis?.case_type,
    call?.analysis?.post_call_data?.case_type,
    call?.post_call_data?.case_type,
    call?.extracted?.case_type,
    call?.analysis?.custom_analysis_data?.case_type
  );
}

function getCallEmail(call: any): string {
  return firstText(
    call?.email,
    call?.analysis?.email,
    call?.analysis?.post_call_data?.email,
    call?.analysis?.custom_analysis_data?.email,
    call?.analysis?.custom_analysis_data?.correo
  );
}

function getCallAddress(call: any): string {
  return firstText(
    call?.address,
    call?.analysis?.address,
    call?.analysis?.post_call_data?.address,
    call?.analysis?.custom_analysis_data?.address,
    call?.analysis?.custom_analysis_data?.direccion
  );
}

function getCallCaseNotes(call: any): string {
  return firstText(
    call?.caseNotes,
    call?.analysis?.custom_analysis_data?.case_notes,
    call?.analysis?.custom_analysis_data?.notes
  );
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

function getDisconnectionReason(call: any): string {
  return String(
    call?.analysis?.disconnection_reason ??
      call?.analysis?.call_disconnection_reason ??
      call?.analysis?.call?.disconnection_reason ??
      call?.analysis?.post_call_analysis?.disconnection_reason ??
      call?.analysis?.post_call_analysis?.call_disconnection_reason ??
      ""
  ).trim();
}

function hasMeaningfulText(value: any, minLength = 1): boolean {
  return String(value ?? "").trim().length >= minLength;
}

function getCallCreatedAtMs(call: any): number {
  const raw = call?.createdAt ?? call?.created_at ?? 0;
  if (raw instanceof Date) return raw.getTime();
  if (typeof raw === "number") return raw;
  const parsed = Date.parse(String(raw));
  return Number.isFinite(parsed) ? parsed : 0;
}

function isCompleteCall(call: any): boolean {
  const summary =
    call?.summary ??
    call?.analysis?.call_summary ??
    call?.analysis?.post_call_analysis?.call_summary ??
    "";
  const transcript = call?.transcript ?? call?.analysis?.transcript ?? "";
  const reason = getDisconnectionReason(call).toLowerCase();
  const status = String(call?.status ?? "").toLowerCase();
  const successful = call?.analysis?.call_successful;

  const reasonText = `${reason} ${String(summary ?? "").toLowerCase()}`;
  const inactivityKeywords = [
    "inactivity",
    "inactive",
    "timeout",
    "no response",
    "no answer",
    "hang up",
    "hung up",
    "inactividad",
    "sin respuesta",
    "colgo",
  ];

  const endedByInactivity = inactivityKeywords.some((k) => reasonText.includes(k));
  const hasSummary = hasMeaningfulText(summary, 10);
  const hasTranscript = hasMeaningfulText(transcript, 20);
  const explicitlyBadStatus = status === "failed" || status === "error";

  if (endedByInactivity || explicitlyBadStatus) return false;
  if (successful === false) return false;
  if (!hasSummary || !hasTranscript) return false;
  return true;
}

export default function CallLogs() {
  const [, setLocation] = useLocation();

  const { data: logs, isLoading, error, refetch: refetchCallLogs } = useCallLogs();


  // âœ… Fuente REAL de query params (no falla)
  const [searchStr, setSearchStr] = useState(() => window.location.search);




  // âœ… Actualiza searchStr si cambia la URL (cuando navegas con wouter)



  useEffect(() => {
    const onPop = () => setSearchStr(window.location.search);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);



  const sp = useMemo(() => new URLSearchParams(searchStr), [searchStr]);

  const phoneFromUrl = sp.get("phone");
  const callIdFromUrl = sp.get("callId");
  const fromUrl = sp.get("from"); // "/leads" o "/dashboard"

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
  const [confirmAssignOpen, setConfirmAssignOpen] = useState(false);
  const [attorneyToAssign, setAttorneyToAssign] = useState<any>(null);
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [savingCaseDetails, setSavingCaseDetails] = useState(false);
  const [caseDetails, setCaseDetails] = useState({
    email: "",
    address: "",
    city: "",
    stateProvince: "",
    location: "",
    caseType: "",
    caseNotes: "",
  });

  // filtros
  const [cityText, setCityText] = useState("");
  const [caseTypeText, setCaseTypeText] = useState("");
  const [nameOrPhoneText, setNameOrPhoneText] = useState("");




  const filteredLogs = useMemo(() => {
    return (logs ?? []).filter((call: any) => {
      const callLocationText = norm(
        [getCallLocation(call), getCallCity(call), getCallState(call)]
          .filter(Boolean)
          .join(" ")
      );
      const callCaseType = norm(getCallCaseType(call));

      const cityMatch = !cityText || callLocationText.includes(norm(cityText));
      const caseMatch = !caseTypeText || callCaseType.includes(norm(caseTypeText));
      const searchQuery = norm(nameOrPhoneText);
      const queryDigits = searchQuery.replace(/\D/g, "");
      const callName = norm(
        call.leadName ??
          call.analysis?.custom_analysis_data?.name ??
          call.analysis?.post_call_data?.name ??
          call.name
      );
      const callPhoneRaw = String(
        call.phoneNumber ??
          call.phone ??
          call.from_number ??
          call.analysis?.from_number ??
          call.analysis?.post_call_data?.phone ??
          ""
      );
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
  }, [logs, cityText, caseTypeText, nameOrPhoneText]);

  // PAGINACION
const ITEMS_PER_PAGE = 7;
const [completePage, setCompletePage] = useState(1);
const [incompletePage, setIncompletePage] = useState(1);

// Resetear paginas cuando cambien filtros o datos
useEffect(() => {
  setCompletePage(1);
  setIncompletePage(1);
}, [cityText, caseTypeText, nameOrPhoneText, logs]);

const { completeLogsAll, incompleteLogsAll } = useMemo(() => {
  const sortedLogs = [...filteredLogs].sort(
    (a: any, b: any) => getCallCreatedAtMs(b) - getCallCreatedAtMs(a)
  );
  const complete: any[] = [];
  const incomplete: any[] = [];

  for (const call of sortedLogs) {
    if (isCompleteCall(call)) complete.push(call);
    else incomplete.push(call);
  }

  return { completeLogsAll: complete, incompleteLogsAll: incomplete };
}, [filteredLogs]);

const completeTotalPages = Math.max(
  1,
  Math.ceil(completeLogsAll.length / ITEMS_PER_PAGE)
);
const incompleteTotalPages = Math.max(
  1,
  Math.ceil(incompleteLogsAll.length / ITEMS_PER_PAGE)
);

useEffect(() => {
  setCompletePage((p) => Math.min(p, completeTotalPages));
}, [completeTotalPages]);

useEffect(() => {
  setIncompletePage((p) => Math.min(p, incompleteTotalPages));
}, [incompleteTotalPages]);

const completeLogs = useMemo(() => {
  const start = (completePage - 1) * ITEMS_PER_PAGE;
  return completeLogsAll.slice(start, start + ITEMS_PER_PAGE);
}, [completeLogsAll, completePage]);

const incompleteLogs = useMemo(() => {
  const start = (incompletePage - 1) * ITEMS_PER_PAGE;
  return incompleteLogsAll.slice(start, start + ITEMS_PER_PAGE);
}, [incompleteLogsAll, incompletePage]);


  // âœ… Auto-open por phone

  useEffect(() => {
    if (!phoneFromUrl) return;
    if (!logs?.length) return;
    if (open) return;

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
    }
  }, [phoneFromUrl, logs, open]);

  // âœ… Auto-open por callId
  useEffect(() => {
    if (!callIdFromUrl) return;
    if (!logs?.length) return;
    if (open) return;

    const found = (logs ?? []).find((l: any) => {
      const id = String(l.retellCallId ?? l.call_id ?? l.callId ?? l.id ?? "");
      return id === String(callIdFromUrl);
    });

    if (found) {
      setSelected(found);
      setOpen(true);
    }
  }, [callIdFromUrl, logs, open]);

  // âœ… Cargar abogados cuando abres el modal asignar
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

  const getLeadIdFromSelected = (s: any) => s?.leadId ?? s?.lead_id ?? s?.lead?.id ?? s?.id;
  const selectedLeadId = selected ? getLeadIdFromSelected(selected) : null;
  const selectedRetellCallId = String(
    selected?.retellCallId ?? selected?.call_id ?? selected?.callId ?? ""
  );

  useEffect(() => {
    if (!selected) return;
    setCaseDetails({
      email: getCallEmail(selected),
      address: getCallAddress(selected),
      city: getCallCity(selected),
      stateProvince: getCallState(selected),
      location: getCallLocation(selected),
      caseType: getCallCaseType(selected),
      caseNotes: getCallCaseNotes(selected),
    });
  }, [selected]);

  const attorneyScores = useMemo(() => {
    const scores = new Map<string, number>();
    if (!selected) return scores;

    const callCase = norm(getCallCaseType(selected));
    const callCity = norm(getCallCity(selected));
    const callState = norm(getCallState(selected));
    const callLocation = norm(getCallLocation(selected));
    const hasLocation = Boolean(callCity || callState || callLocation);

    (attorneys ?? []).forEach((a) => {
      const attorneyCity = norm(a.city);
      const attorneyState = norm(a.stateProvince ?? a.state);
      const attorneyLocation = `${attorneyCity} ${attorneyState}`.trim();
      const specs = Array.isArray(a.specialties) ? a.specialties.join(" ") : "";
      const specMatch = callCase && norm(specs).includes(callCase) ? 2 : 0;

      const cityExact = !!callCity && attorneyCity === callCity;
      const cityPartial = !!callCity && attorneyCity.includes(callCity);
      const stateExact = !!callState && attorneyState === callState;
      const statePartial = !!callState && attorneyState.includes(callState);
      const locationIncludes =
        !!callLocation && attorneyLocation.includes(callLocation);
      const locationScore = hasLocation
        ? cityExact || stateExact
          ? 12
          : cityPartial || statePartial || locationIncludes
            ? 10
            : 0
        : 0;

      scores.set(String(a.id), locationScore + specMatch);
    });

    return scores;
  }, [attorneys, selected]);

  const bestAttorneyIds = useMemo(() => {
    const max = Math.max(0, ...Array.from(attorneyScores.values()));
    const set = new Set<string>();
    attorneyScores.forEach((score, id) => {
      if (score === max && max > 0) set.add(id);
    });
    return set;
  }, [attorneyScores]);

  const rankedAttorneys = useMemo(() => {
    return [...(attorneys ?? [])].sort((a, b) => {
      const scoreA = attorneyScores.get(String(a.id)) ?? 0;
      const scoreB = attorneyScores.get(String(b.id)) ?? 0;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return String(a.name ?? "").localeCompare(String(b.name ?? ""));
    });
  }, [attorneys, attorneyScores]);

  const assignmentPreview = useMemo(() => {
    if (!selected || !attorneyToAssign) return null;
    return {
      attorneyName: String(attorneyToAssign?.name ?? "Abogado"),
      attorneyEmail: String(attorneyToAssign?.email ?? "sin correo"),
      leadName: String(selected?.leadName ?? "Lead"),
      leadPhone: String(selected?.phoneNumber ?? "N/A"),
      location: getCallLocationLabel(selected),
      caseType: String(getCallCaseType(selected) || "General"),
      urgency: String(selected?.urgency ?? "Media"),
      summary: String(selected?.summary ?? "Sin resumen"),
    };
  }, [selected, attorneyToAssign]);

  const saveCaseDetails = async () => {
    if (!selectedRetellCallId) return;
    try {
      setSavingCaseDetails(true);
      const payload = {
        email: caseDetails.email.trim(),
        address: caseDetails.address.trim(),
        city: caseDetails.city.trim(),
        stateProvince: caseDetails.stateProvince.trim(),
        location: caseDetails.location.trim(),
        caseType: caseDetails.caseType.trim(),
        caseNotes: caseDetails.caseNotes.trim(),
      };

      const response = await fetch(
        `/api/call-logs/${encodeURIComponent(selectedRetellCallId)}/details`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) throw new Error(await response.text());
      const updated = await response.json();
      setSelected((prev: any) => ({ ...(prev ?? {}), ...(updated ?? {}), ...payload }));
      await refetchCallLogs();
    } catch (e: any) {
      alert(e?.message ?? "No se pudo guardar la informacion del caso");
    } finally {
      setSavingCaseDetails(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div className="md:pl-64">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Call Logs</h1>
              <p className="text-muted-foreground">
                Historial de llamadas con resumen, analisis y transcripcion
              </p>
            </div>
          </div>

          {/* Filters */}
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
                list="us-cities"
                type="text"
                placeholder="Escribe una ciudadâ€¦"
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

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Tipo de caso</label>

              <input
                list="case-types"
                type="text"
                placeholder="Escribe un tipo de casoâ€¦"
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

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Llamadas
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-0">
              {isLoading && <div className="text-muted-foreground">Cargandoâ€¦</div>}

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
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-green-700 dark:text-green-300">
                      Llamadas completas
                    </h3>
                    <span className="inline-flex min-w-9 items-center justify-center rounded-full bg-muted px-3 py-1 text-lg font-bold text-foreground">
                      {completeLogsAll.length}
                    </span>
                  </div>

                  {completeLogsAll.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                      No hay llamadas completas.
                    </div>
                  )}

                  {completeLogs.map((l: any) => (
                    <div
                      key={l.id}
                      className="group rounded-2xl border border-border/50 bg-card/60 p-5 shadow-sm hover:shadow-md hover:bg-card transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold truncate">{l.leadName ?? "AI Lead"}</span>
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
                            className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition"
                          >
                            Ver detalles ⬅️
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

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4 opacity-70" />
                          {l.phoneNumber ?? "Web Call"}
                        </span>

                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 opacity-70" />
                          {getCallLocationLabel(l)}
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

                      <div className="mt-3 text-sm text-foreground/80 leading-relaxed line-clamp-2 min-h-[2.75rem]">
                        {l.summary ?? "Sin resumen disponible para esta llamada."}
                      </div>
                    </div>
                  ))}

                  {completeLogsAll.length > 0 && completeTotalPages > 1 && (
                    <div className="flex items-center justify-between gap-3 px-4 py-4 border-t border-border bg-muted/20 mt-4 rounded-xl">
                      <div className="text-xs text-muted-foreground">
                        Mostrando{" "}
                        <span className="font-medium text-foreground">
                          {(completePage - 1) * ITEMS_PER_PAGE + 1}
                        </span>
                        {"-"}
                        <span className="font-medium text-foreground">
                          {Math.min(completePage * ITEMS_PER_PAGE, completeLogsAll.length)}
                        </span>{" "}
                        de{" "}
                        <span className="font-medium text-foreground">
                          {completeLogsAll.length}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCompletePage((p) => Math.max(p - 1, 1))}
                          disabled={completePage === 1}
                          className="h-9 w-9 rounded-xl border border-border bg-card hover:bg-muted transition disabled:opacity-40"
                        >
                          {"<"}
                        </button>

                        <span className="min-w-[40px] text-center px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 text-primary font-semibold text-sm">
                          {completePage}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setCompletePage((p) => Math.min(p + 1, completeTotalPages))
                          }
                          disabled={completePage === completeTotalPages}
                          className="h-9 w-9 rounded-xl border border-border bg-card hover:bg-muted transition disabled:opacity-40"
                        >
                          {">"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-red-700 dark:text-red-300">
                      Llamadas incompletas / cortadas
                    </h3>
                    <span className="inline-flex min-w-9 items-center justify-center rounded-full bg-muted px-3 py-1 text-lg font-bold text-foreground">
                      {incompleteLogsAll.length}
                    </span>
                  </div>

                  {incompleteLogsAll.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                      No hay llamadas incompletas.
                    </div>
                  )}

                  {incompleteLogs.map((l: any) => (
                    <div
                      key={l.id}
                      className="group rounded-2xl border border-border/50 bg-card/60 p-5 shadow-sm hover:shadow-md hover:bg-card transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold truncate">{l.leadName ?? "AI Lead"}</span>
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
                            className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition"
                          >
                            Ver detalles ⬅️
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

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4 opacity-70" />
                          {l.phoneNumber ?? "Web Call"}
                        </span>

                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 opacity-70" />
                          {getCallLocationLabel(l)}
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

                      <div className="mt-3 text-sm text-foreground/80 leading-relaxed line-clamp-2 min-h-[2.75rem]">
                        {l.summary ?? "Sin resumen disponible para esta llamada."}
                      </div>
                    </div>
                  ))}

                  {incompleteLogsAll.length > 0 && incompleteTotalPages > 1 && (
                    <div className="flex items-center justify-between gap-3 px-4 py-4 border-t border-border bg-muted/20 mt-4 rounded-xl">
                      <div className="text-xs text-muted-foreground">
                        Mostrando{" "}
                        <span className="font-medium text-foreground">
                          {(incompletePage - 1) * ITEMS_PER_PAGE + 1}
                        </span>
                        {"-"}
                        <span className="font-medium text-foreground">
                          {Math.min(incompletePage * ITEMS_PER_PAGE, incompleteLogsAll.length)}
                        </span>{" "}
                        de{" "}
                        <span className="font-medium text-foreground">
                          {incompleteLogsAll.length}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIncompletePage((p) => Math.max(p - 1, 1))}
                          disabled={incompletePage === 1}
                          className="h-9 w-9 rounded-xl border border-border bg-card hover:bg-muted transition disabled:opacity-40"
                        >
                          {"<"}
                        </button>

                        <span className="min-w-[40px] text-center px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 text-primary font-semibold text-sm">
                          {incompletePage}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setIncompletePage((p) => Math.min(p + 1, incompleteTotalPages))
                          }
                          disabled={incompletePage === incompleteTotalPages}
                          className="h-9 w-9 rounded-xl border border-border bg-card hover:bg-muted transition disabled:opacity-40"
                        >
                          {">"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODAL DETALLE */}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) return;

          setSelected(null);

          // âœ… Si venÃ­a de una pantalla, volver a esa
          if (fromUrl) {
            setLocation(fromUrl);
            return;
          }

          // Si no hay from, quedarse en la ruta actual sin query params
          const currentPath = window.location.pathname;
          setLocation(currentPath);


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

                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 opacity-60" />
                    {getCallLocationLabel(selected)}
                  </span>

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
                      Transcripcion
                    </TabsTrigger>
                    <TabsTrigger value="analisis" className="rounded-lg">
                      Analisis
                    </TabsTrigger>
                    <TabsTrigger
                      value="audio"
                      className="rounded-lg"
                      disabled={!getRecordingUrl(selected)}
                    >
                      Audio
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="resumen" className="mt-4 space-y-4">
                    <Card className="rounded-2xl border-border/60 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">Resumen</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-foreground/80 leading-relaxed">
                        {selected.summary ?? selected.analysis?.call_summary ?? "Sin resumen (aÃºn)."}
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
                            navigator.clipboard.writeText(selected.transcript ?? "");
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1500);
                          }}
                          disabled={!selected.transcript}
                          className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Copy className="h-4 w-4" />
                          {copied ? "Copiado" : "Copiar"}
                        </button>
                      </CardHeader>

                      <CardContent>
                        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm whitespace-pre-wrap leading-relaxed">
                          {selected.transcript ?? "Sin transcripciÃ³n (aÃºn)."}
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
                        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                          <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                                <div className="text-xs text-muted-foreground">Sentimiento</div>
                                <div className="font-medium">
                                  {selected.analysis?.user_sentiment ?? "â€”"}
                                </div>
                              </div>

                              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                                <div className="text-xs text-muted-foreground">Exitosa</div>
                                <div className="font-medium">
                                  {String(selected.analysis?.call_successful ?? "â€”")}
                                </div>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                              <div className="text-xs text-muted-foreground mb-2">Resumen IA</div>
                              <div className="leading-relaxed text-foreground/80">
                                {selected.analysis?.call_summary ?? "â€”"}
                              </div>
                            </div>

                            <div className="rounded-2xl border border-border/60 bg-background p-4 space-y-4">
                              <div className="text-sm font-semibold">Datos editables del caso</div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-xs text-muted-foreground">Correo</label>
                                  <input
                                    type="email"
                                    value={caseDetails.email}
                                    onChange={(e) =>
                                      setCaseDetails((prev) => ({ ...prev, email: e.target.value }))
                                    }
                                    placeholder="cliente@email.com"
                                    className="w-full rounded-md border border-border px-3 py-2 text-sm"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-xs text-muted-foreground">Direccion</label>
                                  <input
                                    type="text"
                                    value={caseDetails.address}
                                    onChange={(e) =>
                                      setCaseDetails((prev) => ({ ...prev, address: e.target.value }))
                                    }
                                    placeholder="123 Main St"
                                    className="w-full rounded-md border border-border px-3 py-2 text-sm"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-xs text-muted-foreground">Ciudad</label>
                                  <input
                                    type="text"
                                    value={caseDetails.city}
                                    onChange={(e) =>
                                      setCaseDetails((prev) => ({ ...prev, city: e.target.value }))
                                    }
                                    placeholder="Linden"
                                    className="w-full rounded-md border border-border px-3 py-2 text-sm"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-xs text-muted-foreground">Estado</label>
                                  <input
                                    type="text"
                                    value={caseDetails.stateProvince}
                                    onChange={(e) =>
                                      setCaseDetails((prev) => ({
                                        ...prev,
                                        stateProvince: e.target.value,
                                      }))
                                    }
                                    placeholder="New Jersey"
                                    className="w-full rounded-md border border-border px-3 py-2 text-sm"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-xs text-muted-foreground">Ubicacion</label>
                                  <input
                                    type="text"
                                    value={caseDetails.location}
                                    onChange={(e) =>
                                      setCaseDetails((prev) => ({ ...prev, location: e.target.value }))
                                    }
                                    placeholder="Linden, New Jersey"
                                    className="w-full rounded-md border border-border px-3 py-2 text-sm"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-xs text-muted-foreground">Tipo de caso</label>
                                  <input
                                    type="text"
                                    value={caseDetails.caseType}
                                    onChange={(e) =>
                                      setCaseDetails((prev) => ({ ...prev, caseType: e.target.value }))
                                    }
                                    placeholder="Deportacion"
                                    className="w-full rounded-md border border-border px-3 py-2 text-sm"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">
                                  Notas importantes del caso
                                </label>
                                <textarea
                                  value={caseDetails.caseNotes}
                                  onChange={(e) =>
                                    setCaseDetails((prev) => ({
                                      ...prev,
                                      caseNotes: e.target.value,
                                    }))
                                  }
                                  placeholder="Datos importantes para seguimiento..."
                                  className="w-full rounded-md border border-border px-3 py-2 text-sm min-h-[88px]"
                                />
                              </div>

                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={saveCaseDetails}
                                  disabled={savingCaseDetails || !selectedRetellCallId}
                                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                                >
                                  <Save className="h-4 w-4" />
                                  {savingCaseDetails ? "Guardando..." : "Guardar datos"}
                                </button>
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
                        {getRecordingUrl(selected) ? (
                          <audio controls className="w-full">
                            <source src={getRecordingUrl(selected)} />
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

      {/* MODAL ASIGNAR ABOGADO (igual que antes) */}
      <Dialog
        open={assignOpen}
        onOpenChange={(next) => {
          setAssignOpen(next);
          if (!next) {
            setAttorneysError(null);
            setConfirmAssignOpen(false);
            setAttorneyToAssign(null);
            setAssignmentNotes("");
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Asignar abogado</DialogTitle>
          </DialogHeader>

          {!selectedLeadId ? (
            <div className="text-sm text-destructive">
              No pude detectar el leadId de esta llamada. Revisa que tu backend estÃ© retornando leadId en /api/call-logs.
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                Lead ID: <span className="text-foreground font-medium">{String(selectedLeadId)}</span>
              </div>

              {attorneysLoading && <div className="text-muted-foreground">Cargando abogadosâ€¦</div>}
              {attorneysError && <div className="text-destructive">Error: {attorneysError}</div>}

              {!attorneysLoading && !attorneysError && attorneys.length === 0 && (
                <div className="text-muted-foreground">No hay abogados registrados.</div>
              )}

              <div className="mt-2 max-h-[55vh] overflow-y-auto rounded-xl border border-border/60">
                {rankedAttorneys.map((attorney) => {
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

                        <div className="text-sm text-muted-foreground truncate">{attorney.email}</div>
                      </div>

                      <button
                        type="button"
                        disabled={assigning}
                        onClick={() => {
                          setAttorneyToAssign(attorney);
                          setConfirmAssignOpen(true);
                        }}
                        className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
                      >
                        Revisar envio
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmAssignOpen}
        onOpenChange={(next) => {
          setConfirmAssignOpen(next);
          if (!next) {
            setAttorneyToAssign(null);
            setAssignmentNotes("");
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar datos a enviar al abogado</DialogTitle>
          </DialogHeader>

          {!selected || !attorneyToAssign ? (
            <div className="text-sm text-muted-foreground">
              Selecciona una llamada y un abogado para continuar.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm space-y-2">
                <div>
                  <span className="text-muted-foreground">Abogado:</span>{" "}
                  <span className="font-medium">{assignmentPreview?.attorneyName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Correo:</span>{" "}
                  <span className="font-medium">{assignmentPreview?.attorneyEmail}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Lead:</span>{" "}
                  <span className="font-medium">{assignmentPreview?.leadName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Telefono:</span>{" "}
                  <span className="font-medium">{assignmentPreview?.leadPhone}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo de caso:</span>{" "}
                  <span className="font-medium">{assignmentPreview?.caseType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Urgencia:</span>{" "}
                  <span className="font-medium">{assignmentPreview?.urgency}</span>
                </div>
                <div className="pt-1">
                  <span className="text-muted-foreground">Resumen:</span>
                  <div className="mt-1 text-foreground/80">
                    {assignmentPreview?.summary}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notas adicionales para el correo</label>
                <textarea
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  placeholder="Agrega instrucciones o contexto para el abogado..."
                  className="w-full rounded-md border border-border px-3 py-2 text-sm min-h-[96px]"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmAssignOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium border border-border hover:bg-muted transition"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={assigning || !selectedLeadId || !attorneyToAssign}
                  onClick={async () => {
                    try {
                      setAssigning(true);
                      const r = await fetch(`/api/leads/${selectedLeadId}/assign-attorney`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          attorneyId: attorneyToAssign.id,
                          retellCallId: selectedRetellCallId || undefined,
                          assignmentNotes: assignmentNotes || undefined,
                        }),
                      });
                      if (!r.ok) throw new Error(await r.text());

                      setConfirmAssignOpen(false);
                      setAssignOpen(false);
                      setAttorneyToAssign(null);
                      setAssignmentNotes("");
                      await refetchCallLogs();
                    } catch (e: any) {
                      alert(e?.message ?? "Error enviando solicitud al abogado");
                    } finally {
                      setAssigning(false);
                    }
                  }}
                  className="rounded-xl px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {assigning ? "Enviando..." : "Confirmar y enviar"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
