import { Sidebar } from "@/components/Sidebar";
import { useRoute, useLocation } from "wouter";

import PersonalInjuryForm from "@/pages/forms/PersonalInjuryForm";
import WorkersCompForm from "@/pages/forms/WorkersCompForm";
import ImmigrationForm from "@/pages/forms/ImmigrationForm";
import CriminalDefenseForm from "./forms/CriminalDefenseForm";
import FamilyLawForm from "./forms/FamilyLawForm";
import BankruptcyForm from "./forms/BankruptcyForm";
import LandlordTenantForm from "./forms/LandlordTenantForm";
import EmploymentForm from "./forms/EmploymentForm";
import MedicalMalpracticeForm from "./forms/MedicalMalpracticeForm";
import RealEstateForm from "./forms/RealEstateForm";
import SSDIForm from "./forms/SSDIForm";
import ProbateForm from "./forms/ProbateForm";

const PRACTICE_AREAS = [
  "personal-injury",
  "workers-comp",
  "immigration",
  "criminal-defense",
  "family-law",
  "bankruptcy",
  "landlord-tenant",
  "employment",
  "medical-malpractice",
  "real-estate",
  "ssdi",
  "probate",
];

export default function ManualLeadForm() {
  const [match, params] = useRoute("/leads/new-manual/:practiceArea");
  const [, navigate] = useLocation();

  if (!match) return null;

  const practiceArea = params.practiceArea;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 min-h-screen">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => navigate("/leads/new-manual")}
              className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition"
            >
              {"<- Back"}
            </button>
          </div>

          {practiceArea === "personal-injury" && <PersonalInjuryForm />}
          {practiceArea === "workers-comp" && <WorkersCompForm />}
          {practiceArea === "immigration" && <ImmigrationForm />}
          {practiceArea === "criminal-defense" && <CriminalDefenseForm />}
          {practiceArea === "family-law" && <FamilyLawForm />}
          {practiceArea === "bankruptcy" && <BankruptcyForm />}
          {practiceArea === "landlord-tenant" && <LandlordTenantForm />}
          {practiceArea === "employment" && <EmploymentForm />}
          {practiceArea === "medical-malpractice" && <MedicalMalpracticeForm />}
          {practiceArea === "real-estate" && <RealEstateForm />}
          {practiceArea === "ssdi" && <SSDIForm />}
          {practiceArea === "probate" && <ProbateForm />}

          {!PRACTICE_AREAS.includes(practiceArea) && (
            <div className="text-red-600 text-xl font-semibold">Invalid Practice Area</div>
          )}
        </div>
      </main>
    </div>
  );
}
