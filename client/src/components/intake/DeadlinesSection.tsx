import SectionWrapper from "./SectionWrapper";

interface Props {
  onChange: (name: string, value: any) => void;
}

export default function DeadlinesSection({ onChange }: Props) {
  return (
    <SectionWrapper title="Deadlines & Events">

      <div className="grid grid-cols-3 gap-6 mb-6">
        <input
          type="date"
          className="input-modern"
          onChange={(e) => onChange("incidentDate", e.target.value)}
        />

        <input
          type="date"
          className="input-modern"
          onChange={(e) => onChange("hearingDate", e.target.value)}
        />

        <input
          type="text"
          placeholder="Notes"
          className="input-modern"
          onChange={(e) => onChange("deadlineNotes", e.target.value)}
        />
      </div>

      <button className="text-xs bg-gray-100 border border-gray-300 px-4 py-1 rounded-full">
        Urgency: —
      </button>

    </SectionWrapper>
  );
}