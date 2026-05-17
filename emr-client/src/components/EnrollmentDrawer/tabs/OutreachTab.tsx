"use client";

import React from "react";
import { EnrollmentState } from "../hooks/useEnrollmentState";
import { formatPhoneNumber } from "../utils";
import { RELATIONSHIP_LABELS } from "../types";
import {
  PhoneCall, PhoneOff, PhoneForwarded, Smartphone, ShieldCheck, X,
  Users, Pencil, Trash2, AlertCircle, ClipboardCheck, Calendar,
  Voicemail, Clock, UserX, Ban, UserMinus,
} from "lucide-react";
import { PermissionGate } from "../../PermissionGate";
import UnenrollModal from "../components/UnenrollModal";
import DispositionModal from "../components/DispositionModal";

interface Props { state: EnrollmentState; }

export default function OutreachTab({ state }: Props) {
  return (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      {/* Active Call HUD */}
                      {state.activeCall && (
                        <div className="bg-teal-600 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-teal-900/40 animate-pulse ring-1 ring-teal-400/50">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center text-white">
                              <PhoneForwarded className="w-5 h-5 animate-bounce" />
                            </div>
                            <div>
                              <p className="text-white font-black text-[10px] uppercase tracking-widest leading-none">
                                {state.activeCall.status}
                              </p>
                              <p className="text-teal-100 text-[11px] font-bold mt-1.5 opacity-80">
                                {state.activeCall.phone || state.activeCall.phoneNumber}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => state.setActiveCall(null)}
                            className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                          >
                            <PhoneOff className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* DEMOGRAPHIC IDENTITY HUD */}
                      <div className="bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--card-border)] space-y-3 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[var(--primary)] flex items-center justify-center text-black font-bold text-sm shadow-lg shadow-[var(--primary-glow)]">
                            {state.lead.firstName?.[0] || "?"}
                            {state.lead.lastName?.[0] || "?"}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">
                              {state.lead.firstName || "Unknown"}{" "}
                              {state.lead.lastName || "Patient"}
                            </h3>
                            <div className="flex items-center gap-3 mt-1.5">
                              <p className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-widest opacity-80">
                                {state.lead.referralSource || "Internal Lead"}
                              </p>
                              <span className="w-1 h-1 rounded-full bg-[var(--card-border)]" />
                              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                {state.patientDob
                                  ? `${new Date(state.patientDob).toLocaleDateString()} (${Math.floor((new Date().getTime() - new Date(state.patientDob).getTime()) / 31557600000)}Y)`
                                  : "DOB: --"}
                              </p>
                              {(state.patientSex || state.genderIdentity) && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-[var(--card-border)]" />
                                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                    {state.patientSex}
                                    {state.genderIdentity
                                      ? ` (${state.genderIdentity})`
                                      : ""}
                                  </p>
                                </>
                              )}
                              {state.patientLanguage && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-[var(--card-border)]" />
                                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                    {state.patientLanguage}
                                  </p>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              {state.lead.isDoNotCall && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                  <ShieldCheck className="w-2.5 h-2.5" /> Do Not
                                  Call
                                </span>
                              )}
                              {state.lead.isOptedOut && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                  <X className="w-2.5 h-2.5" /> Marketing
                                  Opt-Out
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border
                                    ${
                                      state.lead.status === "ENROLLED"
                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                                        : state.lead.status === "REFUSED" ||
                                            state.lead.status === "DO_NOT_CALL"
                                          ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                                          : "bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)]"
                                    }`}
                              >
                                Status: {state.lead.status?.replaceAll("_", " ")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* CALL SCRIPT HUD */}
                        <div className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl p-4 shadow-inner">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-[0.2em]">
                              Active Interaction Script
                            </p>
                            <select
                              className="bg-transparent border-none text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest outline-none cursor-pointer [color-scheme:dark]"
                              value={state.selectedScriptId || ""}
                              onChange={(e) =>
                                state.setSelectedScriptId(e.target.value)
                              }
                            >
                              {state.scripts.map((s: any) => (
                                <option
                                  key={s.outreachScriptId}
                                  value={s.outreachScriptId}
                                >
                                  {s.scriptTitle}
                                </option>
                              ))}
                            </select>
                          </div>
                          <p className="text-[11px] font-medium text-[var(--text-secondary)] leading-relaxed italic opacity-80">
                            {state.activeScript?.content
                              ? state.activeScript.content
                                  .replace("{firstName}", state.lead.firstName)
                                  .replace("{lastName}", state.lead.lastName)
                                  .replaceAll("deployment", "home visit")
                              : `"Hello ${state.lead.firstName}, I'm calling from Halkyone Health..."`}
                          </p>
                        </div>
                      </div>

                      {/* 1. IDENTITY HUB & PROXY REGISTRY (PORTED FROM PROFILE) */}
                      <div className="flex flex-col gap-4 shrink-0">
                        {/* Identity Hub: Self Identity */}
                        <section className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-4 space-y-3 shadow-inner relative group/registry">
                          <div className="flex items-center justify-between">
                            <h2 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-tight">
                              Identity Hub
                            </h2>
                            <button
                              onClick={() =>
                                state.setIsAddingRelative(!state.isAddingRelative)
                              }
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${state.isAddingRelative ? "bg-rose-500 text-white" : "bg-[var(--primary)] text-black hover:bg-[var(--primary)]/80"}`}
                            >
                              {state.isAddingRelative ? "Cancel" : "+ Add Channel"}
                            </button>
                          </div>

                          {state.isAddingRelative && (
                            <div className="bg-white/[0.02] border border-[var(--card-border)] rounded-xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] uppercase outline-none focus:border-[var(--primary)]/50"
                                  value={state.newContact.phoneNumber}
                                  onChange={(e) =>
                                    state.setNewContact({
                                      ...state.newContact,
                                      phoneNumber: formatPhoneNumber(
                                        e.target.value,
                                      ),
                                      firstName: state.lead.firstName,
                                      lastName: state.lead.lastName,
                                      relationship: "Self",
                                    })
                                  }
                                  placeholder="(XXX) XXX-XXXX"
                                />
                                <input
                                  className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] uppercase outline-none focus:border-[var(--primary)]/50"
                                  value={state.newContact.email}
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
                                    value={state.newContact.phoneNumber}
                                    onChange={(e) =>
                                      state.setNewContact({
                                        ...state.newContact,
                                        phoneNumber: formatPhoneNumber(
                                          e.target.value,
                                        ),
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
                                      {formatPhoneNumber(state.lead.primaryPhone) ||
                                        "NO PHONE"}
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
                                {state.editingContactId ===
                                contact.outreachContactId ? (
                                  <div className="p-3 rounded-lg border border-[var(--primary)]/40 bg-[var(--primary)]/[0.04] space-y-3 animate-in slide-in-from-top-2 duration-200">
                                    <div className="grid grid-cols-2 gap-2">
                                      <input
                                        className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                                        value={state.newContact.phoneNumber}
                                        onChange={(e) =>
                                          state.setNewContact({
                                            ...state.newContact,
                                            phoneNumber: formatPhoneNumber(
                                              e.target.value,
                                            ),
                                            firstName: state.lead.firstName,
                                            lastName: state.lead.lastName,
                                            relationship: "Self",
                                          })
                                        }
                                        placeholder="(XXX) XXX-XXXX"
                                      />
                                      <input
                                        className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                                        value={state.newContact.email}
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
                                        onClick={() =>
                                          state.setEditingContactId(null)
                                        }
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
                                          {formatPhoneNumber(
                                            contact.phoneNumber,
                                          )}
                                        </p>
                                        <span className="text-[6px] font-black text-[var(--text-muted)] uppercase mt-1 block tracking-widest">
                                          SECONDARY CONTACT
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1">
                                        <button
                                          onClick={() =>
                                            state.startEditingContact(contact)
                                          }
                                          className="p-1.5 rounded-lg bg-white/5 text-[var(--text-muted)] hover:text-[var(--primary)] transition-all"
                                        >
                                          <Pencil className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            state.handleRemoveContact(
                                              contact.outreachContactId,
                                            )
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

                        {/* Proxy Registry */}
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
                                    value={state.newContact.firstName}
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
                                    value={state.newContact.lastName}
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
                                    value={state.newContact.relationship}
                                    onChange={(e) =>
                                      state.setNewContact({
                                        ...state.newContact,
                                        relationship: e.target.value,
                                      })
                                    }
                                  >
                                    {Object.entries(RELATIONSHIP_LABELS)
                                      .filter(([k]) => k !== "Self")
                                      .map(([k, v]) => (
                                        <option key={k} value={k}>
                                          {v.toUpperCase()}
                                        </option>
                                      ))}
                                  </select>
                                  <input
                                    className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                                    value={state.newContact.phoneNumber}
                                    onChange={(e) =>
                                      state.setNewContact({
                                        ...state.newContact,
                                        phoneNumber: formatPhoneNumber(
                                          e.target.value,
                                        ),
                                      })
                                    }
                                    placeholder="(XXX) XXX-XXXX"
                                  />
                                </div>
                                <input
                                  className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                                  value={state.newContact.email}
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
                                {state.editingContactId ===
                                contact.outreachContactId ? (
                                  <div className="p-4 rounded-xl border border-[var(--primary)]/40 bg-[var(--primary)]/[0.02] space-y-3 animate-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-2 gap-2">
                                      <input
                                        className="bg-[var(--background)] border border-white/5 rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                                        value={state.newContact.firstName}
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
                                        value={state.newContact.lastName}
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
                                        value={state.newContact.relationship}
                                        onChange={(e) =>
                                          state.setNewContact({
                                            ...state.newContact,
                                            relationship: e.target.value,
                                          })
                                        }
                                      >
                                        {Object.entries(
                                          RELATIONSHIP_LABELS,
                                        ).map(([k, v]) => (
                                          <option key={k} value={k}>
                                            {v.toUpperCase()}
                                          </option>
                                        ))}
                                      </select>
                                      <input
                                        className="bg-[var(--background)] border border-white/5 rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                                        value={state.newContact.phoneNumber}
                                        onChange={(e) =>
                                          state.setNewContact({
                                            ...state.newContact,
                                            phoneNumber: formatPhoneNumber(
                                              e.target.value,
                                            ),
                                          })
                                        }
                                        placeholder="(XXX) XXX-XXXX"
                                      />
                                    </div>
                                    <input
                                      className="w-full bg-[var(--background)] border border-white/5 rounded-lg py-2 px-3 text-[9px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                                      value={state.newContact.email}
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
                                        onClick={() =>
                                          state.setEditingContactId(null)
                                        }
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
                                            {formatPhoneNumber(
                                              contact.phoneNumber,
                                            )}
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
                                            /{" "}
                                            {RELATIONSHIP_LABELS[
                                              contact.relationship
                                            ] || contact.relationship}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1">
                                        <button
                                          onClick={() =>
                                            state.startEditingContact(contact)
                                          }
                                          className="p-1.5 rounded-lg bg-white/5 text-[var(--text-muted)] hover:text-[var(--primary)] transition-all shadow-sm"
                                        >
                                          <Pencil className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            state.handleRemoveContact(
                                              contact.outreachContactId,
                                            )
                                          }
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
                            {state.relativeContacts.length === 0 &&
                              !state.isAddingProxy && (
                                <div className="flex flex-col items-center justify-center py-4 opacity-20">
                                  <Users className="w-6 h-6 mb-1" />
                                  <p className="text-[7px] font-black uppercase tracking-widest">
                                    No Registered Proxies
                                  </p>
                                </div>
                              )}
                          </div>
                        </section>
                      </div>

                      {/* MISSION RESULT SECTION - STICKY FOOTER ACTION */}
                      <div className="sticky bottom-0 z-20 -mx-5 -mb-5 p-5 mt-auto bg-gradient-to-t from-[var(--sidebar-bg)] via-[var(--sidebar-bg)] to-transparent border-t border-[var(--card-border)] backdrop-blur-md space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
                            Quick Disposition Action
                          </p>
                          <div className="flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-teal-500/50" />
                            <div className="w-1 h-1 rounded-full bg-teal-500/30" />
                            <div className="w-1 h-1 rounded-full bg-teal-500/10" />
                          </div>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          {[
                            {
                              id: "CONNECTED",
                              label: "Connected",
                              icon: <PhoneCall className="w-3 h-3" />,
                              c: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-black hover:border-transparent hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]",
                            },
                            {
                              id: "NO_ANSWER",
                              label: "No Answer",
                              icon: <PhoneOff className="w-3 h-3" />,
                              c: "bg-amber-500/5 border-amber-500/20 text-amber-500/80 hover:bg-amber-500 hover:text-black hover:border-transparent hover:shadow-[0_0_15px_rgba(245,158,11,0.25)]",
                            },
                            {
                              id: "VOICEMAIL",
                              label: "Voicemail",
                              icon: <Voicemail className="w-3 h-3" />,
                              c: "bg-indigo-500/5 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-black hover:border-transparent hover:shadow-[0_0_15px_rgba(99,102,241,0.25)]",
                            },
                            {
                              id: "BUSY",
                              label: "Busy",
                              icon: <Clock className="w-3 h-3" />,
                              c: "bg-sky-500/5 border-sky-500/20 text-sky-400 hover:bg-sky-500 hover:text-black hover:border-transparent hover:shadow-[0_0_15px_rgba(14,165,233,0.25)]",
                            },
                            {
                              id: "WRONG_NUMBER",
                              label: "Wrong #",
                              icon: <UserX className="w-3 h-3" />,
                              c: "bg-rose-500/5 border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-black hover:border-transparent hover:shadow-[0_0_15px_rgba(244,63,94,0.25)]",
                            },
                            {
                              id: "DISCONNECTED",
                              label: "Disconnect",
                              icon: <PhoneOff className="w-3 h-3" />,
                              c: "bg-zinc-500/5 border-zinc-500/20 text-zinc-400 hover:bg-zinc-600 hover:text-white hover:border-transparent hover:shadow-[0_0_15px_rgba(113,113,122,0.25)]",
                            },
                            {
                              id: "DNC",
                              label: "DNC",
                              icon: <Ban className="w-3 h-3" />,
                              c: "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white hover:border-transparent hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]",
                            },
                            {
                              id: "OPT_OUT",
                              label: "Opt Out",
                              icon: <UserMinus className="w-3 h-3" />,
                              c: "bg-rose-950/20 border-rose-800/30 text-rose-400 hover:bg-rose-600 hover:text-white hover:border-transparent hover:shadow-[0_0_15px_rgba(225,29,72,0.3)]",
                            },
                            {
                              id: "CALL_BACK",
                              label: "Recall",
                              icon: <PhoneForwarded className="w-3 h-3" />,
                              c: "bg-cyan-500/5 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-black hover:border-transparent hover:shadow-[0_0_15px_rgba(6,182,212,0.25)]",
                            },
                          ].map((btn) => (
                            <button
                              key={btn.id}
                              onClick={() => state.handleLogActivity(btn.id)}
                              className={`h-8 rounded-full bg-[var(--input-bg)] border border-[var(--card-border)] text-[8px] font-black text-[var(--text-muted)] uppercase tracking-wider transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 px-3.5 shadow-inner hover:scale-[1.02] ${btn.c}`}
                            >
                              {btn.icon}
                              <span>{btn.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* UNENROLL REASON MODAL */}
                      {state.showUnenrollModal && (
                        <div className="fixed inset-0 z-[99999999] flex items-center justify-center p-4">
                          <div
                            className="absolute inset-0 bg-black/70 backdrop-blur-md"
                            onClick={() => state.setShowUnenrollModal(false)}
                          />
                          <div className="relative w-full max-w-md bg-[var(--sidebar-bg)] border border-rose-500/30 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
                                  <AlertCircle className="w-5 h-5" />
                                </div>
                                <div>
                                  <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">
                                    Reverse Enrollment
                                  </h3>
                                  <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest opacity-60">
                                    High-Authority Action
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => state.setShowUnenrollModal(false)}
                                className="text-[var(--text-muted)] hover:text-rose-500"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>

                            <div className="space-y-6">
                              <p className="text-[10px] font-medium text-[var(--text-secondary)] leading-relaxed">
                                You are about to deactivate this clinical record
                                and return the patient to lead status. Please
                                provide a forensic reason for this reversal.
                              </p>

                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                  Reversal Reason / Notes
                                </label>
                                <textarea
                                  value={state.logNotes}
                                  onChange={(e) => state.setLogNotes(e.target.value)}
                                  placeholder="e.g., Admitted in error, duplicate record, or patient request..."
                                  rows={4}
                                  className="w-full bg-[var(--input-bg)] border border-rose-500/20 rounded-2xl px-4 py-3 text-[11px] font-bold text-[var(--text-primary)] outline-none focus:border-rose-500/50 resize-none shadow-inner"
                                />
                              </div>

                              <div className="flex gap-3 pt-2">
                                <button
                                  onClick={() => state.setShowUnenrollModal(false)}
                                  className="flex-1 h-12 rounded-xl bg-white/5 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                >
                                  Abort
                                </button>
                                <PermissionGate permission="patients:enrollment">
                                  <button
                                    onClick={state.confirmUnenroll}
                                    disabled={!state.logNotes}
                                    className="flex-[2] h-12 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_25px_rgba(239,68,68,0.4)] transition-all active:scale-95 disabled:opacity-20"
                                  >
                                    Commit Reversal
                                  </button>
                                </PermissionGate>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {state.showDispositionModal && (
                        <div className="fixed inset-0 z-[99999999] flex items-center justify-center p-4">
                          <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            onClick={() => state.setShowDispositionModal(false)}
                          />
                          <div className="relative w-full max-w-md bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/20">
                                  <ClipboardCheck className="w-5 h-5" />
                                </div>
                                <div>
                                  <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">
                                    Capture Disposition
                                  </h3>
                                  <p className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-widest opacity-60">
                                    Status: {state.pendingOutcome}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => state.setShowDispositionModal(false)}
                                className="text-[var(--text-muted)] hover:text-rose-500"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>

                            <div className="space-y-6">
                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                  Interaction Notes / Reason
                                </label>
                                <textarea
                                  value={state.logNotes}
                                  onChange={(e) => state.setLogNotes(e.target.value)}
                                  placeholder="Provide clinical context or specific outcome reason..."
                                  rows={4}
                                  className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl px-4 py-3 text-[11px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 resize-none shadow-inner"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                  Next Follow-Up Plan
                                </label>
                                <div className="relative">
                                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--primary)] opacity-40" />
                                  <input
                                    type="date"
                                    value={state.followUpDate}
                                    onChange={(e) =>
                                      state.setFollowUpDate(e.target.value)
                                    }
                                    className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl pl-11 pr-4 py-3 text-[11px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 [color-scheme:dark]"
                                  />
                                </div>
                              </div>

                              <div className="flex gap-3 pt-2">
                                <button
                                  onClick={() => state.setShowDispositionModal(false)}
                                  className="flex-1 h-12 rounded-xl bg-white/5 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                >
                                  Abort
                                </button>
                                <PermissionGate permission="outreach:manage">
                                  <button
                                    onClick={state.confirmLogActivity}
                                    className="flex-[2] h-12 rounded-xl bg-[var(--primary)] text-black text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_25px_rgba(var(--primary-rgb),0.4)] transition-all active:scale-95"
                                  >
                                    Commit Disposition
                                  </button>
                                </PermissionGate>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
  );
}
