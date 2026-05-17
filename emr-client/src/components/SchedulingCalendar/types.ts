export interface Practitioner {
  practitionerId: string;
  firstName: string;
  lastName: string;
  position: string;
}

export interface AddressDetail {
  street: string;
}

export interface Address {
  isPrimary: boolean;
  address: AddressDetail;
}

export interface Patient {
  firstName: string;
  lastName: string;
  mrn: string;
  addresses: Address[];
}

export interface Encounter {
  practitioner?: Practitioner;
}

export interface Appointment {
  appointmentId: string;
  scheduledStart: string;
  scheduledEnd: string;
  modality: string;
  status: string;
  travelTimeMinutes?: number;
  distanceInMiles?: number;
  practitionerId?: string;
  plannedAssessments?: string[];
  practitioner?: Practitioner;
  supportingClinicians?: Practitioner[];
  encounters?: Encounter[];
  patient?: Patient;
}

export interface ScheduleBlock {
  blockId: string;
  startTime: string;
  endTime: string;
  status: string;
  practitionerId: string;
  practitioner?: Practitioner;
}

export interface GridConfig {
  START_HOUR: number;
  END_HOUR: number;
  TOTAL_MINUTES: number;
  ROW_HEIGHT: number;
  DAYS: string[];
  TIMEZONE: string;
}

export type CalendarView = "week" | "team" | "month";

export interface ConfirmModalState {
  isOpen: boolean;
  onConfirm: (recalculateTravelTime: boolean) => void;
  title: string;
  message: string;
}
