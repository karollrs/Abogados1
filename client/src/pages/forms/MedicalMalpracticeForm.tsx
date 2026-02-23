import { useState } from "react";
import SectionWrapper from "@/components/intake/SectionWrapper";
import ComplianceSection from "@/components/intake/ComplianceSection";
import DeadlinesSection from "@/components/intake/DeadlinesSection";
import ConflictSection from "@/components/intake/ConflictSection";
import EvidenceSection from "@/components/intake/EvidenceSection";
export default function MedicalMalpracticeForm() {
  const [formData, setFormData] = useState<any>({});
  const handleChange = (n: string, v: any) =>
    setFormData((p: any) => ({ ...p, [n]: v }));

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16">

      <h1 className="text-3xl font-bold">Medical Malpractice Intake</h1>

      <SectionWrapper title="Case Details">
        <div className="grid grid-cols-2 gap-6">

          <input className="input-modern"
            placeholder="Hospital / Provider"
            onChange={e => handleChange("provider", e.target.value)} />

          <input type="date" className="input-modern"
            onChange={e => handleChange("incidentDate", e.target.value)} />

          <input className="input-modern col-span-2"
            placeholder="Injury description"
            onChange={e => handleChange("injury", e.target.value)} />

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
      <EvidenceSection practice="medical-malpractice" onChange={handleChange} />

      <div className="flex justify-end">
        <button className="bg-blue-600 text-white px-10 py-3 rounded-xl">
          Save Lead
        </button>
      </div>
    </div>
  );
}