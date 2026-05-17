"use client";

import React from "react";
import { EnrollmentState } from "../hooks/useEnrollmentState";
import { formatPhoneNumber } from "../utils";
import { RELATIONSHIP_LABELS } from "../types";
import {
  FolderLock, ShieldCheck, Scale, Heart, FileSignature,
  CheckCircle2, Shield, Fingerprint, FileCheck, MessageSquare,
} from "lucide-react";
import { PermissionGate } from "../../PermissionGate";

interface Props { state: EnrollmentState; }

export default function LegalTab({ state }: Props) {
  return (
                    <div className="space-y-8 animate-in slide-in-from-right duration-300">
                      {/* LEGAL DOCUMENT VAULT */}
                      <section className="space-y-5">
                        <div className="flex items-center gap-3">
                          <FolderLock className="w-4 h-4 text-[var(--primary)]" />
                          <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">
                            Legal Document Vault
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            {
                              id: "hipaa",
                              label: "HIPAA Notice",
                              sub: "Privacy practices tagged",
                              state: state.consentHIPAA,
                              set: state.setConsentHIPAA,
                              icon: <ShieldCheck className="w-4 h-4" />,
                            },
                            {
                              id: "poa",
                              label: "Power of Attorney",
                              sub: "Legal representative verified",
                              state: state.legalDocs.poa,
                              set: (v: boolean) =>
                                state.setLegalDocs((p) => ({ ...p, poa: v })),
                              icon: <Scale className="w-4 h-4" />,
                            },
                            {
                              id: "treat",
                              label: "Consent to Treat",
                              sub: "Clinical authorization tagged",
                              state: state.consentTreat,
                              set: state.setConsentTreat,
                              icon: <Heart className="w-4 h-4" />,
                            },
                            {
                              id: "adv",
                              label: "Advance Directive",
                              sub: "Living will / Proxy verified",
                              state: state.legalDocs.advanceDirective,
                              set: (v: boolean) =>
                                state.setLegalDocs((p) => ({
                                  ...p,
                                  advanceDirective: v,
                                })),
                              icon: <FileSignature className="w-4 h-4" />,
                            },
                          ].map((c) => (
                            <button
                              key={c.id}
                              onClick={() => c.set(!c.state)}
                              className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 group relative overflow-hidden
                              ${c.state ? "bg-teal-500/10 border-teal-500/30 shadow-[0_0_20px_rgba(20,184,166,0.1)]" : "bg-[var(--input-bg)] border-[var(--card-border)] opacity-60 hover:opacity-100"}`}
                            >
                              <div className="flex items-center justify-between">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                                  ${c.state ? "bg-teal-500 text-black" : "bg-[var(--card-bg)] text-[var(--text-muted)]"}`}
                                >
                                  {c.icon}
                                </div>
                                {c.state && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                                )}
                              </div>
                              <div className="text-left">
                                <p
                                  className={`text-[10px] font-black uppercase tracking-widest ${c.state ? "text-teal-500" : "text-[var(--text-primary)]"}`}
                                >
                                  {c.label}
                                </p>
                                <p className="text-[8px] font-bold text-[var(--text-muted)] mt-0.5 uppercase tracking-tight">
                                  {c.sub}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>

                        {/* DIGITAL CONSENT SEAL */}
                        <div className="mt-8 bg-gradient-to-br from-teal-500/5 to-transparent border border-teal-500/20 rounded-3xl p-8 relative overflow-hidden group/seal">
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/seal:opacity-30 transition-opacity">
                            <Fingerprint className="w-24 h-24 text-teal-500" />
                          </div>

                          <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-500 border border-teal-500/20">
                                <Shield className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">
                                  Digital Consent Handshake
                                </h4>
                                <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tight mt-1 opacity-60">
                                  Authorize clinical data ingestion and
                                  treatment protocol.
                                </p>
                              </div>
                            </div>

                            {state.isConsentSealed ? (
                              <div className="bg-teal-500 rounded-2xl p-5 flex items-center justify-between shadow-xl shadow-teal-500/20 animate-in zoom-in duration-500">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center text-white">
                                    <FileCheck className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="text-black font-black text-[10px] uppercase tracking-widest">
                                      Seal Established
                                    </p>
                                    <p className="text-teal-900 text-[8px] font-bold uppercase tracking-tight mt-0.5 opacity-70">
                                      Token: {state.consentToken}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-black font-black text-[10px] uppercase tracking-tight">
                                    {state.consentTimestamp}
                                  </p>
                                  <p className="text-teal-900 text-[8px] font-bold uppercase tracking-widest mt-0.5">
                                    Verified
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <PermissionGate permission="patients:enrollment">
                                <button
                                  onClick={() => {
                                    state.setIsConsentSealed(true);
                                    state.setConsentTimestamp(
                                      new Date().toLocaleString(),
                                    );
                                    state.setConsentToken(
                                      `HAL-${Math.random().toString(36).substring(7).toUpperCase()}`,
                                    );
                                    state.setConsentTreat(true);
                                    state.setConsentHIPAA(true);
                                    state.showToast(
                                      "Clinical Consent Seal Established",
                                      "success",
                                    );
                                  }}
                                  className="w-full h-16 rounded-2xl bg-[var(--sidebar-bg)] border border-teal-500/30 text-teal-500 font-black text-[11px] uppercase tracking-[0.4em] hover:bg-teal-500/10 transition-all flex items-center justify-center gap-4 group/btn shadow-inner"
                                >
                                  <Fingerprint className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                  Establish Digital Seal
                                </button>
                              </PermissionGate>
                            )}

                            <p className="text-[8px] font-medium text-[var(--text-muted)] leading-relaxed italic opacity-40 px-2">
                              By establishing this seal, the practitioner
                              verifies that verbal or written consent has been
                              obtained from the patient or legal representative
                              according to clinical protocol HAL-PR-01.
                            </p>
                          </div>
                        </div>
                      </section>

                      {/* COMMUNICATION PREFERENCES */}
                      <section className="space-y-5">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="w-4 h-4 text-[var(--primary)]" />
                          <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">
                            Communication Modality
                          </h3>
                        </div>
                        <div className="bg-[var(--input-bg)] rounded-2xl p-5 border border-[var(--card-border)] space-y-5 shadow-inner">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                Preferred Method
                              </label>
                              <select
                                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-[10px] font-bold text-[var(--text-primary)] [color-scheme:dark]"
                                value={state.preferredContact}
                                onChange={(e) =>
                                  state.setPreferredContact(e.target.value)
                                }
                              >
                                <option value="PHONE">TELEPHONE</option>
                                <option value="SMS">SMS / TEXT</option>
                                <option value="EMAIL">ELECTRONIC MAIL</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                                Language Modality
                              </label>
                              <button
                                onClick={() =>
                                  state.setInterpreterRequired(!state.interpreterRequired)
                                }
                                className={`w-full h-[41px] rounded-xl flex items-center justify-center border text-[9px] font-black uppercase tracking-widest transition-all
                                ${state.interpreterRequired ? "bg-rose-500/10 border-rose-500 text-rose-500" : "bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)]"}`}
                              >
                                {state.interpreterRequired
                                  ? "INTERPRETER REQUIRED"
                                  : "NO INTERPRETER"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
  );
}
