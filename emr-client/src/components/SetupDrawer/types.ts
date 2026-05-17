export type SetupEntityType =
  | "practitioners"
  | "facilities"
  | "healthPlans"
  | "medications"
  | "smartPhrases"
  | "questionnaires"
  | "equipment"
  | "outreachScripts"
  | "integrationProfiles";

export interface SetupDrawerProps {
  open: boolean;
  type: SetupEntityType;
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
  tenantId?: string;
}
