"use client";

import React from "react";
import { Users, Pencil, Trash2, PhoneCall } from "lucide-react";
import { EnrollmentState } from "../../../hooks/useEnrollmentState";
import { RELATIONSHIP_LABELS } from "../../../types";
import { formatPhoneNumber } from "../../../utils";

interface ProxyRegistryProps {
  state: EnrollmentState;
}

export default function ProxyRegistry({ state }: ProxyRegistryProps) {
  const relationshipEntries = Object.entries(RELATIONSHIP_LABELS as Record<string, string>);

  return (
    <section className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-4 space-y-3 shadow-inner overflow-hidden flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-tight">
          Proxy Registry
        </h2>
        <button
          onClick={() => {
            state.setNewContact({
              firstName: "",
              lastName: "",
              relationship: "Relative",
              phoneNumber: "",
              email: "",
            });
            state.setIsAddingProxy(true);
          }}
          className="px-3 py-1 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] text-[8px] font-black uppercase tracking-widest hover:bg-[var(--primary)] hover:text-black transition-all border border-[var(--primary)]/20 shadow-sm"
        >
          + Add Proxy
        </button>
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {state.isAddingProxy && (
          <div className="p-4 rounded-xl border border-[var(--primary)]/40 bg-[var(--primary)]/[0.04] space-y-3 animate-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-2 gap-2">
              <input
                className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                value={state.newContact.firstName || ""}
                onChange={(e) =>
                  state.setNewContact({
                    ...state.newContact,
                    firstName: e.target.value,
                  })
                }
                placeholder="First Name"
              />
              <input
                className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                value={state.newContact.lastName || ""}
                onChange={(e) =>
                  state.setNewContact({
                    ...state.newContact,
                    lastName: e.target.value,
                  })
                }
                placeholder="Last Name"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-2 px-2 text-[9px] font-bold text-[var(--text-primary)] uppercase outline-none focus:border-[var(--primary)]/50 [color-scheme:dark]"
                value={state.newContact.relationship || "Relative"}
                onChange={(e) =>
                  state.setNewContact({
                    ...state.newContact,
                    relationship: e.target.value,
                  })
                }
              >
                {relationshipEntries
                  .filter(([k]) => k !== "Self")
                  .map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.toUpperCase()}
                    </option>
                  ))}
              </select>
              <input
                className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
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
            <input
              className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
              value={state.newContact.email || ""}
              onChange={(e) =>
                state.setNewContact({
                  ...state.newContact,
                  email: e.target.value,
                })
              }
              placeholder="Email Address"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => state.setIsAddingProxy(false)}
                className="px-3 py-1.5 rounded-lg text-[8px] font-black uppercase text-[var(--text-muted)] hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={state.handleAddContact}
                className="px-5 py-1.5 rounded-lg bg-[var(--primary)] text-black text-[8px] font-black uppercase tracking-widest shadow-lg"
              >
                Commit Proxy
              </button>
            </div>
          </div>
        )}

        {state.relativeContacts.map((contact: any) => (
          <div key={contact.outreachContactId}>
            {state.editingContactId === contact.outreachContactId ? (
              <div className="p-4 rounded-xl border border-[var(--primary)]/40 bg-[var(--primary)]/[0.02] space-y-3 animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="bg-[var(--background)] border border-white/5 rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                    value={state.newContact.firstName || ""}
                    onChange={(e) =>
                      state.setNewContact({
                        ...state.newContact,
                        firstName: e.target.value,
                      })
                    }
                    placeholder="First Name"
                  />
                  <input
                    className="bg-[var(--background)] border border-white/5 rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                    value={state.newContact.lastName || ""}
                    onChange={(e) =>
                      state.setNewContact({
                        ...state.newContact,
                        lastName: e.target.value,
                      })
                    }
                    placeholder="Last Name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="bg-[var(--background)] border border-white/5 rounded-lg py-2 px-2 text-[9px] font-bold text-[var(--text-primary)] uppercase outline-none focus:border-[var(--primary)]/50 [color-scheme:dark]"
                    value={state.newContact.relationship || "Relative"}
                    onChange={(e) =>
                      state.setNewContact({
                        ...state.newContact,
                        relationship: e.target.value,
                      })
                    }
                  >
                    {relationshipEntries.map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <input
                    className="bg-[var(--background)] border border-white/5 rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
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
                <input
                  className="w-full bg-[var(--background)] border border-white/5 rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                  value={state.newContact.email || ""}
                  onChange={(e) =>
                    state.setNewContact({
                      ...state.newContact,
                      email: e.target.value,
                    })
                  }
                  placeholder="Email Address"
                />
                <div className="flex justify-end gap-2 pt-1">
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
              <div className="group relative flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[var(--primary)]/30 transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 font-black text-xs shadow-inner shrink-0">
                    {contact.firstName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-tight truncate">
                      {contact.firstName} {contact.lastName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[8px] font-black text-slate-400 tracking-tight shrink-0">
                        {formatPhoneNumber(contact.phoneNumber)}
                      </span>
                      {contact.email && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-white/10" />
                          <span className="text-[8px] font-bold text-slate-500 lowercase truncate">
                            {contact.email}
                          </span>
                        </>
                      )}
                      <span className="text-[6px] font-black text-[var(--primary)]/50 uppercase tracking-widest italic truncate opacity-70">
                        / {(RELATIONSHIP_LABELS as Record<string, string>)[contact.relationship] || contact.relationship}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1">
                    <button
                      onClick={() => state.startEditingContact(contact)}
                      className="p-1.5 rounded-lg bg-white/5 text-[var(--text-muted)] hover:text-[var(--primary)] transition-all shadow-sm"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => state.handleRemoveContact(contact.outreachContactId)}
                      className="p-1.5 rounded-lg bg-white/5 text-[var(--text-muted)] hover:text-rose-500 transition-all shadow-sm"
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
                    className="p-2 rounded-lg bg-white/5 text-slate-400 hover:bg-[var(--primary)] hover:text-black transition-all shadow-lg"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {state.relativeContacts.length === 0 && !state.isAddingProxy && (
          <div className="flex flex-col items-center justify-center py-4 opacity-20">
            <Users className="w-6 h-6 mb-1" />
            <p className="text-[7px] font-black uppercase tracking-widest">
              No Registered Proxies
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
