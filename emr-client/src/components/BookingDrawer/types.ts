export interface Props {
  open: boolean;
  onClose: () => void;
  onBooked: () => void;
  prefillDate?: string;
  appointmentId?: string;
  patientId?: string;
}

export interface AssessmentItem {
  id: string;
  label: string;
  fullName?: string;
  description: string;
}

export interface AssessmentCategory {
  category: string;
  icon: React.ReactNode;
  items: AssessmentItem[];
}
