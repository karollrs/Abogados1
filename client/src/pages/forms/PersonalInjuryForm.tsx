import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useNavigate } from "react-router-dom";

import SectionWrapper from "@/components/intake/SectionWrapper";
import ComplianceSection from "@/components/intake/ComplianceSection";
import DeadlinesSection from "@/components/intake/DeadlinesSection";
import ConflictSection from "@/components/intake/ConflictSection";
import EvidenceSection from "@/components/intake/EvidenceSection";

export default function PersonalInjuryForm() {
  const navigate = useNavigate();
  const createManualLead = useMutation(api.leads.createManualLead);

  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (name: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!formData.name || !formData.phone) {
      alert("Name and phone are required.");
      return;
    }

    try {
      setIsSubmitting(true);

      await createManualLead({
        name: formData.name,
        phone: formData.phone,
        practiceArea: "Personal Injury",
        data: formData,
      });

      navigate("/leads");
    } catch (error) {
      console.error("Error creating lead:", error);
      alert("Failed to create lead.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Personal Injury Intake
        </h1>
        <p className="text-gray-500 mt-2">
          Capture incident details and supporting information.
        </p>
      </div>

      {/* BASIC CLIENT INFO */}
      <SectionWrapper title="Client Information">
        <div className="grid grid-cols-2 gap-6">

          <div>
            <label className="block text-sm font-medium mb-2">
              Full Name *
            </label>
            <input
              type="text"
              className="input-modern"
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Phone *
            </label>
            <input
              type="text"
              className="input-modern"
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>

        </div>
      </SectionWrapper>

      {/* CASE DETAILS */}
      <SectionWrapper title="Case Details">
        <div className="grid grid-cols-2 gap-6">

          <div>
            <label className="block text-sm font-medium mb-2">
              Incident Date *
            </label>
            <input
              type="date"
              className="input-modern"
              onChange={(e) => handleChange("incidentDate", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Injuries (brief) *
            </label>
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
              <option value="">—</option>
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Police Report Filed?
            </label>
            <select
              className="input-modern"
              onChange={(e) => handleChange("policeReport", e.target.value)}
            >
              <option value="">—</option>
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>

        </div>
      </SectionWrapper>

      {/* NARRATIVE */}
      <SectionWrapper title="Caller Narrative">
        <textarea
          rows={5}
          className="input-modern resize-none"
          onChange={(e) => handleChange("narrative", e.target.value)}
        />
      </SectionWrapper>

      {/* REUSABLE SECTIONS */}
      <ComplianceSection onChange={handleChange} />
      <DeadlinesSection onChange={handleChange} />
      <ConflictSection onChange={handleChange} />
      <EvidenceSection practice="personal-injury" onChange={handleChange} />

      {/* SAVE BUTTON */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`px-10 py-3 rounded-xl font-semibold shadow-sm transition ${
            isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {isSubmitting ? "Saving..." : "Save Lead"}
        </button>
      </div>

    </div>
  );
}