import { useState } from "react";
import SectionWrapper from "@/components/intake/SectionWrapper";
import ComplianceSection from "@/components/intake/ComplianceSection";
import DeadlinesSection from "@/components/intake/DeadlinesSection";
import ConflictSection from "@/components/intake/ConflictSection";
import EvidenceSection from "@/components/intake/EvidenceSection";
import {
  ManualLeadClientInfoSection,
  ManualLeadSaveButton,
  useManualLeadSubmit,
} from "./manualLeadUtils";

export default function PersonalInjuryForm() {
  const [formData, setFormData] = useState<any>({});

  const handleChange = (name: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  const { isSubmitting, handleSubmit } = useManualLeadSubmit("Personal Injury");

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Personal Injury Intake</h1>
        <p className="text-gray-500 mt-2">
          Capture incident details and supporting information.
        </p>
      </div>

      <ManualLeadClientInfoSection onChange={handleChange} />

      <SectionWrapper title="Case Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Incident Date *</label>
            <input
              type="date"
              className="input-modern"
              onChange={(e) => handleChange("incidentDate", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Injuries (brief) *</label>
            <input
              type="text"
              className="input-modern"
              onChange={(e) => handleChange("injuriesBrief", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Sought Medical Treatment?
            </label>
            <select
              className="input-modern"
              onChange={(e) => handleChange("medicalTreatment", e.target.value)}
            >
              <option value="">-</option>
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Police Report Filed?</label>
            <select
              className="input-modern"
              onChange={(e) => handleChange("policeReport", e.target.value)}
            >
              <option value="">-</option>
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper title="Caller Narrative">
        <textarea
          rows={5}
          className="input-modern resize-none"
          onChange={(e) => handleChange("narrative", e.target.value)}
        />
      </SectionWrapper>

      <ComplianceSection onChange={handleChange} />
      <DeadlinesSection onChange={handleChange} />
      <ConflictSection onChange={handleChange} />
      <EvidenceSection practice="personal-injury" onChange={handleChange} />

      <div className="flex justify-end pt-4">
        <ManualLeadSaveButton
          isSubmitting={isSubmitting}
          onClick={() => handleSubmit(formData)}
        />
      </div>
    </div>
  );
}

