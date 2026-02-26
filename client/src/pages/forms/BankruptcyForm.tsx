import { useState } from "react";

import SectionWrapper from "@/components/intake/SectionWrapper";
import ComplianceSection from "@/components/intake/ComplianceSection";
import DeadlinesSection from "@/components/intake/DeadlinesSection";
import ConflictSection from "@/components/intake/ConflictSection";
import EvidenceSection from "@/components/intake/EvidenceSection";
import { ManualLeadClientInfoSection, ManualLeadSaveButton, useManualLeadSubmit } from "./manualLeadUtils";

export default function BankruptcyForm() {
  const [formData, setFormData] = useState<any>({});

  const handleChange = (name: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  const { isSubmitting, handleSubmit } = useManualLeadSubmit("Bankruptcy");

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bankruptcy Intake
        </h1>
        <p className="text-gray-500 mt-2">
          Capture debt, assets, and chapter details.
        </p>
      </div>

      {/* CASE DETAILS */}
      <ManualLeadClientInfoSection onChange={handleChange} />

      <SectionWrapper title="Case Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Likely chapter
            </label>
            <select
              className="input-modern"
              onChange={(e) => handleChange("chapter", e.target.value)}
            >
              <option value="">-</option>
              <option>Chapter 7</option>
              <option>Chapter 11</option>
              <option>Chapter 13</option>
              <option>Unsure</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Debts summary
            </label>
            <input
              type="text"
              placeholder="Type here"
              className="input-modern"
              onChange={(e) => handleChange("debtsSummary", e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assets summary
            </label>
            <input
              type="text"
              placeholder="Type here"
              className="input-modern"
              onChange={(e) => handleChange("assetsSummary", e.target.value)}
            />
          </div>

        </div>
      </SectionWrapper>

      {/* CALLER NARRATIVE */}
      <SectionWrapper title="Caller Narrative">
        <textarea
          rows={5}
          placeholder="In their own words..."
          className="input-modern resize-none"
          onChange={(e) => handleChange("narrative", e.target.value)}
        />
      </SectionWrapper>

      {/* COUNTY */}
      <SectionWrapper title="County (optional)">
        <input
          type="text"
          placeholder="e.g., Queens"
          className="input-modern"
          onChange={(e) => handleChange("county", e.target.value)}
        />
      </SectionWrapper>

      {/* REUSABLE SECTIONS */}
      <ComplianceSection onChange={handleChange} />
      <DeadlinesSection onChange={handleChange} />
      <ConflictSection onChange={handleChange} />
      <EvidenceSection practice="bankruptcy" onChange={handleChange} />

      {/* SAVE BUTTON */}
      <div className="flex justify-end pt-4">
        <ManualLeadSaveButton isSubmitting={isSubmitting} onClick={() => handleSubmit(formData)} />
      </div>

    </div>
  );
}


