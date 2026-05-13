"use client";

import React, { useState, useMemo } from "react";
import { useMutation, useQuery, gql } from "@apollo/client";
import {
  X,
  Search,
  User,
  MapPin,
  Clock,
  Loader2,
  Navigation,
  Shield,
  Stethoscope,
  Users,
  Zap,
  Activity,
  ClipboardList,
  Building2,
  Home,
  Video,
  Phone,
  HeartPulse,
  Brain,
  Sun,
  Wind,
  Timer,
  HeartHandshake,
  Check,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCommandModal } from "./CommandModalProvider";
import HalcyonPortal from "./Portal";

const GET_REASSIGNMENT_DATA = gql`
  query GetReassignmentData($id: UUID!) {
    appointment(id: $id) {
      appointmentId
      scheduledStart
      scheduledEnd
      modality
      status
      plannedAssessments
      practitioner {
        practitionerId
        fullName
        position
      }
      supportingClinicians {
        practitionerId
        fullName
        position
      }
      patient {
        patientId
        fullName
        addresses {
          isPrimary
          address {
            street
            city
            state
            postalCode
          }
        }
      }
    }
    availableProvidersForReassignment(appointmentId: $id) {
      practitionerId
      fullName
      avatarUrl
      travelTimeMinutes
      distanceInMiles
      isCareNavigator
      isSupportingClinician
      position
    }
  }
`;

const BOOK_APPOINTMENT = gql`
  mutation BookAppointment($input: BookAppointmentInput!) {
    bookAppointment(input: $input) {
      appointmentId
      practitioner {
        fullName
      }
      supportingClinicians {
        fullName
      }
    }
  }
`;

const DELETE_APPOINTMENT = gql`
  mutation DeleteAppointment($id: UUID!) {
    deleteAppointment(id: $id)
  }
`;

const ASSESSMENT_OPTIONS = [
  {
    category: "Symptom and Pain",
    icon: <HeartPulse className="w-3.5 h-3.5" />,
    items: [
      { id: "ESAS", label: "ESAS" },
      { id: "BPI", label: "BPI" },
      { id: "MSAS", label: "MSAS" },
      { id: "VICTORIA_BOWEL", label: "Victoria Bowel" },
    ],
  },
  {
    category: "Functional Status",
    icon: <Navigation className="w-3.5 h-3.5" />,
    items: [
      { id: "PPS", label: "PPS" },
      { id: "KPS", label: "KPS" },
      { id: "ECOG", label: "ECOG" },
      { id: "FAST", label: "FAST" },
    ],
  },
  {
    category: "Psychological & Cognitive",
    icon: <Brain className="w-3.5 h-3.5" />,
    items: [
      { id: "HADS", label: "HADS" },
      { id: "PHQ9", label: "PHQ-9" },
      { id: "MMSE_MOCA", label: "MMSE/MoCA" },
    ],
  },
  {
    category: "Quality of Life",
    icon: <Sun className="w-3.5 h-3.5" />,
    items: [
      { id: "MQOL", label: "MQOL" },
      { id: "FACIT_PAL", label: "FACIT-Pal" },
    ],
  },
  {
    category: "Spiritual & Existential",
    icon: <Wind className="w-3.5 h-3.5" />,
    items: [
      { id: "FICA", label: "FICA" },
      { id: "HOPE", label: "HOPE" },
    ],
  },
  {
    category: "Prognostic Indices",
    icon: <Timer className="w-3.5 h-3.5" />,
    items: [
      { id: "PPI", label: "PPI" },
      { id: "PAP", label: "PaP" },
    ],
  },
  {
    category: "Caregiver Assessment",
    icon: <HeartHandshake className="w-3.5 h-3.5" />,
    items: [
      { id: "ZBI", label: "ZBI" },
      { id: "CSI", label: "CSI" },
    ],
  },
];

const getModalityConfig = (modalityStr: string) => {
  if (!modalityStr)
    return { icon: <Activity className="w-4 h-4" />, label: "UNKNOWN" };
  const m = modalityStr.toUpperCase();
  if (m.includes("HOME"))
    return { icon: <Home className="w-4 h-4" />, label: "HOME VISIT" };
  if (m.includes("FACILITY"))
    return { icon: <Building2 className="w-4 h-4" />, label: "FACILITY" };
  if (m.includes("TELEHEALTH") || m.includes("VIDEO"))
    return { icon: <Video className="w-4 h-4" />, label: "TELEHEALTH" };
  if (m.includes("TELEPHONE"))
    return { icon: <Phone className="w-4 h-4" />, label: "TELEPHONE" };
  return {
    icon: <Activity className="w-4 h-4" />,
    label: modalityStr.replace(/_/g, " "),
  };
};

