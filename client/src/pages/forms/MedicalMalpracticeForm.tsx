import { useState } from "react";
import SectionWrapper from "@/components/intake/SectionWrapper";
import ComplianceSection from "@/components/intake/ComplianceSection";
import DeadlinesSection from "@/components/intake/DeadlinesSection";
import ConflictSection from "@/components/intake/ConflictSection";
import EvidenceSection from "@/components/intake/EvidenceSection";
import { ManualLeadClientInfoSection, ManualLeadSaveButton, useManualLeadSubmit } from "./manualLeadUtils";
export default function MedicalMalpracticeForm() {
  const [formData, setFormData] = useState<any>({});
  const handleChange = (n: string, v: any) =>
    setFormData((p: any) => ({ ...p, [n]: v }));

  const { isSubmitting, handleSubmit } = useManualLeadSubmit("Medical Malpractice");

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16">

      <h1 className="text-3xl font-bold">Medical Malpractice Intake</h1>

      <ManualLeadClientInfoSection onChange={handleChange} />

      <SectionWrapper title="Case Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <input className="input-modern"
            placeholder="Hospital / Provider"
            onChange={e => handleChange("provider", e.target.value)} />

          <input type="date" className="input-modern"
            onChange={e => handleChange("incidentDate", e.target.value)} />

          <input className="input-modern md:col-span-2"
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
        <ManualLeadSaveButton isSubmitting={isSubmitting} onClick={() => handleSubmit(formData)} />
      </div>
    </div>
  );
}

