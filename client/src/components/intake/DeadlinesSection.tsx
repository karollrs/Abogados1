import { useEffect, useMemo, useState } from "react";
import SectionWrapper from "./SectionWrapper";

interface Props {
  onChange: (name: string, value: any) => void;
}

type UrgencyLevel = "high" | "medium" | "low" | "none";

function getDaysUntil(value: string): number | null {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = date.getTime() - startToday.getTime();

  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function getUrgencyMeta(days: number | null): {
  level: UrgencyLevel;
  label: string;
  className: string;
} {
  if (days == null) {
    return {
      level: "none",
      label: "Urgency: -",
      className: "text-gray-700 border-gray-300 bg-gray-100",
    };
  }

  if (days < 0) {
    return {
      level: "high",
      label: `Urgency: HIGH (overdue ${Math.abs(days)}d)`,
      className: "text-red-700 border-red-400 bg-red-50",
    };
  }

  if (days <= 7) {
    return {
      level: "high",
      label: "Urgency: HIGH (<=7d)",
      className: "text-red-700 border-red-400 bg-red-50",
    };
  }

  if (days <= 30) {
    return {
      level: "medium",
      label: "Urgency: MEDIUM (<=30d)",
      className: "text-amber-700 border-amber-400 bg-amber-50",
    };
  }

  return {
    level: "low",
    label: `Urgency: LOW (${days}d)`,
    className: "text-emerald-700 border-emerald-400 bg-emerald-50",
  };
}

export default function DeadlinesSection({ onChange }: Props) {
  const [incidentDate, setIncidentDate] = useState("");
  const [hearingDate, setHearingDate] = useState("");

  const nearestDays = useMemo(() => {
    const incidentDays = getDaysUntil(incidentDate);
    const hearingDays = getDaysUntil(hearingDate);
    const values = [incidentDays, hearingDays].filter(
      (value): value is number => value != null
    );

    if (!values.length) return null;
    return Math.min(...values);
  }, [incidentDate, hearingDate]);

  const urgency = useMemo(() => getUrgencyMeta(nearestDays), [nearestDays]);

  useEffect(() => {
    onChange("urgency", urgency.label);
    onChange("urgencyLevel", urgency.level);
    onChange("urgencyDays", nearestDays);
  }, [nearestDays, urgency.label, urgency.level]);

  return (
    <SectionWrapper title="Deadlines & Events">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Incident date</label>
          <input
            type="date"
            className="input-modern"
            onChange={(e) => {
              setIncidentDate(e.target.value);
              onChange("incidentDate", e.target.value);
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Hearing/Court date</label>
          <input
            type="date"
            className="input-modern"
            onChange={(e) => {
              setHearingDate(e.target.value);
              onChange("hearingDate", e.target.value);
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <input
            type="text"
            placeholder="Notes"
            className="input-modern"
            onChange={(e) => onChange("deadlineNotes", e.target.value)}
          />
        </div>
      </div>

      <button
        type="button"
        className={`text-xs border px-4 py-1 rounded-full ${urgency.className}`}
      >
        {urgency.label}
      </button>
    </SectionWrapper>
  );
}
