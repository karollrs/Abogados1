export const practiceFields: any = {
  "personal-injury": {
    title: "Personal Injury Intake",
    fields: [
      { name: "accidentDate", label: "Accident Date", type: "date" },
      { name: "injuredAtWork", label: "Injured at Work?", type: "select", options: ["Yes", "No"] },
      { name: "policeReportFiled", label: "Police Report Filed?", type: "select", options: ["Yes", "No"] },
    ],
    documents: ["Police report", "Medical records", "Insurance info"]
  },

  "workers-comp": {
    title: "Workers Compensation Intake",
    fields: [
      { name: "employedAtTime", label: "Employed at time of injury?", type: "select", options: ["Yes", "No"] },
      { name: "reportedToEmployer", label: "Reported to employer?", type: "select", options: ["Yes", "No"] },
      { name: "injuries", label: "Injuries (brief)", type: "text" },
    ],
    documents: ["Incident report", "Employer notice", "Medical records", "Wage records"]
  },

  immigration: {
    title: "Immigration Intake",
    fields: [
      { name: "currentStatus", label: "Current Status", type: "text" },
      { name: "reliefSought", label: "Relief Sought", type: "text" },
      { name: "anyDeadlines", label: "Any Deadlines?", type: "text" },
    ],
    documents: ["USCIS receipts", "Passport/ID", "Court notices", "Prior orders"]
  },

  "criminal-defense": {
    title: "Criminal Defense Intake",
    fields: [
      { name: "charges", label: "Charges (if known)", type: "text" },
      { name: "courtDate", label: "Court Date", type: "date" },
      { name: "inCustody", label: "In Custody?", type: "select", options: ["Yes", "No"] },
    ],
    documents: ["Docket/case #", "Court notice", "Police paperwork", "Bail docs"]
  },

  "family-law": {
    title: "Family Law Intake",
    fields: [
      { name: "matterType", label: "Matter Type", type: "select", options: ["Divorce", "Custody", "Support", "Other"] },
      { name: "childrenInvolved", label: "# of Kids", type: "number" },
      { name: "anyDomesticViolence", label: "Any domestic violence?", type: "select", options: ["Yes", "No"] },
    ],
    documents: ["Orders/judgments", "Financials", "Birth certificates", "Marriage cert"]
  },

  bankruptcy: {
    title: "Bankruptcy Intake",
    fields: [
      { name: "chapter", label: "Likely Chapter", type: "select", options: ["Chapter 7", "Chapter 13", "Unsure"] },
      { name: "debtsSummary", label: "Debts summary", type: "text" },
      { name: "assetsSummary", label: "Assets summary", type: "text" },
    ],
    documents: ["Creditor list", "Credit reports", "Income docs", "Asset list"]
  },

  "landlord-tenant": {
    title: "Landlord Tenant Intake",
    fields: [
      { name: "role", label: "Role", type: "select", options: ["Landlord", "Tenant"] },
      { name: "issue", label: "Issue", type: "text" },
      { name: "leaseSigned", label: "Lease signed?", type: "select", options: ["Yes", "No"] },
    ],
    documents: ["Lease", "Notices", "Photos/Videos", "Receipts"]
  },

  employment: {
    title: "Employment Intake",
    fields: [
      { name: "issueType", label: "Issue", type: "select", options: ["Termination", "Discrimination", "Harassment", "Wage dispute"] },
      { name: "stillEmployed", label: "Still employed?", type: "select", options: ["Yes", "No"] },
      { name: "incidentDate", label: "Incident Date", type: "date" },
    ],
    documents: ["Offer/contract", "Pay stubs", "HR emails", "Handbook"]
  },

  "medical-malpractice": {
    title: "Medical Malpractice Intake",
    fields: [
      { name: "providerName", label: "Provider name", type: "text" },
      { name: "injuriesBrief", label: "Injuries (brief)", type: "text" },
      { name: "incidentDate", label: "Incident Date", type: "date" },
    ],
    documents: ["Medical chart", "Discharge notes", "Provider name", "Bills"]
  },

  "real-estate": {
    title: "Real Estate Intake",
    fields: [
      { name: "issueType", label: "Issue", type: "select", options: ["Purchase dispute", "Title issue", "HOA", "Other"] },
      { name: "propertyAddress", label: "Property Address", type: "text" },
    ],
    documents: ["Contract", "Rider", "Closing docs", "Notices"]
  },

  ssdi: {
    title: "SSDI Intake",
    fields: [
      { name: "workedLast5Years", label: "Worked in last 5 years?", type: "select", options: ["Yes", "No"] },
      { name: "primaryCondition", label: "Primary condition", type: "text" },
    ],
    documents: ["Medical records", "Work history", "SSA letters"]
  },

  probate: {
    title: "Probate Intake",
    fields: [
      { name: "relationToDecedent", label: "Relation to decedent", type: "text" },
      { name: "countyOfProbate", label: "County of probate", type: "text" },
    ],
    documents: ["Death certificate", "Will (if any)", "Asset list"]
  }
};