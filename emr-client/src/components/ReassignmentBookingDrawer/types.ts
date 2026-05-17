export interface ReassignmentBookingDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointmentId: string;
  userRoles: string[];
}
