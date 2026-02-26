import { useMemo, useState, useEffect } from "react";
import { MoreHorizontal, Phone, AlertCircle } from "lucide-react";
import { type Lead } from "@shared/types";

import { useLocation } from "wouter";

const statusStyles = {
  pendiente: "bg-yellow-100 text-yellow-800 ring-yellow-600/20",
  en_espera_aceptacion: "bg-blue-100 text-blue-800 ring-blue-600/20",
  pendiente_aprobacion_abogado: "bg-blue-100 text-blue-800 ring-blue-600/20",
  asignada: "bg-green-100 text-green-800 ring-green-600/20",
  rechazada_por_abogado: "bg-red-100 text-red-800 ring-red-600/20",
  finalizado: "bg-slate-200 text-slate-800 ring-slate-500/20",
};

const statusLabels = {
  pendiente: "Pendiente",
  en_espera_aceptacion: "En revision",
  pendiente_aprobacion_abogado: "En revision",
  asignada: "Asignada",
  rechazada_por_abogado: "Rechazada",
  finalizado: "Finalizado",
};


const urgencyStyles = {
  Low: "text-muted-foreground",
  Medium: "text-yellow-600 font-medium",
  High: "text-orange-600 font-bold",
  Critical: "text-red-600 font-bold animate-pulse",
};

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  callLogsPath?: string;
}

export function LeadsTable({ leads, isLoading, callLogsPath = "/calls" }: LeadsTableProps) {

  const [location, navigate] = useLocation();

  const ITEMS_PER_PAGE = 7;
  const [currentPage, setCurrentPage] = useState(1);

  // si cambia la lista (por búsqueda/filtros), vuelve a página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [leads]);

  const totalPages = Math.max(1, Math.ceil((leads?.length || 0) / ITEMS_PER_PAGE));

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return (leads || []).slice(start, start + ITEMS_PER_PAGE);
  }, [leads, currentPage]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
        <div className="h-8 w-48 bg-muted rounded mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 w-full bg-muted/50 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }



  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/30">
        <h3 className="font-display font-semibold text-lg">Recent Leads</h3>
        <button className="text-sm text-primary hover:underline font-medium">
          View All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Contact</th>
              <th className="px-6 py-3 font-medium">Case Type</th>
              <th className="px-6 py-3 font-medium">Urgency</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  No leads found. Waiting for calls...
                </td>
              </tr>
            ) : (
              paginatedLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-foreground">{lead.name}</div>
                    <div className="text-xs text-muted-foreground">ID: #{lead.id}</div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{lead.phone}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-inset ring-gray-500/10">
                      {lead.caseType}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div
                      className={`flex items-center gap-1.5 text-xs ${urgencyStyles[lead.urgency as keyof typeof urgencyStyles] ||
                        urgencyStyles.Low
                        }`}
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                      {lead.urgency}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyles[lead.status as keyof typeof statusStyles] ||
                        "bg-gray-100 text-gray-600"
                        }`}
                    >
                      {statusLabels[lead.status as keyof typeof statusLabels] ?? lead.status}
                    </span>
                  </td>



                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const callId = String(lead.retellCallId ?? "").trim();
                        const phone = lead.phone || "";
                        const from = encodeURIComponent(location || "/");
                        if (callId) {
                          navigate(
                            `${callLogsPath}?callId=${encodeURIComponent(callId)}&from=${from}`
                          );
                          return;
                        }

                        navigate(
                          `${callLogsPath}?phone=${encodeURIComponent(phone)}&from=${from}`
                        );

                      }}
                      className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-primary/5"
                      title="Ver llamadas"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination (FUERA de la tabla) */}
      {/* Pagination (minimal + bonita) */}
      {leads.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border bg-muted/20">
          <div className="text-xs text-muted-foreground">
            Mostrando{" "}
            <span className="font-medium text-foreground">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}
            </span>
            {"–"}
            <span className="font-medium text-foreground">
              {Math.min(currentPage * ITEMS_PER_PAGE, leads.length)}
            </span>{" "}
            de{" "}
            <span className="font-medium text-foreground">{leads.length}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="h-9 w-9 rounded-xl border border-border bg-card hover:bg-muted transition disabled:opacity-40 disabled:hover:bg-card"
              aria-label="Página anterior"
              title="Anterior"
            >
              {"<"}
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Página
              </span>

              <span className="min-w-[44px] text-center px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 text-primary font-semibold text-sm">
                {currentPage}
              </span>

              <span className="text-xs text-muted-foreground">
                de <span className="font-medium text-foreground">{totalPages}</span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="h-9 w-9 rounded-xl border border-border bg-card hover:bg-muted transition disabled:opacity-40 disabled:hover:bg-card"
              aria-label="Página siguiente"
              title="Siguiente"
            >
              {">"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

