import { Sidebar } from "@/components/Sidebar";
import { useLocation } from "wouter";
import {
  Briefcase,
  Shield,
  Scale,
  Home,
  Building,
  Heart,
  Users,
  Gavel,
  FileText,
  Banknote,
  Stethoscope,
  BadgeDollarSign,
} from "lucide-react";

const practiceAreas = [
  { key: "personal-injury", label: "Personal Injury", icon: Heart },
  { key: "workers-comp", label: "Workers’ Comp", icon: Briefcase },
  { key: "immigration", label: "Immigration", icon: Shield },
  { key: "criminal-defense", label: "Criminal Defense", icon: Gavel },
  { key: "family-law", label: "Family Law", icon: Users },
  { key: "bankruptcy", label: "Bankruptcy", icon: Banknote },
  { key: "landlord-tenant", label: "Landlord-Tenant", icon: Home },
  { key: "employment", label: "Employment", icon: Building },
  { key: "medical-malpractice", label: "Medical Malpractice", icon: Stethoscope },
  { key: "real-estate", label: "Real Estate", icon: FileText },
  { key: "ssdi", label: "SSDI", icon: BadgeDollarSign },
  { key: "probate", label: "Probate", icon: Scale },
];

export default function NewManualLead() {
  const [, setLocation] = useLocation();

  return (
    <>
      <Sidebar />

      <div className="ml-64 bg-gray-50 min-h-screen flex justify-center">
        <div className="w-full max-w-6xl px-10 py-12">

          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-gray-800">
              Select Practice Area
            </h1>
            <p className="text-gray-500 mt-2">
              Pick the closest match — this drives smarter questions in the next step.
            </p>
          </div>

          {/* Card Container */}
          <div className="bg-white border rounded-3xl p-10 shadow-sm">

            <div className="grid grid-cols-3 gap-6">
              {practiceAreas.map((area) => {
                const Icon = area.icon;

                return (
                  <button
                    key={area.key}
                    onClick={() =>
                      setLocation(`/leads/new-manual/${area.key}`)
                    }
                    className="flex items-center gap-4 bg-gray-50 hover:bg-blue-50 border rounded-2xl px-6 py-5 transition-all hover:border-blue-500 hover:shadow-md hover:scale-[1.02]"
                  >
                    <Icon className="w-6 h-6 text-blue-600" />
                    <span className="text-base font-semibold text-gray-800">
                      {area.label}
                    </span>
                  </button>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}