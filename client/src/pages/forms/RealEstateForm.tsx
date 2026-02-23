import { useState } from "react";
import SectionWrapper from "@/components/intake/SectionWrapper";
import ComplianceSection from "@/components/intake/ComplianceSection";
import DeadlinesSection from "@/components/intake/DeadlinesSection";
import ConflictSection from "@/components/intake/ConflictSection";
import EvidenceSection from "@/components/intake/EvidenceSection";
export default function RealEstateForm() {
  const [formData, setFormData] = useState<any>({});
  const handleChange = (n: string, v: any) =>
    setFormData((p: any) => ({ ...p, [n]: v }));

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16">

      <h1 className="text-3xl font-bold">Real Estate Intake</h1>

      <SectionWrapper title="Case Details">
        <div className="grid grid-cols-2 gap-6">

          <select className="input-modern"
            onChange={e => handleChange("transactionType", e.target.value)}>
            <option value="">Transaction type</option>
            <option>Purchase</option>
            <option>Sale</option>
            <option>Dispute</option>
          </select>

          <input className="input-modern"
            placeholder="Property address"
            onChange={e => handleChange("address", e.target.value)} />

        </div>
      </SectionWrapper>

      <SectionWrapper title="Caller Narrative">
        <textarea rows={5} className="input-modern resize-none"
          onChange={e => handleChange("narrative", e.target.value)} />
      </SectionWrapper>

      <SectionWrapper title="County (optional)">
        <input className="input-modern"
          onChange={e => handleChange("county", e.target.value)} />
      </SectionWrapper>

      <ComplianceSection onChange={handleChange} />
      <DeadlinesSection onChange={handleChange} />
      <ConflictSection onChange={handleChange} />
      <EvidenceSection practice="real-estate" onChange={handleChange} />

      <div className="flex justify-end">
        <button className="bg-blue-600 text-white px-10 py-3 rounded-xl">
          Save Lead
        </button>
      </div>
    </div>
  );
}