import { useState } from "react";
import SectionWrapper from "@/components/intake/SectionWrapper";
import ComplianceSection from "@/components/intake/ComplianceSection";
import DeadlinesSection from "@/components/intake/DeadlinesSection";
import ConflictSection from "@/components/intake/ConflictSection";
import EvidenceSection from "@/components/intake/EvidenceSection";
import { ManualLeadClientInfoSection, ManualLeadSaveButton, useManualLeadSubmit } from "./manualLeadUtils";

export default function LandlordTenantForm() {
  const [formData, setFormData] = useState<any>({});
  const handleChange = (n: string, v: any) =>
    setFormData((p: any) => ({ ...p, [n]: v }));

  const { isSubmitting, handleSubmit } = useManualLeadSubmit("Landlord-Tenant");

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16">

      <div>
        <h1 className="text-3xl font-bold">Landlord / Tenant Intake</h1>
        <p className="text-gray-500 mt-2">
          Capture dispute type and housing details.
        </p>
      </div>

      <ManualLeadClientInfoSection onChange={handleChange} />

      <SectionWrapper title="Case Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <select className="input-modern"
            onChange={e => handleChange("role", e.target.value)}>
            <option value="">Role</option>
            <option>Tenant</option>
            <option>Landlord</option>
          </select>

          <select className="input-modern"
            onChange={e => handleChange("issueType", e.target.value)}>
            <option value="">Issue type</option>
            <option>Eviction</option>
            <option>Non-payment</option>
            <option>Lease dispute</option>
            <option>Repairs</option>
          </select>

          <input
            className="input-modern md:col-span-2"
            placeholder="Property address"
            onChange={e => handleChange("address", e.target.value)}
          />

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
      <EvidenceSection practice="landlord-tenant" onChange={handleChange} />

      <div className="flex justify-end">
        <ManualLeadSaveButton isSubmitting={isSubmitting} onClick={() => handleSubmit(formData)} />
      </div>
    </div>
  );
}

