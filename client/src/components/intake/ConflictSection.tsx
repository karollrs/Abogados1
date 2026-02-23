import SectionWrapper from "./SectionWrapper";

interface Props {
  onChange: (name: string, value: any) => void;
}

export default function ConflictSection({ onChange }: Props) {
  return (
    <SectionWrapper title="Conflict Check">

      <div className="grid grid-cols-3 gap-6">
        <input
          placeholder="Names / entities"
          className="input-modern"
          onChange={(e) => onChange("adverseParties", e.target.value)}
        />

        <input
          placeholder="Firm / attorney"
          className="input-modern"
          onChange={(e) => onChange("existingCounsel", e.target.value)}
        />

        <input
          placeholder="Case / File #"
          className="input-modern"
          onChange={(e) => onChange("caseFile", e.target.value)}
        />
      </div>

    </SectionWrapper>
  );
}