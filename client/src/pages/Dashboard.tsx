import {
  Phone,
  CheckCircle,
  TrendingUp,
  Clock,
  Search,
  UserCheck,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

import { Sidebar } from "@/components/Sidebar";
import { StatsCard } from "@/components/StatsCard";
import { LeadsTable } from "@/components/LeadsTable";
import { useUser } from "@/hooks/use-auth";
import { useCallLogs } from "@/hooks/use-call-logs";
import { useLeads, useStats } from "@/hooks/use-leads";
import type { Lead } from "@shared/types";

const chartData = [
  { name: "Family Law", value: 400, color: "#3b82f6" },
  { name: "Criminal", value: 300, color: "#ef4444" },
  { name: "Corporate", value: 300, color: "#10b981" },
  { name: "Traffic", value: 200, color: "#f59e0b" },
];

function AdminAgentDashboardView({ role }: { role: "admin" | "agent" }) {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: leads, isLoading: leadsLoading } = useLeads();
  const { data: callLogs } = useCallLogs();
  const isAdmin = role === "admin";

  const pendientes = (callLogs || []).filter(
    (c: any) => c.status === "pendiente" || c.status === "rechazada_por_abogado"
  ).length;

  const enEspera = (callLogs || []).filter(
    (c: any) =>
      c.status === "en_espera_aceptacion" ||
      c.status === "pendiente_aprobacion_abogado"
  ).length;

  const asignadas = (callLogs || []).filter(
    (c: any) => c.status === "asignada"
  ).length;

  const [search, setSearch] = useState("");
  const filteredLeads: Lead[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads || [];

    return (leads || []).filter((l: any) => {
      const haystack = [
        l.name,
        l.fullName,
        l.leadName,
        l.phone,
        l.phoneNumber,
        l.email,
        l.caseType,
        l.urgency,
        l.status,
        l.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [leads, search]);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-8 animate-in">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">TUS ABOGADOS 24/7</h1>
            <p className="text-muted-foreground mt-1">CRM Dashboard & Lead Management</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search leads..."
                className="pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-64"
              />
            </div>
          </div>
        </header>

        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${
            isAdmin ? "lg:grid-cols-4" : "lg:grid-cols-1"
          } gap-4 md:gap-6 mb-8`}
        >
          <StatsCard
            title="Total Leads"
            value={stats?.totalLeads ?? 0}
            icon={<Phone className="h-6 w-6" />}
            isLoading={statsLoading}
            subtitle="+12% from last month"
            trend={{ value: 12, isPositive: true }}
          />
          {isAdmin ? (
            <>
              <StatsCard
                title="Qualified"
                value={stats?.qualifiedLeads ?? 0}
                icon={<CheckCircle className="h-6 w-6" />}
                isLoading={statsLoading}
                subtitle={`${
                  stats?.totalLeads
                    ? Math.round(((stats.qualifiedLeads || 0) / stats.totalLeads) * 100)
                    : 0
                }% of total`}
              />
              <StatsCard
                title="Converted"
                value={stats?.convertedLeads ?? 0}
                icon={<TrendingUp className="h-6 w-6" />}
                isLoading={statsLoading}
                subtitle={`${
                  stats?.qualifiedLeads
                    ? Math.round(((stats.convertedLeads || 0) / stats.qualifiedLeads) * 100)
                    : 0
                }% conversion rate`}
              />
              <StatsCard
                title="Avg Response"
                value={`${stats?.avgResponseTimeMinutes ?? 0}m`}
                icon={<Clock className="h-6 w-6" />}
                isLoading={statsLoading}
                subtitle="Response time average"
                trend={{ value: -5, isPositive: true }}
              />
            </>
          ) : null}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8">
          <StatsCard
            title="Llamadas Pendientes"
            value={pendientes}
            icon={<Clock className="h-6 w-6 text-yellow-500" />}
            subtitle="Requieren revision"
          />

          <StatsCard
            title="En espera de aceptacion"
            value={enEspera}
            icon={<Clock className="h-6 w-6 text-blue-500" />}
            subtitle="Enviadas al abogado"
          />

          <StatsCard
            title="Asignadas"
            value={asignadas}
            icon={<CheckCircle className="h-6 w-6 text-green-500" />}
            subtitle="Ya asignadas en CRM"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-card rounded-2xl border border-border p-4 shadow-sm inline-block">
            <h3 className="font-semibold text-base mb-3">Distribucion por caso</h3>

            <div className="relative h-[180px] sm:h-[200px] lg:h-[220px] mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold">1.2k</span>
                <span className="text-xs text-muted-foreground">Casos</span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {chartData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <LeadsTable leads={filteredLeads} isLoading={leadsLoading} />
          </div>
        </div>
      </main>
    </div>
  );
}

function AttorneyDashboardView() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: callLogs, isLoading: logsLoading } = useCallLogs();

  const byStatus = useMemo(() => {
    const rows = (callLogs || []) as any[];
    return {
      total: rows.length,
      pendingApproval: rows.filter(
        (c) => String(c?.status ?? "").toLowerCase() === "pendiente_aprobacion_abogado"
      ).length,
      assigned: rows.filter(
        (c) => String(c?.status ?? "").toLowerCase() === "asignada"
      ).length,
      rejected: rows.filter(
        (c) => String(c?.status ?? "").toLowerCase() === "rechazada_por_abogado"
      ).length,
    };
  }, [callLogs]);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-8 animate-in">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Abogado</h1>
          <p className="text-muted-foreground mt-1">
            Estadisticas de tus casos y llamadas asignadas.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <StatsCard
            title="Total casos"
            value={stats?.totalLeads ?? 0}
            icon={<Phone className="h-6 w-6" />}
            isLoading={statsLoading}
            subtitle="Relacionados a tu cuenta"
          />
          <StatsCard
            title="Pendientes de decision"
            value={byStatus.pendingApproval}
            icon={<Clock className="h-6 w-6 text-yellow-500" />}
            isLoading={logsLoading}
            subtitle="Requieren tu validacion"
          />
          <StatsCard
            title="Asignadas"
            value={byStatus.assigned}
            icon={<UserCheck className="h-6 w-6 text-green-500" />}
            isLoading={logsLoading}
            subtitle="Casos aceptados"
          />
          <StatsCard
            title="Rechazadas"
            value={byStatus.rejected}
            icon={<XCircle className="h-6 w-6 text-rose-500" />}
            isLoading={logsLoading}
            subtitle="No aceptadas"
          />
        </div>

      </main>
    </div>
  );
}

export default function Dashboard() {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen md:pl-64 p-6 text-sm text-muted-foreground">
        Cargando sesion...
      </div>
    );
  }

  if (user?.role === "abogado") {
    return <AttorneyDashboardView />;
  }

  return <AdminAgentDashboardView role={user?.role === "admin" ? "admin" : "agent"} />;
}
