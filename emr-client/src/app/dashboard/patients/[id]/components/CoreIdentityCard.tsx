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
  const {
    patient,
    setShowEditCommunications,
    setShowAddContact,
    setEditingContact,
    patientId,
    telemetryEnabled,
    handleToggleTelemetry,
    telemetryData,
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

      {/* Core Identity Panel */}
      <div className="bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--card-border)] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 premium-gradient" />
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
          <div className="space-y-0.5">
            <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">
              Clinical Address
            </p>
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
          </div>
          <div className="space-y-2 border-t border-[var(--card-border)] pt-3 mt-2">
            <label className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">
              Primary Care Navigator
            </label>
            <select
              value={
                practitioners.find(
                  (p: any) =>
                    `${p.firstName} ${p.lastName}`.toLowerCase() ===
                    patient.primaryCareNavigatorName?.toLowerCase()
                )?.practitionerId || ""
              }
              onChange={(e) => handleReassign(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-2 px-3 text-xs text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--primary)] transition-all cursor-pointer"
            >
              <option value="" disabled>
                -- Select Care Navigator --
              </option>
              {practitioners.map((p: any) => (
                <option key={p.practitionerId} value={p.practitionerId}>
                  {p.firstName} {p.lastName} ({p.position || "Navigator"})
                </option>
              ))}
            </select>
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
                        `Hello ${contact.firstName},\n\nYou have been granted secure Caregiver Access to ${patient.firstName} ${patient.lastName}'s digital clinical room.\n\nPlease use the following link to instantly log in on your mobile device:\n\nhttp://localhost:3672/login?token=DEMO_CAREGIVER_${patient.mrn}`
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
    </div>
  );
}
