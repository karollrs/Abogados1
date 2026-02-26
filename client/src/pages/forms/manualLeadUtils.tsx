import { useState } from "react";
import { useMutation } from "convex/react";
import { useLocation } from "wouter";
import { api } from "../../../../convex/_generated/api";
import SectionWrapper from "@/components/intake/SectionWrapper";

type ManualFormData = Record<string, any>;

function firstNonEmptyText(data: ManualFormData, keys: string[]): string {
  for (const key of keys) {
    const value = String(data?.[key] ?? "").trim();
    if (value) return value;
  }
  return "";
}

export function useManualLeadSubmit(practiceArea: string) {
  const [, navigate] = useLocation();
  const createManualLead = useMutation(api.leads.createManualLead);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: ManualFormData) => {
    if (isSubmitting) return;

    const name = firstNonEmptyText(formData, ["name", "fullName", "clientName"]);
    const phone = firstNonEmptyText(formData, ["phone", "phoneNumber", "callerPhone"]);

    if (!name || !phone) {
      alert("Nombre y telefono son obligatorios.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createManualLead({
        name,
        phone,
        practiceArea,
        data: {
          ...formData,
          name,
          phone,
        },
      });
      navigate("/leads");
    } catch (error) {
      console.error(`Error creating ${practiceArea} manual lead:`, error);
      alert("No se pudo guardar el lead manual.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, handleSubmit };
}

export function ManualLeadClientInfoSection({
  onChange,
}: {
  onChange: (name: string, value: any) => void;
}) {
  return (
    <SectionWrapper title="Client Information">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
          <input
            type="text"
            placeholder="Type here"
            className="input-modern"
            onChange={(e) => onChange("name", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
          <input
            type="text"
            placeholder="Type here"
            className="input-modern"
            onChange={(e) => onChange("phone", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            placeholder="Type here"
            className="input-modern"
            onChange={(e) => onChange("email", e.target.value)}
          />
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <input
            type="text"
            placeholder="Type here"
            className="input-modern"
            onChange={(e) => onChange("address", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
          <input
            type="text"
            placeholder="Type here"
            className="input-modern"
            onChange={(e) => onChange("city", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
          <input
            type="text"
            placeholder="Type here"
            className="input-modern"
            onChange={(e) => onChange("stateProvince", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">County</label>
          <input
            type="text"
            placeholder="Type here"
            className="input-modern"
            onChange={(e) => onChange("county", e.target.value)}
          />
        </div>
      </div>
    </SectionWrapper>
  );
}

export function ManualLeadSaveButton({
  isSubmitting,
  onClick,
}: {
  isSubmitting: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isSubmitting}
      className={`px-10 py-3 rounded-xl font-semibold shadow-sm transition ${
        isSubmitting
          ? "bg-gray-400 cursor-not-allowed text-white"
          : "bg-blue-600 hover:bg-blue-700 text-white"
      }`}
    >
      {isSubmitting ? "Saving..." : "Save Lead"}
    </button>
  );
}

