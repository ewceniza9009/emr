export type TabType = "OUTREACH" | "ADMIN" | "LEGAL" | "CLINICAL" | "LOGISTICS";

export interface EnrollmentDrawerProps {
  open: boolean;
  onClose: () => void;
  outreachId: string | null;
}

export const TABS: TabType[] = [
  "OUTREACH",
  "ADMIN",
  "LEGAL",
  "CLINICAL",
  "LOGISTICS",
];

export const RELATIONSHIP_LABELS: Record<string, string> = {
  Spouse: "Spouse",
  Child: "Child",
  Parent: "Parent",
  Sibling: "Sibling",
  Relative: "Relative",
  Friend: "Friend",
  Family: "Family",
  Lawyer: "Lawyer",
  LegalRepresentative: "Legal Representative",
  Self: "Self",
  Other: "Other",
};