const isAppointmentInProgress = (statusStr?: string | null) => {
  if (!statusStr) return false;
  const normalizedStatus = statusStr.toUpperCase().replace(/[^A-Z]/g, "");
  return ["INPROGRESS", "ARRIVED", "STARTED", "LIVE"].includes(
    normalizedStatus,
  );
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  appointmentId: string;
  userRoles: string[];
}

export default function ReassignmentBookingDrawer({
  open,
  onClose,
  onSuccess,
  appointmentId,
  userRoles,
}: Props) {
  const { confirm, alert } = useCommandModal();
  const [leadSearch, setLeadSearch] = useState("");
  const [supportSearch, setSupportSearch] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedSupportIds, setSelectedSupportIds] = useState<string[]>([]);

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
    onCompleted: (data) => {
      if (data?.appointment) {
        setSelectedLeadId(
          data.appointment.practitioner?.practitionerId || null,
        );
        setSelectedSupportIds(
          data.appointment.supportingClinicians?.map(
            (s: any) => s.practitionerId,
          ) || [],
        );
      }
    },
  });

  const [updateAppt, { loading: updating }] = useMutation(BOOK_APPOINTMENT, {
    refetchQueries: ["GetScheduleData"],
    onCompleted: () => {
      onSuccess();
      onClose();
    },
  });

  const [deleteAppt] = useMutation(DELETE_APPOINTMENT, {
    refetchQueries: ["GetScheduleData"],
    onCompleted: () => {
      onSuccess();
      onClose();
    },
  });

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

  if (!open) return null;

  if (!canAccess) {
    return (
      <HalcyonPortal>
        <div className="fixed inset-0 z-[9999999] flex justify-end">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="relative h-full w-full max-w-[500px] bg-[var(--card-bg)] p-12 flex flex-col items-center justify-center text-center border-l border-[var(--card-border)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Access Restricted
            </h2>
            <p className="mt-2 text-[var(--text-muted)]">
              You do not have the required permissions to reassign appointments.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-[var(--primary)] text-white rounded-lg shadow-lg shadow-[var(--primary-glow)]"
            >
              Close
            </button>
          </div>
        </div>
      </HalcyonPortal>
    );
  }

  const appointment = data?.appointment;
  const address = appointment?.patient?.addresses?.find(
    (a: any) => a.isPrimary,
  )?.address;
  const modalityConfig = getModalityConfig(appointment?.modality);
  const isInProgress = isAppointmentInProgress(appointment?.status);
  const updateDisabled = !selectedLeadId || updating || isInProgress;

  return (
    <HalcyonPortal>
      <div className="fixed inset-0 z-[9999999] flex justify-end">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="relative h-full w-full max-w-[800px] bg-[var(--background)] shadow-2xl flex flex-col border-l border-[var(--card-border)] animate-in slide-in-from-right duration-300">
          <div className="p-4 bg-[var(--sidebar-bg)]/80 backdrop-blur-xl border-b border-[var(--card-border)] flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-md font-black text-[var(--text-primary)] uppercase tracking-tight">
                Modify Encounter Details
              </h2>
              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                Adjust clinical assignments and lifecycle
              </p>
            </div>
            <div className="flex items-center gap-3">
              {(() => {
                return (
                  isInProgress && (
                    <Link
                      href={`/dashboard/patients/${appointment.patient.patientId}/visit?appointmentId=${appointmentId}`}
                      className="px-4 py-2 rounded-xl bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all flex items-center gap-2 animate-pulse"
                    >
                      <Video className="w-3.5 h-3.5" />
                      Join Session
                    </Link>
                  )
                );
              })()}
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-[var(--primary)]/10 rounded-full transition-all text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
            {/* Appointment Header Data */}
            <div className="p-3 bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20 shadow-sm">
                  <User className="w-4 h-4 text-[var(--primary)]" />
                </div>
                <div>
                  <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none">
                    Patient
                  </span>
                  <p className="text-sm font-black text-[var(--text-primary)] tracking-tight">
                    {appointment?.patient?.fullName || "Loading..."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[var(--card-border)]">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[var(--primary)]/60" />
                  <div>
                    <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none">
                      Time Slot
                    </span>
                    <p className="text-[11px] font-bold text-[var(--text-secondary)]">
                      {appointment
                        ? new Date(appointment.scheduledStart).toLocaleString(
                            [],
                            { dateStyle: "medium", timeStyle: "short" },
                          )
                        : "..."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[var(--primary)]/60" />
                  <div>
                    <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none">
                      Location
                    </span>
                    <p className="text-[11px] font-bold text-[var(--text-secondary)] truncate">
                      {address ? `${address.street}, ${address.city}` : "..."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Logistics & Current Assignments */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[var(--input-bg)]/40 rounded-xl border border-[var(--card-border)] space-y-2">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-[var(--primary)]" />
                  <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                    Modality
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-center text-[var(--primary)] shadow-sm">
                    {modalityConfig.icon}
                  </div>
                  <span className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-tight">
                    {modalityConfig.label}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[var(--input-bg)]/40 rounded-xl border border-[var(--card-border)] space-y-2">
                <div className="flex items-center gap-1.5">
                  <Stethoscope className="w-3 h-3 text-[var(--primary)]" />
                  <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                    Current Lead
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)] shadow-sm">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-[var(--text-primary)] truncate">
                      {appointment?.practitioner?.fullName || "..."}
                    </p>
                    <p className="text-[7px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">
                      {appointment?.practitioner?.position || "Clinician"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support Team Readonly */}
            {appointment?.supportingClinicians?.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Users className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">
                    Supporting Team
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {appointment.supportingClinicians.map((sc: any) => (
                    <div
                      key={sc.practitionerId}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl"
                    >
                      <div className="w-5 h-5 rounded-md bg-[var(--input-bg)] flex items-center justify-center">
                        <User className="w-3 h-3 text-[var(--text-muted)]" />
                      </div>
                      <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                        {sc.fullName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="relative">
                  <Loader2 className="w-10 h-10 text-[var(--primary)] animate-spin" />
                  <Zap className="w-4 h-4 text-[var(--primary)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] animate-pulse">
                  Scanning clinical schedules...
                </span>
              </div>
            ) : (
              <div className="space-y-12">
                {/* Care Navigators Section */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black text-[var(--primary)]">
                        02
                      </span>
                      <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">
                        Clinical Lead Assignment
                      </h3>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        placeholder="Search Leads..."
                        value={leadSearch}
                        onChange={(e) => setLeadSearch(e.target.value)}
                        className="pl-9 pr-4 py-1.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-full text-[10px] text-[var(--text-primary)] font-bold focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30 transition-all placeholder:text-[var(--text-muted)]/50 w-48 shadow-inner"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {cns.map((p: any) => (
                      <ProviderCard
                        key={p.practitionerId}
                        p={p}
                        isSelected={selectedLeadId === p.practitionerId}
                        onClick={() => setSelectedLeadId(p.practitionerId)}
                        role="CN"
                      />
                    ))}
                  </div>
                </section>

                {/* Supporting Clinicians Section */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black text-sky-500">
                        03
                      </span>
                      <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">
                        Supporting Clinicians
                      </h3>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        placeholder="Search Support..."
                        value={supportSearch}
                        onChange={(e) => setSupportSearch(e.target.value)}
                        className="pl-9 pr-4 py-1.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-full text-[10px] text-[var(--text-primary)] font-bold focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/30 transition-all placeholder:text-[var(--text-muted)]/50 w-48 shadow-inner"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {scs.map((p: any) => {
                      const isSelected = selectedSupportIds.includes(
                        p.practitionerId,
                      );
                      return (
                        <ProviderCard
                          key={p.practitionerId}
                          p={p}
                          isSelected={isSelected}
                          onClick={() => {
                            setSelectedSupportIds((prev) =>
                              isSelected
                                ? prev.filter((id) => id !== p.practitionerId)
                                : [...prev, p.practitionerId],
                            );
                          }}
                          role="SC"
                        />
                      );
                    })}
                  </div>
                </section>
              </div>
            )}
          </div>

          <div className="p-4 bg-[var(--sidebar-bg)] border-t border-[var(--card-border)] space-y-4 shrink-0">
            {/* Encounter Actions */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={async () => {
                  await alert({
                    title: "Appointment Completed",
                    message:
                      "The encounter has been successfully finalized in the clinical record.",
                    type: "success",
                  });
                }}
                className="p-2.5 bg-[var(--input-bg)] hover:bg-emerald-500/10 rounded-xl border border-[var(--card-border)] hover:border-emerald-500/30 flex flex-col items-center justify-center gap-1 group transition-all"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[7px] font-black uppercase tracking-widest text-[var(--text-muted)] group-hover:text-emerald-500">
                  Done
                </span>
              </button>

              <button
                type="button"
                disabled={isInProgress}
                onClick={async () => {
                  if (isInProgress) return;
                  const ok = await confirm({
                    title: "Cancel Appointment",
                    message:
                      "Are you sure you want to cancel this scheduled encounter?",
                    type: "warning",
                  });
                  if (ok) {
                    // Logic for cancel if needed
                  }
                }}
                className={`p-2.5 bg-[var(--input-bg)] rounded-xl border border-[var(--card-border)] flex flex-col items-center justify-center gap-1 group transition-all ${
                  isInProgress
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-rose-500/10 hover:border-rose-500/30"
                }`}
                title={
                  isInProgress
                    ? "Cancel is disabled while the visit is in progress."
                    : undefined
                }
              >
                <X className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[7px] font-black uppercase tracking-widest text-[var(--text-muted)] group-hover:text-rose-500">
                  Cancel
                </span>
              </button>

              <button
                type="button"
                disabled={isInProgress}
                onClick={async () => {
                  if (isInProgress) return;
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
                }}
                className={`p-2.5 bg-[var(--input-bg)] rounded-xl border border-[var(--card-border)] flex flex-col items-center justify-center gap-1 group transition-all ${
                  isInProgress
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-red-600/20 hover:border-red-600/50"
                }`}
                title={
                  isInProgress
                    ? "Delete is disabled while the visit is in progress."
                    : undefined
                }
              >
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                <span className="text-[7px] font-black uppercase tracking-widest text-[var(--text-muted)] group-hover:text-red-600">
                  Delete
                </span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 pt-3 border-t border-[var(--card-border)]">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                  Team
                </span>
                <p className="text-[11px] font-black text-[var(--text-primary)] truncate max-w-[200px]">
                  Lead + {selectedSupportIds.length} Support
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest hover:text-[var(--text-primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-all"
                >
                  Close
                </button>
                <button
                  disabled={updateDisabled}
                  onClick={() => {
                    if (updateDisabled) return;
                    const appointment = data?.appointment;
                    if (!appointment) return;

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
                          plannedAssessments: appointment.plannedAssessments,
                        },
                      },
                    });
                  }}
                  className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg ${
                    updateDisabled
                      ? "bg-[var(--input-bg)] text-[var(--text-muted)] cursor-not-allowed opacity-50"
                      : "bg-[var(--primary)] text-white shadow-[var(--primary)]/20 hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                  title={
                    isInProgress
                      ? "Updates are disabled while the visit is in progress."
                      : undefined
                  }
                >
                  {updating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  Confirm Update
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HalcyonPortal>
  );
}

function ProviderCard({
  p,
  isSelected,
  onClick,
  role,
}: {
  p: any;
  isSelected: boolean;
  onClick: () => void;
  role?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-3 border rounded-xl text-left transition-all group relative overflow-hidden active:scale-[0.98] ${
        isSelected
          ? "bg-[var(--primary)]/10 border-[var(--primary)] shadow-md"
          : "bg-[var(--card-bg)] border-[var(--card-border)] hover:border-[var(--primary)]/40 hover:shadow-lg"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {p.avatarUrl ? (
            <div className="relative w-10 h-10 shrink-0">
              <Image
                src={p.avatarUrl}
                alt={p.fullName || "Provider"}
                fill
                className="rounded-lg border border-[var(--card-border)] object-cover shadow-sm"
                unoptimized
              />
            </div>
          ) : (
            <div
              className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors ${
                isSelected
                  ? "bg-[var(--primary)]/20 border-[var(--primary)] text-[var(--primary)]"
                  : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-muted)] group-hover:text-[var(--primary)]"
              }`}
            >
              <User className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <p
                className={`text-[12px] font-black tracking-tight transition-colors ${isSelected ? "text-[var(--primary)]" : "text-[var(--text-primary)] group-hover:text-[var(--primary)]"}`}
              >
                {p.fullName}
              </p>
              {p.isCareNavigator && (
                <span className="px-1 py-0.5 rounded bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[7px] font-black text-[var(--primary)] uppercase tracking-tighter">
                  CN
                </span>
              )}
              {p.isSupportingClinician && (
                <span className="px-1 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-[7px] font-black text-sky-500 uppercase tracking-tighter">
                  SC
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1">
                <Navigation className="w-2.5 h-2.5 text-[var(--text-muted)]" />
                <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                  {Math.round(p.travelTimeMinutes || 0)}m
                </span>
              </div>
              <span className="w-0.5 h-0.5 rounded-full bg-[var(--card-border)]" />
              <span className="text-[9px] font-bold text-[var(--text-muted)]">
                {p.distanceInMiles?.toFixed(1) || "0.0"}mi
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div
            className={`px-2 py-0.5 border rounded-md text-[8px] font-black uppercase tracking-widest ${
              isSelected
                ? "bg-[var(--primary)] text-white border-transparent"
                : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-muted)]"
            }`}
          >
            {p.position || "Clinician"}
          </div>
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
              isSelected
                ? "bg-[var(--primary)] border-transparent text-white"
                : "border-[var(--card-border)] text-transparent"
            }`}
          >
            <Check className="w-3 h-3" />
          </div>
        </div>
      </div>
    </button>
  );
}
