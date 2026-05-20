"use client";

import React from "react";
import { EnrollmentState } from "../hooks/useEnrollmentState";
import { formatPhoneNumber } from "../utils";
import { RELATIONSHIP_LABELS } from "../types";
import { BiologicalSex, CommunicationAbility } from "@/types/enums";
import {
  User,
  MapPin,
  CreditCard,
  Calendar,
  Briefcase,
  Stethoscope,
  Fingerprint,
  Edit3,
  CheckCircle2,
  ChevronRight,
  Building2,
} from "lucide-react";
import { PermissionGate } from "../../PermissionGate";
import CustomDatePicker from "../../CustomDatePicker";

interface Props {
  state: EnrollmentState;
}

export default function AdminTab({ state }: Props) {
  const [referralReceiptDate, setReferralReceiptDate] = React.useState("");
  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-300">
      {/* Patient Demographics */}
      {/* DEMOGRAPHICS SECTION - ALWAYS EDITABLE IN ENROLLMENT */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <User className="w-4 h-4 text-[var(--primary)]" />
          <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">
            Patient Demographics
          </h3>
        </div>
        <div className="bg-[var(--input-bg)] rounded-2xl p-5 border border-[var(--card-border)] space-y-5 shadow-inner">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                Date of Birth
              </label>
              <CustomDatePicker
                value={state.patientDob}
                onChange={(val) => state.setPatientDob(val)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                Biological Sex
              </label>
              <select
                value={state.patientSex}
                onChange={(e) =>
                  state.setPatientSex(e.target.value as BiologicalSex)
                }
                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 appearance-none [color-scheme:dark]"
              >
                <option value="">Select...</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
                <option value="UNKNOWN">Unknown</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                Gender Identity
              </label>
              <input
                type="text"
                value={state.genderIdentity}
                onChange={(e) => state.setGenderIdentity(e.target.value)}
                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                placeholder="Identity..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                Primary Language
              </label>
              <input
                type="text"
                value={state.patientLanguage}
                onChange={(e) => state.setPatientLanguage(e.target.value)}
                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                placeholder="Language..."
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
              Clinical Facility / Location
            </label>
            <div className="relative group/facility">
              <Building2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within/facility:text-[var(--primary)] transition-colors" />
              <select
                value={state.selectedFacilityId}
                onChange={(e) => state.setSelectedFacilityId(e.target.value)}
                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-10 pr-4 text-[11px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/40 transition-all appearance-none [color-scheme:dark]"
              >
                <option value="">PRIVATE RESIDENCE / HOME CARE</option>
                {(state.enrollmentData?.facilities || []).map((f: any) => (
                  <option key={f.facilityId} value={f.facilityId}>
                    {f.name} ({f.type})
                  </option>
                ))}
              </select>
              <ChevronRight className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] rotate-90 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
              Marital / Civil Status
            </label>
            <select
              value={state.civilStatus}
              onChange={(e) => state.setCivilStatus(e.target.value)}
              className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 appearance-none [color-scheme:dark]"
            >
              <option value="">Select...</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
              <option value="Common Law">Common Law</option>
            </select>
          </div>
        </div>
      </section>
      {/* Address Management HUD */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <MapPin className="w-4 h-4 text-[var(--primary)]" />
          <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">
            Deployment Destination
          </h3>
        </div>
        <div className="bg-[var(--input-bg)] rounded-2xl p-5 border border-[var(--card-border)] space-y-5 shadow-inner relative group/address">
          {!state.isEditingAddress ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-wider">
                    {state.address.street || "NO STREET SPECIFIED"}
                  </p>
                  <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    {state.address.city}, {state.address.state}{" "}
                    {state.address.postalCode}
                  </p>
                </div>
                <button
                  onClick={() => state.setIsEditingAddress(true)}
                  className="p-2 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--primary)] opacity-0 group-hover/address:opacity-100 transition-all"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
              <button
                onClick={state.handleVerifyAddress}
                className="w-full h-10 bg-transparent border border-[var(--primary)]/30 text-[var(--primary)] font-black text-[9px] uppercase tracking-[0.2em] rounded-xl hover:bg-[var(--primary)]/5 transition-all"
              >
                {state.isVerifyingAddress
                  ? "SCRUBBING GEODATA..."
                  : "Verify & Standardize Address"}
              </button>
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="space-y-1.5">
                <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={state.address.street}
                  onChange={(e) =>
                    state.setAddress({
                      ...state.address,
                      street: e.target.value,
                    })
                  }
                  className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-xl px-4 py-2.5 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                  placeholder="Street..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                    City / Region
                  </label>
                  <input
                    type="text"
                    value={state.address.city}
                    onChange={(e) =>
                      state.setAddress({
                        ...state.address,
                        city: e.target.value,
                      })
                    }
                    className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                    placeholder="City..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={state.address.postalCode}
                    onChange={(e) =>
                      state.setAddress({
                        ...state.address,
                        postalCode: e.target.value,
                      })
                    }
                    className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-xl px-4 py-2 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                    placeholder="Zip..."
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => state.setIsEditingAddress(false)}
                  className="flex-1 h-9 bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] font-bold text-[9px] uppercase tracking-widest rounded-xl"
                >
                  Discard
                </button>
                <button
                  onClick={() => state.setIsEditingAddress(false)}
                  className="flex-1 h-9 bg-teal-500 text-black font-bold text-[9px] uppercase tracking-widest rounded-xl"
                >
                  Commit Change
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Insurance Vault */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <CreditCard className="w-4 h-4 text-[var(--primary)]" />
          <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">
            Financial Coverage Vault
          </h3>
        </div>
        <div className="bg-[var(--input-bg)] rounded-2xl p-5 border border-[var(--card-border)] space-y-5 shadow-inner">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                Health Plan Assignment
              </label>
              <select
                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 [color-scheme:dark]"
                value={state.selectedPlan}
                onChange={(e) => state.setSelectedPlan(e.target.value)}
              >
                <option value="">Select Plan...</option>
                {state.enrollmentData?.healthPlans?.map((p: any) => (
                  <option key={p.healthPlanId} value={p.healthPlanId}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                Eligibility Status
              </label>
              <div
                className={`w-full h-[41px] rounded-xl flex items-center justify-center border text-[9px] font-black uppercase tracking-widest
                                    ${state.eligibilityStatus === "VERIFIED" ? "bg-teal-500/10 border-teal-500/30 text-teal-500" : "bg-amber-500/10 border-amber-500/30 text-amber-500"}`}
              >
                {state.eligibilityStatus}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                Member ID
              </label>
              <input
                type="text"
                value={state.memberId}
                onChange={(e) => state.setMemberId(e.target.value)}
                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                placeholder="ID..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                Next Follow-Up (Due Date)
              </label>
              <CustomDatePicker
                value={state.followUpDate}
                onChange={(val) => state.setFollowUpDate(val)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                Communication Status
              </label>
              <select
                value={state.communicationStatus}
                onChange={(e) =>
                  state.setCommunicationStatus(
                    e.target.value as CommunicationAbility,
                  )
                }
                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 appearance-none"
              >
                <option value="Verbal">Verbal</option>
                <option value="NonVerbal">Non-Verbal</option>
                <option value="Aphasic">Aphasic</option>
                <option value="SpeechImpaired">Speech Impaired</option>
                <option value="CognitiveImpairment">
                  Cognitive Impairment
                </option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                Group Number
              </label>

              <input
                type="text"
                value={state.groupId}
                onChange={(e) => state.setGroupId(e.target.value)}
                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-[10px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50"
                placeholder="GROUP..."
              />
            </div>
          </div>
          <PermissionGate permission="patients:enrollment">
            <button
              onClick={state.verifyInsurance}
              disabled={
                state.isVerifyingInsurance ||
                state.eligibilityStatus === "VERIFIED"
              }
              className={`w-full h-11 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] shadow-lg transition-all flex items-center justify-center gap-2
                                ${state.eligibilityStatus === "VERIFIED" ? "bg-teal-500/10 border border-teal-500/30 text-teal-500 cursor-default" : "bg-[var(--primary)] text-black hover:scale-[1.01] active:scale-[0.98]"}`}
            >
              {state.isVerifyingInsurance ? (
                <>
                  <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  Pinging Payer Gateway...
                </>
              ) : state.eligibilityStatus === "VERIFIED" ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified: {state.insuranceRef}
                </>
              ) : (
                "Verify Eligibility Status"
              )}
            </button>
          </PermissionGate>
        </div>
      </section>

      {/* Referral HUD */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <Briefcase className="w-4 h-4 text-[var(--primary)]" />
          <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">
            Referral source details
          </h3>
        </div>
        <div className="bg-[var(--input-bg)] rounded-2xl p-6 border border-[var(--card-border)] space-y-6 shadow-inner">
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
              Referring Physician / Facility
            </label>
            <div className="relative group/doc">
              <Stethoscope className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within/doc:text-[var(--primary)] transition-colors" />
              <input
                type="text"
                value={state.referringPhysician}
                onChange={(e) => state.setReferringPhysician(e.target.value)}
                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] premium-input rounded-xl py-3.5 pl-11 pr-4 text-[11px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 transition-all"
                placeholder="ENTER PRACTITIONER NAME..."
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                NPI Number (Registry ID)
              </label>
              <div className="relative group/npi">
                <Fingerprint className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within/npi:text-[var(--primary)] transition-colors" />
                <input
                  type="text"
                  value={state.npi}
                  onChange={(e) => state.setNpi(e.target.value)}
                  className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl py-3.5 pl-11 pr-4 text-[11px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 transition-all"
                  placeholder="10-DIGIT IDENTIFIER..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest ml-1">
                Referral Receipt Date
              </label>
              <CustomDatePicker
                value={referralReceiptDate}
                onChange={setReferralReceiptDate}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
