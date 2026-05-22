"use client";

import React from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import {
  UserCircle,
  Phone,
  Mail,
  Users,
  ShieldCheck,
  User,
  Edit3,
  Plus,
  Key,
  Copy,
  Check,
  Send,
  Star,
} from "lucide-react";
import dynamic from "next/dynamic";
import { PermissionGate } from "@/components/PermissionGate";
import { UsePatientDashboardStateReturn } from "../hooks/usePatientDashboardState";

const LiveHeartbeat = dynamic(() => import("@/components/LiveHeartbeat"), {
  ssr: false,
});

const AddressMapModal = dynamic(
  () => import("@/components/EnrollmentDrawer/components/AddressMapModal"),
  { ssr: false },
);

const GET_PRACTITIONERS = gql`
  query GetPractitioners {
    practitioners {
      practitionerId
      firstName
      lastName
      position
    }
  }
`;

const REASSIGN_NAVIGATOR = gql`
  mutation ReassignCareNavigator($patientId: UUID!, $newNavigatorId: UUID!) {
    reassignCareNavigator(patientId: $patientId, newNavigatorId: $newNavigatorId)
  }
`;

interface CoreIdentityCardProps {
  state: UsePatientDashboardStateReturn;
}

export function CoreIdentityCard({ state }: CoreIdentityCardProps) {
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [copiedCaregiverLink, setCopiedCaregiverLink] = React.useState(false);
  
  // Searchable Care Navigator Combobox states
  const [isNavigatorOpen, setIsNavigatorOpen] = React.useState(false);
  const [navigatorSearch, setNavigatorSearch] = React.useState("");
  const navigatorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navigatorRef.current && !navigatorRef.current.contains(event.target as Node)) {
        setIsNavigatorOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsNavigatorOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const {
    patient,
    setShowEditCommunications,
    setShowAddContact,
    setEditingContact,
    patientId,
    telemetryEnabled,
    handleToggleTelemetry,
    telemetryData,
    showEditAddress,
    setShowEditAddress,
    handleSaveAddress,
  } = state;

  const { data: practitionersData } = useQuery(GET_PRACTITIONERS);
  const [reassignNavigator] = useMutation(REASSIGN_NAVIGATOR);

  if (!patient) return null;

  const practitioners = practitionersData?.practitioners || [];

  const handleReassign = async (newNavigatorId: string) => {
    if (!newNavigatorId) return;
    try {
      const ok = await state.confirm({
        title: "Reassign Navigator",
        message: "Are you sure you want to reassign this patient's primary Care Navigator?",
        confirmText: "Reassign",
        type: "warning",
      });
      if (!ok) return;

      await reassignNavigator({
        variables: {
          patientId,
          newNavigatorId,
        },
      });
      await state.refetch();
      state.alert({
        title: "Navigator Reassigned",
        message: "The primary Care Navigator has been successfully updated.",
        type: "success",
      });
    } catch (err: any) {
      console.error(err);
      state.alert({
        title: "Reassignment Failed",
        message: err.message || "Failed to update Care Navigator.",
        type: "danger",
      });
    }
  };

  return (
    <div className="space-y-4 shrink-0">
      <LiveHeartbeat
        patientId={patientId}
        enabled={telemetryEnabled}
        onToggle={handleToggleTelemetry}
        status={
          !telemetryEnabled
            ? "off"
            : telemetryData.length > 0
              ? "live"
              : "initializing"
        }
      />

      <div className="bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--card-border)] shadow-xl relative overflow-visible">
        <div className="absolute top-0 left-0 w-full h-1 premium-gradient rounded-t-2xl" />
        <h2 className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
          <UserCircle className="w-3.5 h-3.5 text-[var(--primary)]" />
          Core Identity
        </h2>
        <div className="space-y-4">
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">
              Date of Birth
            </p>
            <p className="text-xs font-black text-[var(--text-primary)]">
              {patient.dob ? new Date(patient.dob).toLocaleDateString() : "--"}
            </p>
          </div>
          <div className="space-y-0.5 group/addr">
            <div className="flex items-center justify-between">
              <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                Clinical Address
              </p>
              <PermissionGate permission="patients:edit">
                <button
                  onClick={() => setShowEditAddress(true)}
                  className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all opacity-0 group-hover/addr:opacity-100"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </PermissionGate>
            </div>
            <div>
              <p className="text-xs font-black text-[var(--text-primary)] leading-tight">
                {patient.addresses?.[0]?.address?.street || "No address listed"}
                {patient.addresses?.[0]?.address?.city && (
                  <>
                    <br />
                    {patient.addresses[0].address.city}
                    {patient.addresses[0].address.state ? `, ${patient.addresses[0].address.state}` : ""}
                    {patient.addresses[0].address.postalCode ? ` ${patient.addresses[0].address.postalCode}` : ""}
                  </>
                )}
              </p>
              {(patient.addresses?.[0]?.address?.region || patient.addresses?.[0]?.address?.country) && (
                <p className="text-[9px] font-bold text-[var(--text-muted)]/60 uppercase tracking-widest mt-1">
                  {patient.addresses[0].address.region}
                  {patient.addresses[0].address.region && patient.addresses[0].address.country ? " • " : ""}
                  {patient.addresses[0].address.country}
                </p>
              )}
              {patient.addresses?.[0]?.address?.latitude != null && (
                <p className="text-[8px] font-bold text-[var(--text-muted)]/40 tracking-wider mt-0.5 font-mono">
                  {patient.addresses[0].address.latitude.toFixed(4)}, {patient.addresses[0].address.longitude?.toFixed(4)}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2 border-t border-[var(--card-border)] pt-3 mt-2" ref={navigatorRef}>
            <label className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest block">
              Primary Care Navigator
            </label>
            <div className="relative">
              {(() => {
                const currentNavigator = practitioners.find(
                  (p: any) =>
                    `${p.firstName} ${p.lastName}`.toLowerCase() ===
                    patient.primaryCareNavigatorName?.toLowerCase()
                );
                
                const filteredPractitioners = navigatorSearch.trim()
                  ? practitioners.filter((p: any) =>
                      `${p.firstName} ${p.lastName}`.toLowerCase().includes(navigatorSearch.toLowerCase()) ||
                      (p.position || "Navigator").toLowerCase().includes(navigatorSearch.toLowerCase())
                    )
                  : practitioners;

                return (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNavigatorOpen(!isNavigatorOpen);
                        setNavigatorSearch("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setIsNavigatorOpen(false);
                        }
                      }}
                      className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-2.5 px-3 text-xs text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--primary)] transition-all cursor-pointer flex items-center justify-between gap-2 text-left"
                    >
                      <span className="truncate">
                        {currentNavigator 
                          ? `${currentNavigator.firstName} ${currentNavigator.lastName} (${currentNavigator.position || "Navigator"})`
                          : "-- Select Care Navigator --"}
                      </span>
                      <span className="text-[var(--text-muted)] text-[8px] shrink-0">▼</span>
                    </button>

                    {isNavigatorOpen && (
                      <div className="absolute left-0 right-0 mt-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-2xl z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 p-2 space-y-2 max-h-64 flex flex-col">
                        <div className="relative shrink-0">
                          <input
                            type="text"
                            autoFocus
                            placeholder="Search by name or title..."
                            value={navigatorSearch}
                            onChange={(e) => setNavigatorSearch(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") {
                                setIsNavigatorOpen(false);
                              }
                            }}
                            className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg py-2 pl-3 pr-8 text-xs text-[var(--text-primary)] font-semibold placeholder:text-slate-600 focus:outline-none focus:border-[var(--primary)]/50 transition-all"
                          />
                          {navigatorSearch && (
                            <button
                              type="button"
                              onClick={() => setNavigatorSearch("")}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-[10px] font-bold"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-0.5 max-h-48 scrollbar-thin">
                          {filteredPractitioners.length > 0 ? (
                            filteredPractitioners.map((p: any) => {
                              const isSelected = p.practitionerId === currentNavigator?.practitionerId;
                              return (
                                <button
                                  key={p.practitionerId}
                                  type="button"
                                  onClick={() => {
                                    handleReassign(p.practitionerId);
                                    setIsNavigatorOpen(false);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Escape") {
                                      setIsNavigatorOpen(false);
                                    }
                                  }}
                                  className={`w-full px-3 py-2 text-left rounded-lg text-xs font-semibold transition-all flex items-center justify-between gap-2
                                    ${isSelected 
                                      ? "bg-[var(--primary)]/20 text-[var(--primary)] font-black border border-[var(--primary)]/10" 
                                      : "text-[var(--text-primary)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
                                    }`}
                                >
                                  <span className="truncate">{p.firstName} {p.lastName}</span>
                                  <span className="text-[9px] opacity-60 font-black uppercase shrink-0 tracking-wider">
                                    {p.position || "Navigator"}
                                  </span>
                                </button>
                              );
                            })
                          ) : (
                            <p className="text-[10px] text-slate-500 italic py-2 text-center">
                              No matches found
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Magic Patient Link Generator */}
      <div className="bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--card-border)] shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 to-indigo-600" />
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center gap-2">
            <Key className="w-3.5 h-3.5 text-violet-400" />
            Patient Mobile Portal Key
          </h2>
        </div>
        <p className="text-[9px] text-[var(--text-muted)] leading-relaxed mb-3">
          Send these zero-password login keys to the patient or caregiver so they can authenticate instantly on their mobile device.
          {(patient as any).deviceSignature ? (
            <span className="block mt-1.5 font-bold text-violet-400 uppercase tracking-wider">
              🔒 Bound Hardware: {(patient as any).deviceSignature}
            </span>
          ) : (
            <span className="block mt-1.5 font-bold text-emerald-400 uppercase tracking-wider animate-pulse">
              ✨ Ready for Dynamic Trust Binding
            </span>
          )}
        </p>
        <div className="flex flex-col gap-2">
          {/* Patient Copy Button */}
          <button
            onClick={async () => {
              try {
                const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const response = await fetch(`${apiBaseUrl}/api/auth/magic-token/generate`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    patientId: patient.patientId,
                    isCaregiver: false
                  })
                });
                
                if (!response.ok) throw new Error("Failed to generate magic token.");
                
                const data = await response.json();
                navigator.clipboard.writeText(data.link);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              } catch (err) {
                console.error(err);
                alert("Error: Failed to connect to secure token service. Please check that the EMR server is running.");
              }
            }}
            className="w-full py-2.5 rounded-xl bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 hover:text-violet-300 border border-violet-600/20 hover:border-violet-600/40 text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 animate-in fade-in duration-300"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 animate-bounce text-emerald-400" />
                Patient Link Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Patient Access Link
              </>
            )}
          </button>

          {/* Caregiver Copy Button */}
          <button
            onClick={async () => {
              const deviceId = prompt("Enter Caregiver's Mobile Device ID or MAC Address to cryptographically bind this magic token:", `DEV_MAC_${patient.mrn}_CAREGIVER`);
              if (deviceId === null) return; // Clinician cancelled

              try {
                const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const response = await fetch(`${apiBaseUrl}/api/auth/magic-token/generate`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    patientId: patient.patientId,
                    isCaregiver: true,
                    deviceId: deviceId || `DEV_MAC_${patient.mrn}_CAREGIVER`
                  })
                });

                if (!response.ok) throw new Error("Failed to generate magic token.");

                const data = await response.json();
                navigator.clipboard.writeText(data.link);
                setCopiedCaregiverLink(true);
                setTimeout(() => setCopiedCaregiverLink(false), 2000);
              } catch (err) {
                console.error(err);
                alert("Error: Failed to connect to secure token service. Please check that the EMR server is running.");
              }
            }}
            className="w-full py-2.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 border border-indigo-600/20 hover:border-indigo-600/40 text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 animate-in fade-in duration-300"
          >
            {copiedCaregiverLink ? (
              <>
                <Check className="w-3.5 h-3.5 animate-bounce text-emerald-400" />
                Caregiver Link Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Caregiver Access Link
              </>
            )}
          </button>

          {/* Reset Device Lock Button */}
          {(patient as any).deviceSignature && (
            <button
              onClick={async () => {
                if (!confirm("Are you sure you want to reset this patient's registered mobile hardware signature? This will allow them to bind a new device on their next login.")) return;
                
                try {
                  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                  const response = await fetch(`${apiBaseUrl}/api/auth/magic-token/reset`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      patientId: patient.patientId
                    })
                  });
                  
                  if (!response.ok) throw new Error("Failed to reset hardware binding.");
                  
                  // Refetch so the UI immediately shows "Ready for Dynamic Trust Binding"!
                  if (state.refetch) {
                    await state.refetch();
                  }
                  
                  alert("Hardware signature successfully reset! The patient can now bind a new device on their next login.");
                } catch (err) {
                  console.error(err);
                  alert("Failed to reset device binding.");
                }
              }}
              className="mt-1 w-full py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 border border-rose-500/10 hover:border-rose-500/20 text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 active:scale-95 duration-200"
            >
              🔄 Reset Hardware Lock
            </button>
          )}
        </div>
      </div>

      {/* Communications Panel */}
      <div className="bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--card-border)] shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-[var(--primary)]" />
            Communications
          </h2>
          <PermissionGate permission="patients:edit">
            <button
              onClick={() => setShowEditCommunications(true)}
              className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </PermissionGate>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-3 opacity-60">
              Patient Self-Registry
            </p>
            {patient.phones?.map((phone: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                      phone.isPrimary
                        ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                        : "bg-white/5 text-slate-500"
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-black text-[var(--text-primary)]">
                        {phone.phoneNumber}
                      </p>
                      {phone.isPrimary && (
                        <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/10 uppercase tracking-tighter">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-[8px] text-[var(--text-muted)] uppercase font-black tracking-widest">
                      {phone.type}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {patient.emails?.map((email: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                      email.isPrimary
                        ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                        : "bg-white/5 text-slate-500"
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-black text-[var(--text-primary)]">
                        {email.emailAddress}
                      </p>
                      {email.isPrimary && (
                        <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/10 uppercase tracking-tighter">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-[8px] text-[var(--text-muted)] uppercase font-black tracking-widest">
                      {email.type}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trusted Contacts Panel */}
      <div className="bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--card-border)] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            Trusted Contacts
          </h2>
          <PermissionGate permission="patients:edit">
            <button
              onClick={() => setShowAddContact(true)}
              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </PermissionGate>
        </div>
        <div className="space-y-3">
          {patient.contacts?.length > 0 ? (
            patient.contacts.map((contact: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      contact.isPoa ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/10 text-emerald-500"
                    }`}
                  >
                    {contact.isPoa ? (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-[var(--text-primary)]">
                      {contact.firstName} {contact.lastName}
                    </p>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[8px] text-[var(--text-muted)] uppercase font-black tracking-widest leading-none">
                        {contact.relationship}
                      </p>
                      {contact.email && (
                        <p className="text-[8px] text-[var(--text-muted)]/60 lowercase tracking-normal leading-none select-all mt-0.5 font-medium">
                          {contact.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {contact.isPrimaryContact && (
                    <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-tighter flex items-center gap-1">
                      <Star className="w-2 h-2 fill-emerald-400" />
                      Primary
                    </span>
                  )}
                  {contact.isPoa && (
                    <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/20 uppercase tracking-tighter">
                      POA
                    </span>
                  )}
                  {contact.email && (
                    <a
                      href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contact.email)}&su=${encodeURIComponent("Halkyone Clinical OS - Caregiver Mobile Portal Access")}&body=${encodeURIComponent(
                        `Hello ${contact.firstName},\n\nYou have been granted secure Caregiver Access to ${patient.firstName} ${patient.lastName}'s digital clinical room.\n\nPlease use the following link to instantly log in on your mobile device:\n\n${window.location.origin}/login?token=DEMO_CAREGIVER_${patient.mrn}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-all flex items-center justify-center"
                      title={`Send secure access link to ${contact.firstName} via Gmail`}
                    >
                      <Send className="w-3 h-3" />
                    </a>
                  )}
                  <PermissionGate permission="patients:edit">
                    <button
                      onClick={() => {
                        setEditingContact(contact);
                        setShowAddContact(true);
                      }}
                      className="p-1.5 rounded-lg bg-white/5 text-[var(--text-muted)] hover:text-white hover:bg-[var(--primary)]/20 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </PermissionGate>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[9px] text-[var(--text-muted)] italic">
              No contacts registered
            </p>
          )}
        </div>
      </div>

      <AddressMapModal
        isOpen={showEditAddress}
        onClose={() => setShowEditAddress(false)}
        address={{
          street: patient.addresses?.[0]?.address?.street || "",
          city: patient.addresses?.[0]?.address?.city || "",
          state: patient.addresses?.[0]?.address?.state || "",
          postalCode: patient.addresses?.[0]?.address?.postalCode || "",
          region: patient.addresses?.[0]?.address?.region || "",
          country: patient.addresses?.[0]?.address?.country || "Philippines",
          latitude: patient.addresses?.[0]?.address?.latitude ?? null,
          longitude: patient.addresses?.[0]?.address?.longitude ?? null,
        }}
        onSave={handleSaveAddress}
      />
    </div>
  );
}
