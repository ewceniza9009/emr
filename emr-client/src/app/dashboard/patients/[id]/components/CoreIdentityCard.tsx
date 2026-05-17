"use client";

import React from "react";
import {
  UserCircle,
  Phone,
  Mail,
  Users,
  ShieldCheck,
  User,
  Edit3,
  Plus,
} from "lucide-react";
import dynamic from "next/dynamic";
import { PermissionGate } from "@/components/PermissionGate";
import { UsePatientDashboardStateReturn } from "../hooks/usePatientDashboardState";

const LiveHeartbeat = dynamic(() => import("@/components/LiveHeartbeat"), {
  ssr: false,
});

interface CoreIdentityCardProps {
  state: UsePatientDashboardStateReturn;
}

export function CoreIdentityCard({ state }: CoreIdentityCardProps) {
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

  if (!patient) return null;

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
                    <p className="text-[8px] text-[var(--text-muted)] uppercase font-black tracking-widest">
                      {contact.relationship}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {contact.isPoa && (
                    <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/20 uppercase tracking-tighter">
                      POA
                    </span>
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
