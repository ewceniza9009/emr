"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Users, Plus, UserCircle, Edit3, Phone, Mail, ShieldCheck } from "lucide-react";
import { PermissionGate } from "@/components/PermissionGate";
import { UsePatientDashboardStateReturn } from "../hooks/usePatientDashboardState";

const DocumentVault = dynamic(() => import("@/components/DocumentVault"));

interface CoordinationRecordsTabProps {
  state: UsePatientDashboardStateReturn;
}

export function CoordinationRecordsTab({ state }: CoordinationRecordsTabProps) {
  const {
    patientId,
    patient,
    setShowAddContact,
    setEditingContact,
    alert,
  } = state;

  if (!patient) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[var(--card-bg)] rounded-[1.5rem] p-6 border border-[var(--card-border)] shadow-xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-3 uppercase tracking-tight">
              <Users className="w-6 h-6 text-emerald-400" />
              Trusted Contacts & POA
            </h2>
            <p className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest mt-1">
              Authorized Representatives & Family
            </p>
          </div>
          <PermissionGate permission="patients:edit">
            <button
              onClick={() => setShowAddContact(true)}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/20 flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" /> Add Contact
            </button>
          </PermissionGate>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {patient.contacts?.length > 0 ? (
            patient.contacts.map((contact: any) => (
              <div
                key={contact.patientContactId}
                className={`p-6 rounded-[2rem] border transition-all hover:shadow-lg ${
                  contact.isPoa
                    ? "bg-blue-500/[0.03] border-blue-500/30 shadow-blue-500/5"
                    : "bg-[var(--input-bg)] border-[var(--card-border)] shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        contact.isPoa ? "bg-blue-500 text-white" : "bg-white/10 text-slate-400"
                      }`}
                    >
                      <UserCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">
                        {contact.firstName} {contact.lastName}
                      </h3>
                      <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                        {contact.relationship}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {contact.isPoa && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-widest border border-blue-500/20">
                        POA
                      </span>
                    )}
                    <PermissionGate permission="patients:edit">
                      <button
                        onClick={() => {
                          setEditingContact(contact);
                          setShowAddContact(true);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 text-[var(--text-muted)] hover:text-white hover:bg-[var(--primary)]/20 transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </PermissionGate>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                    <Phone className="w-3.5 h-3.5 opacity-50 shrink-0" />
                    <span className="font-bold">
                      {contact.phone || "No phone recorded"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                    <Mail className="w-3.5 h-3.5 opacity-50 shrink-0" />
                    <span className="font-bold">
                      {contact.email || "No email recorded"}
                    </span>
                  </div>
                </div>
                {contact.isPoa &&
                  (() => {
                    const allDocs = [...(patient.documents || [])];
                    let displayDocs = allDocs.filter(
                      (d: any) =>
                        d.documentType === "POA" ||
                        d.title?.toUpperCase().includes("POA"),
                    );

                    // Azurite Sovereignty - prioritize Azurite links if available
                    const hasAzurite = displayDocs.some((d: any) =>
                      d.storageUrl?.toLowerCase().includes("http"),
                    );
                    if (hasAzurite) {
                      displayDocs = displayDocs.filter((d: any) =>
                        d.storageUrl?.toLowerCase().includes("http"),
                      );
                    }

                    const poaDoc = displayDocs.sort((a: any, b: any) => {
                      const aIsAzurite = a.storageUrl?.toLowerCase().includes("http");
                      const bIsAzurite = b.storageUrl?.toLowerCase().includes("http");

                      if (bIsAzurite && !aIsAzurite) return 1;
                      if (aIsAzurite && !bIsAzurite) return -1;

                      const aDate = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
                      const bDate = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
                      return bDate - aDate;
                    })[0];

                    const href = poaDoc
                      ? `${process.env.NEXT_PUBLIC_API_URL}/api/upload/document/${poaDoc.patientDocumentId}`
                      : "#";

                    return (
                      <PermissionGate permission="docs:view">
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (!poaDoc) {
                              e.preventDefault();
                              alert({
                                title: "Missing Documentation",
                                message: "No POA document found for this contact.",
                                type: "warning",
                              });
                            }
                          }}
                          className="w-full py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          View POA Documentation ({displayDocs.length})
                        </a>
                      </PermissionGate>
                    );
                  })()}
              </div>
            ))
          ) : (
            <p className="text-[10px] text-[var(--text-muted)] italic">
              No contacts registered
            </p>
          )}
        </div>
      </div>
      <DocumentVault patientId={patientId} />
    </div>
  );
}
