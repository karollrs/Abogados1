import { useState } from "react";

import SectionWrapper from "@/components/intake/SectionWrapper";
import ComplianceSection from "@/components/intake/ComplianceSection";
import DeadlinesSection from "@/components/intake/DeadlinesSection";
import ConflictSection from "@/components/intake/ConflictSection";
import EvidenceSection from "@/components/intake/EvidenceSection";

export default function ImmigrationForm() {
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
          Immigration Intake
        </h1>
        <p className="text-gray-500 mt-2">
          Capture immigration status and requested legal relief.
        </p>
      </div>

      {/* CASE DETAILS */}
      <SectionWrapper title="Case Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current status
            </label>
            <input
              type="text"
              placeholder="Type here"
              className="input-modern"
              onChange={(e) => handleChange("currentStatus", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Relief sought
            </label>
            <input
              type="text"
              placeholder="Type here"
              className="input-modern"
              onChange={(e) => handleChange("reliefSought", e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Any deadlines?
            </label>
            <input
              type="text"
              placeholder="Type here"
              className="input-modern"
              onChange={(e) => handleChange("deadlines", e.target.value)}
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
      <EvidenceSection practice="immigration" onChange={handleChange} />

      {/* SAVE BUTTON */}
      <div className="flex justify-end pt-4">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3 rounded-xl font-semibold shadow-sm transition">
          Save Lead
        </button>
      </div>

    </div>
  );
}
