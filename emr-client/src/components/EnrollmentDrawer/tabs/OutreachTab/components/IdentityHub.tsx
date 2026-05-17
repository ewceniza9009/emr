"use client";

import React from "react";
import { PhoneCall, Pencil, Smartphone, Trash2 } from "lucide-react";
import { EnrollmentState } from "../../../hooks/useEnrollmentState";
import { formatPhoneNumber } from "../../../utils";

interface IdentityHubProps {
  state: EnrollmentState;
}

export default function IdentityHub({ state }: IdentityHubProps) {
  return (
    <section className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-4 space-y-3 shadow-inner relative group/registry">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-tight">
          Identity Hub
        </h2>
        <button
          onClick={() => state.setIsAddingRelative(!state.isAddingRelative)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
            state.isAddingRelative
              ? "bg-rose-500 text-white"
              : "bg-[var(--primary)] text-black hover:bg-[var(--primary)]/80"
          }`}
        >
          {state.isAddingRelative ? "Cancel" : "+ Add Channel"}
        </button>
      </div>

      {state.isAddingRelative && (
        <div className="bg-white/[0.02] border border-[var(--card-border)] rounded-xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2">
            <input
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] uppercase outline-none focus:border-[var(--primary)]/50"
              value={state.newContact.phoneNumber || ""}
              onChange={(e) =>
                state.setNewContact({
                  ...state.newContact,
                  phoneNumber: formatPhoneNumber(e.target.value),
                  firstName: state.lead.firstName,
                  lastName: state.lead.lastName,
                  relationship: "Self",
                })
              }
              placeholder="(XXX) XXX-XXXX"
            />
            <input
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] uppercase outline-none focus:border-[var(--primary)]/50"
              value={state.newContact.email || ""}
              onChange={(e) =>
                state.setNewContact({
                  ...state.newContact,
                  email: e.target.value,
                })
              }
              placeholder="Email"
            />
          </div>
          <button
            onClick={
              state.editingContactId
                ? state.handleUpdateContact
                : state.handleAddContact
            }
            className="w-full py-2 rounded-lg bg-[var(--primary)] text-black text-[8px] font-black uppercase tracking-widest shadow-lg"
          >
            Commit Registry
          </button>
        </div>
      )}

      <div className="bg-white/[0.015] border border-[var(--card-border)] rounded-xl overflow-hidden p-2 space-y-2">
        {/* Primary Channel */}
        {state.isEditingLead ? (
          <div className="p-4 rounded-xl border border-[var(--primary)]/40 bg-[var(--primary)]/[0.04] space-y-3 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1">
              <label className="text-[7px] font-black text-[var(--primary)] uppercase tracking-widest ml-1">
                Edit Primary Phone
              </label>
              <input
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-2 px-3 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                value={state.newContact.phoneNumber || ""}
                onChange={(e) =>
                  state.setNewContact({
                    ...state.newContact,
                    phoneNumber: formatPhoneNumber(e.target.value),
                  })
                }
                placeholder="(XXX) XXX-XXXX"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => state.setIsEditingLead(false)}
                className="px-3 py-1.5 rounded-lg text-[8px] font-black uppercase text-[var(--text-muted)] hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={state.handleUpdateLeadPhone}
                className="px-5 py-1.5 rounded-lg bg-[var(--primary)] text-black text-[8px] font-black uppercase tracking-widest shadow-lg"
              >
                Save Primary
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--primary)]/[0.03] border border-[var(--primary)]/10 hover:border-[var(--primary)]/40 transition-all group relative">
            <div className="flex items-center gap-3 min-w-0">
              <PhoneCall className="w-4 h-4 text-[var(--primary)] shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-wider leading-none truncate">
                  {formatPhoneNumber(state.lead.primaryPhone) || "NO PHONE"}
                </p>
                <span className="text-[6px] font-black text-[var(--primary)] uppercase mt-1 block tracking-widest">
                  PRIMARY CONTACT
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  state.setNewContact({
                    firstName: state.lead.firstName,
                    lastName: state.lead.lastName,
                    phoneNumber: state.lead.primaryPhone,
                    relationship: "Self",
                    email: state.lead.primaryEmail || "",
                  });
                  state.setIsEditingLead(true);
                }}
                className="opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-white/5 text-[var(--text-muted)] hover:text-[var(--primary)] transition-all shrink-0"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() =>
                  state.handleCall({ phone: state.lead.primaryPhone })
                }
                className="p-2 rounded-lg bg-[var(--primary)] text-black shadow-lg shrink-0"
              >
                <PhoneCall className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Secondary Channels */}
        {state.selfContacts.map((contact: any) => (
          <div key={contact.outreachContactId}>
            {state.editingContactId === contact.outreachContactId ? (
              <div className="p-3 rounded-lg border border-[var(--primary)]/40 bg-[var(--primary)]/[0.04] space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                    value={state.newContact.phoneNumber || ""}
                    onChange={(e) =>
                      state.setNewContact({
                        ...state.newContact,
                        phoneNumber: formatPhoneNumber(e.target.value),
                        firstName: state.lead.firstName,
                        lastName: state.lead.lastName,
                        relationship: "Self",
                      })
                    }
                    placeholder="(XXX) XXX-XXXX"
                  />
                  <input
                    className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                    value={state.newContact.email || ""}
                    onChange={(e) =>
                      state.setNewContact({
                        ...state.newContact,
                        email: e.target.value,
                      })
                    }
                    placeholder="Email"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => state.setEditingContactId(null)}
                    className="px-3 py-1.5 rounded-lg text-[8px] font-black uppercase text-[var(--text-muted)] hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={state.handleUpdateContact}
                    className="px-5 py-1.5 rounded-lg bg-[var(--primary)] text-black text-[8px] font-black uppercase tracking-widest shadow-lg"
                  >
                    Commit Sync
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all group relative">
                <div className="flex items-center gap-3 min-w-0">
                  <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-wider leading-none truncate">
                      {formatPhoneNumber(contact.phoneNumber)}
                    </p>
                    <span className="text-[6px] font-black text-[var(--text-muted)] uppercase mt-1 block tracking-widest">
                      SECONDARY CONTACT
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1">
                    <button
                      onClick={() => state.startEditingContact(contact)}
                      className="p-1.5 rounded-lg bg-white/5 text-[var(--text-muted)] hover:text-[var(--primary)] transition-all"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() =>
                        state.handleRemoveContact(contact.outreachContactId)
                      }
                      className="p-1.5 rounded-lg bg-white/5 text-rose-500/50 hover:text-rose-500 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    onClick={() =>
                      state.handleCall({
                        phone: contact.phoneNumber,
                      })
                    }
                    className="p-2 rounded-lg bg-white/10 text-[var(--text-primary)] hover:bg-[var(--primary)] hover:text-black transition-all shadow-lg"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
