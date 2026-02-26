import SectionWrapper from "./SectionWrapper";

interface Props {
  onChange: (name: string, value: any) => void;
}

export default function ComplianceSection({ onChange }: Props) {
  return (
    <SectionWrapper title="Compliance & Consent">

      <div className="flex justify-end mb-6">
        <button className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-300 px-3 py-1 rounded-full">
          🔒 Privacy Mode
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <label className="flex items-center gap-3 text-sm text-gray-700">
          <input
            type="checkbox"
            onChange={(e) => onChange("terms", e.target.checked)}
          />
          Terms acknowledged
        </label>

        <label className="flex items-center gap-3 text-sm text-gray-700">
          <input
            type="checkbox"
            onChange={(e) => onChange("smsConsent", e.target.checked)}
          />
          SMS consent
        </label>

        <label className="flex items-center gap-3 text-sm text-gray-700">
          <input
            type="checkbox"
            onChange={(e) => onChange("emailConsent", e.target.checked)}
          />
          Email consent
        </label>

        <input
          type="text"
          placeholder="Notes"
          className="input-modern"
          onChange={(e) => onChange("complianceNotes", e.target.value)}
        />

      </div>

      <p className="text-xs text-gray-400 mt-6">
        Timestamp: —
      </p>

    </SectionWrapper>
  );
}
