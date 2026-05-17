import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useCommandModal } from "../../CommandModalProvider";
import { useToast } from "../../ToastProvider";
import { ReassignmentBookingDrawerProps } from "../types";
import {
  GET_REASSIGNMENT_DATA,
  BOOK_APPOINTMENT,
  DELETE_APPOINTMENT,
  UPDATE_APPOINTMENT_STATUS,
} from "../queries";

export default function useReassignmentState({
  open,
  onClose,
  onSuccess,
  appointmentId,
  userRoles,
}: ReassignmentBookingDrawerProps) {
  const { confirm, alert } = useCommandModal();
  const { showToast } = useToast();

  const [leadSearch, setLeadSearch] = useState("");
  const [supportSearch, setSupportSearch] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedSupportIds, setSelectedSupportIds] = useState<string[]>([]);
  const [plannedAssessments, setPlannedAssessments] = useState<string[]>([]);
  const [booked, setBooked] = useState(false);

  const canAccess = useMemo(() => {
    const allowed = [
      "admin",
      "care navigator",
      "supporting clinician",
      "system admin",
    ];
    return userRoles.some((role) => allowed.includes(role.toLowerCase()));
  }, [userRoles]);

  const { data, loading } = useQuery(GET_REASSIGNMENT_DATA, {
    variables: { id: appointmentId },
    skip: !open || !canAccess,
    fetchPolicy: "network-only",
    onCompleted: (resData) => {
      if (resData?.appointment) {
        setSelectedLeadId(
          resData.appointment.practitioner?.practitionerId || null,
        );
        setSelectedSupportIds(
          resData.appointment.supportingClinicians?.map(
            (s: any) => s.practitionerId,
          ) || [],
        );
        setPlannedAssessments(resData.appointment.plannedAssessments || []);
      }
    },
  });

  const [updateAppt, { loading: updating }] = useMutation(BOOK_APPOINTMENT, {
    refetchQueries: ["GetScheduleData"],
    onCompleted: () => {
      setBooked(true);
      setTimeout(() => {
        setBooked(false);
        onSuccess();
        onClose();
      }, 1500);
    },
    onError: async (err) => {
      if (err.message.includes("Logistics Violation")) {
        const ok = await confirm({
          title: "Logistics Violation",
          message: `${err.message} Would you like to force this reassignment anyway?`,
          confirmText: "Force Update",
          cancelText: "Go Back",
          type: "warning",
        });

        if (ok) {
          try {
            const appointment = data?.appointment;
            await updateAppt({
              variables: {
                input: {
                  appointmentId,
                  patientId: appointment.patient.patientId,
                  practitionerId: selectedLeadId,
                  supportingPractitionerIds: selectedSupportIds,
                  scheduledStart: appointment.scheduledStart,
                  scheduledEnd: appointment.scheduledEnd,
                  modality: appointment.modality,
                  plannedAssessments,
                  overrideLogistics: true,
                },
              },
            });
          } catch (retryErr: any) {
            showToast(retryErr.message, "error");
          }
        }
      } else {
        showToast(err.message, "error");
      }
    },
  });

  const [deleteAppt] = useMutation(DELETE_APPOINTMENT, {
    refetchQueries: ["GetScheduleData"],
    onCompleted: () => {
      setBooked(true);
      setTimeout(() => {
        setBooked(false);
        onSuccess();
        onClose();
      }, 1500);
    },
    onError: (err) => showToast(err.message, "error"),
  });

  const [updateStatus, { loading: statusUpdating }] = useMutation(
    UPDATE_APPOINTMENT_STATUS,
    {
      refetchQueries: ["GetScheduleData"],
      onCompleted: () => {
        setBooked(true);
        setTimeout(() => {
          setBooked(false);
          onSuccess();
          onClose();
        }, 1500);
      },
      onError: (err) => showToast(err.message, "error"),
    },
  );

  const { cns, scs } = useMemo(() => {
    if (!data?.availableProvidersForReassignment) return { cns: [], scs: [] };

    const all = data.availableProvidersForReassignment;

    return {
      cns: all.filter(
        (p: any) =>
          p.isCareNavigator &&
          p.fullName.toLowerCase().includes(leadSearch.toLowerCase()),
      ),
      scs: all.filter(
        (p: any) =>
          !p.isCareNavigator &&
          p.fullName.toLowerCase().includes(supportSearch.toLowerCase()),
      ),
    };
  }, [data, leadSearch, supportSearch]);

  const selectedLead = useMemo(() => {
    if (!selectedLeadId || !data?.availableProvidersForReassignment)
      return null;
    return data.availableProvidersForReassignment.find(
      (p: any) => p.practitionerId === selectedLeadId,
    );
  }, [selectedLeadId, data]);

  const handleComplete = async () => {
    const ok = await confirm({
      title: "Complete Appointment",
      message:
        "Mark this encounter as completed? This will finalize the visit record.",
      type: "success",
    });
    if (ok) {
      try {
        await updateStatus({
          variables: { input: { appointmentId, status: "COMPLETED" } },
        });
      } catch (err) {
        alert({
          title: "Error",
          message: "Failed to mark appointment as completed.",
          type: "danger",
        });
      }
    }
  };

  const handleCancel = async () => {
    const ok = await confirm({
      title: "Cancel Appointment",
      message: "Are you sure you want to cancel this scheduled encounter?",
      type: "warning",
    });
    if (ok) {
      try {
        await updateStatus({
          variables: { input: { appointmentId, status: "CANCELLED" } },
        });
      } catch (err) {
        alert({
          title: "Error",
          message: "Failed to cancel appointment.",
          type: "danger",
        });
      }
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete Appointment",
      message:
        "Are you sure you want to permanently delete this appointment record?",
      type: "danger",
    });
    if (ok) {
      try {
        await deleteAppt({ variables: { id: appointmentId } });
      } catch (err) {
        alert({
          title: "Error",
          message: "Failed to delete record.",
          type: "danger",
        });
      }
    }
  };

  const handleUpdate = async () => {
    const appointment = data?.appointment;
    if (!appointment) return;

    const ok = await confirm({
      title: "Confirm Changes",
      message:
        "Are you sure you want to update the clinical team and parameters for this encounter?",
      type: "warning",
    });

    if (ok) {
      updateAppt({
        variables: {
          input: {
            appointmentId,
            patientId: appointment.patient.patientId,
            practitionerId: selectedLeadId,
            supportingPractitionerIds: selectedSupportIds,
            scheduledStart: appointment.scheduledStart,
            scheduledEnd: appointment.scheduledEnd,
            modality: appointment.modality,
            plannedAssessments,
          },
        },
      });
    }
  };

  return {
    leadSearch,
    setLeadSearch,
    supportSearch,
    setSupportSearch,
    selectedLeadId,
    setSelectedLeadId,
    selectedSupportIds,
    setSelectedSupportIds,
    plannedAssessments,
    setPlannedAssessments,
    booked,
    canAccess,
    data,
    loading,
    updating,
    statusUpdating,
    cns,
    scs,
    selectedLead,
    handleComplete,
    handleCancel,
    handleDelete,
    handleUpdate,
  };
}
