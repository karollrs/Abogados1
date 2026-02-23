import SectionWrapper from "./SectionWrapper";

interface Props {
    practice: string;
    onChange: (name: string, value: any) => void;
}

const evidenceMap: Record<string, string[]> = {

  "personal-injury": [
    "Photos/videos",
    "Police report",
    "Medical records",
    "Witness info",
    "Insurance info",
  ],

  "criminal-defense": [
    "Docket/Case #",
    "Court notice",
    "Police paperwork",
    "Bail docs",
  ],

  "bankruptcy": [
    "Creditor list",
    "Credit reports",
    "Income docs",
    "Asset list",
  ],

  "workers-comp": [
    "Incident report",
    "Employer notice",
    "Medical records",
    "Wage records",
  ],

  "immigration": [
    "USCIS receipts",
    "Passports/IDs",
    "Court notices",
    "Prior orders",
  ],

  "family-law": [
    "Orders/Agreements",
    "Financials",
    "Birth certificates",
    "Messages/emails",
  ],

  // 🔹 NUEVAS PRÁCTICAS

  "landlord-tenant": [
    "Lease agreement",
    "Eviction notice",
    "Payment records",
    "Repair requests",
  ],

  "employment": [
    "Employment contract",
    "Termination letter",
    "Pay stubs",
    "HR complaints",
  ],

  "medical-malpractice": [
    "Medical records",
    "Hospital bills",
    "Doctor notes",
    "Expert reports",
  ],

  "real-estate": [
    "Purchase agreement",
    "Title documents",
    "Inspection reports",
    "Closing statement",
  ],

  "ssdi": [
    "Medical records",
    "SSA letters",
    "Work history",
    "Prior denial notice",
  ],

  "probate": [
    "Death certificate",
    "Will document",
    "Asset inventory",
    "Beneficiary list",
  ],

};

export default function EvidenceSection({ practice, onChange }: Props) {
    const documents = evidenceMap[practice] || [];

    return (
        <SectionWrapper title="Evidence & Documents">

            <div className="space-y-3">
                {documents.map((doc) => (
                    <div
                        key={doc}
                        className="flex justify-between items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-100 transition"
                    >
                        <label className="flex items-center gap-3 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                onChange={(e) => onChange(doc, e.target.checked)}
                            />
                            {doc}
                        </label>

                        <button className="text-xs text-gray-400 hover:text-red-500">
                            Remove
                        </button>
                    </div>
                ))}
            </div>

        </SectionWrapper>
    );
}