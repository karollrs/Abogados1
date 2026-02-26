import { useState } from "react";
import SectionWrapper from "@/components/intake/SectionWrapper";
import ComplianceSection from "@/components/intake/ComplianceSection";
import DeadlinesSection from "@/components/intake/DeadlinesSection";
import ConflictSection from "@/components/intake/ConflictSection";
import EvidenceSection from "@/components/intake/EvidenceSection";
import { ManualLeadClientInfoSection, ManualLeadSaveButton, useManualLeadSubmit } from "./manualLeadUtils";
export default function EmploymentForm() {
  const [formData, setFormData] = useState<any>({});
  const handleChange = (n: string, v: any) =>
    setFormData((p: any) => ({ ...p, [n]: v }));

  const { isSubmitting, handleSubmit } = useManualLeadSubmit("Employment");

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16">

      <h1 className="text-3xl font-bold">Employment Intake</h1>

      <ManualLeadClientInfoSection onChange={handleChange} />

      <SectionWrapper title="Case Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <select className="input-modern"
            onChange={e => handleChange("issueType", e.target.value)}>
            <option value="">Issue type</option>
            <option>Wrongful termination</option>
            <option>Discrimination</option>
            <option>Harassment</option>
            <option>Unpaid wages</option>
          </select>

          <input className="input-modern"
            placeholder="Employer name"
            onChange={e => handleChange("employer", e.target.value)} />

          <input className="input-modern md:col-span-2"
            placeholder="Job title"
            onChange={e => handleChange("position", e.target.value)} />

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
      <EvidenceSection practice="employment" onChange={handleChange} />

      <div className="flex justify-end">
        <ManualLeadSaveButton isSubmitting={isSubmitting} onClick={() => handleSubmit(formData)} />
      </div>
    </div>
  );
}

