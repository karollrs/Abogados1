import { MoreHorizontal, Phone, AlertCircle } from "lucide-react";
import { type Lead } from "@shared/schema";
import { useUpdateLead } from "@/hooks/use-leads";
import { useLocation } from "wouter";

const statusStyles = {
  New: "bg-blue-50 text-blue-700 ring-blue-600/20",
  Contacted: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
  Qualified: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Converted: "bg-purple-50 text-purple-700 ring-purple-600/20",
  Disqualified: "bg-gray-50 text-gray-700 ring-gray-600/20",
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
}

export function LeadsTable({ leads, isLoading }: LeadsTableProps) {
  const updateLead = useUpdateLead();
  const [, navigate] = useLocation();

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

  const handleStatusChange = (id: number, currentStatus: string) => {
    const statuses = ["New", "Contacted", "Qualified", "Converted", "Disqualified"];
    const nextIndex = (statuses.indexOf(currentStatus) + 1) % statuses.length;
    updateLead.mutate({ id, status: statuses[nextIndex] });
  };

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
              leads.map((lead) => (
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
                      className={`flex items-center gap-1.5 text-xs ${
                        urgencyStyles[lead.urgency as keyof typeof urgencyStyles] ||
                        urgencyStyles.Low
                      }`}
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                      {lead.urgency}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(lead.id, lead.status)}
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-all hover:opacity-80 ${
                        statusStyles[lead.status as keyof typeof statusStyles] ||
                        statusStyles.New
                      }`}
                    >
                      {lead.status}
                    </button>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // ✅ evita que la fila capture el click
                        const phone = lead.phone || "";
                        navigate(`/call-logs?phone=${encodeURIComponent(phone)}`);
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
    </div>
  );
}
