import { useState } from "react";

import SectionWrapper from "@/components/intake/SectionWrapper";
import ComplianceSection from "@/components/intake/ComplianceSection";
import DeadlinesSection from "@/components/intake/DeadlinesSection";
import ConflictSection from "@/components/intake/ConflictSection";
import EvidenceSection from "@/components/intake/EvidenceSection";

export default function WorkersCompForm() {
  const [formData, setFormData] = useState<any>({});

  const handleChange = (name: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Workers’ Compensation Intake
        </h1>
        <p className="text-gray-500 mt-2">
          Capture employment details and workplace injury information.
        </p>
      </div>

      {/* CASE DETAILS */}
      <SectionWrapper title="Case Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employment status
            </label>
            <select
              className="input-modern"
              onChange={(e) => handleChange("employmentStatus", e.target.value)}
            >
              <option value="">—</option>
              <option>Employed</option>
              <option>Unemployed</option>
              <option>Independent contractor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Happened on the job?
            </label>
            <select
              className="input-modern"
              onChange={(e) => handleChange("onTheJob", e.target.value)}
            >
              <option value="">—</option>
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reported to employer?
            </label>
            <select
              className="input-modern"
              onChange={(e) => handleChange("reportedToEmployer", e.target.value)}
            >
              <option value="">—</option>
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Injuries (brief) *
            </label>
            <input
              type="text"
              placeholder="Type here"
              className="input-modern"
              onChange={(e) => handleChange("injuriesBrief", e.target.value)}
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
      <EvidenceSection practice="workers-comp" onChange={handleChange} />

      {/* SAVE BUTTON */}
      <div className="flex justify-end pt-4">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-xl font-semibold shadow-sm transition">
          Save Lead
        </button>
      </div>

    </div>
  );
}
