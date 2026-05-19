"use client";

import React from "react";
import {
  Database,
  Activity,
  Pill,
  ShieldAlert,
  AlertCircle,
  Search,
  ArrowRight
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ICD10_CODES } from "../constants/icd10";

interface ClinicalContextPanelProps {
  state: any; // ReturnType<typeof useNotesState>
}

export function ClinicalContextPanel({ state }: ClinicalContextPanelProps) {
  const {
    selectedNote,
    clinicalDetails,
    loadingDetails,
    isFinalized,
    insertVitals,
    insertMedications,
    insertAllergies,
    insertDiagnosis,
    icdSearch,
    setIcdSearch
  } = state;

  const noteFinalized = selectedNote?.status === 'FINISHED';

  return (
    <div className="w-[340px] shrink-0 flex flex-col gap-4 overflow-hidden h-full">
      <div className="bg-[var(--card-bg)] rounded-[2.5rem] border border-[var(--card-border)] p-6 flex flex-col gap-5 overflow-hidden h-full">
        <div>
          <h3 className="text-xs font-black uppercase tracking-tight flex items-center gap-2">
            <Database className="w-4 h-4 text-[var(--primary)]" />
            Clinical Context
          </h3>
          <p className="text-[8px] font-black text-[var(--text-muted)] tracking-widest uppercase mt-0.5">Reference Data & Imports</p>
        </div>

        {loadingDetails ? (
          <div className="flex-1 flex flex-col gap-4">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
            
             {/* Vital Signs Snapshot */}
            {(() => {
              const encounterWithVitals = clinicalDetails?.encountersByPatient?.find(
                (e: any) => e.vitalSigns && e.vitalSigns.length > 0
              );
              const v = encounterWithVitals?.vitalSigns?.[0];
              
              if (!v) {
                return (
                  <div className="p-4 rounded-2xl bg-[var(--input-bg)]/30 border border-dashed border-[var(--card-border)] text-center">
                    <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest block">No vital records found</span>
                  </div>
                );
              }
              
              return (
                <div className="p-4 rounded-2xl bg-[var(--input-bg)]/60 border border-[var(--card-border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-blue-500" />
                      Recent Vitals
                    </span>
                    {!noteFinalized && (
                      <button
                        onClick={() => insertVitals(v)}
                        className="text-[8px] font-black text-[var(--primary)] uppercase tracking-wider hover:underline"
                      >
                        Insert
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-[var(--text-secondary)]">
                    <div>HR: <span className="text-[var(--text-primary)] font-black">{v.heartRate || "--"} bpm</span></div>
                    <div>BP: <span className="text-[var(--text-primary)] font-black">{v.bloodPressureSystolic || "--"}/{v.bloodPressureDiastolic || "--"}</span></div>
                    <div>SpO2: <span className="text-emerald-500 font-black">{v.oxygenSaturation || "--"}%</span></div>
                    <div>Temp: <span className="text-[var(--text-primary)] font-black">{v.temperature || "--"} °F</span></div>
                  </div>
                </div>
              );
            })()}

            {/* Medications Registry */}
            <div className="p-4 rounded-2xl bg-[var(--input-bg)]/60 border border-[var(--card-border)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-amber-500" />
                  Active Meds
                </span>
                {!noteFinalized && clinicalDetails?.prescriptionsByPatient?.length > 0 && (
                  <button
                    onClick={() => insertMedications(clinicalDetails.prescriptionsByPatient)}
                    className="text-[8px] font-black text-[var(--primary)] uppercase tracking-wider hover:underline"
                  >
                    Insert All
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-24 overflow-y-auto scrollbar-hide">
                {clinicalDetails?.prescriptionsByPatient?.length > 0 ? (
                  clinicalDetails.prescriptionsByPatient.map((p: any) => (
                    <div key={p.prescriptionId} className="text-[9px] font-semibold text-[var(--text-secondary)] border-b border-[var(--card-border)]/40 pb-1.5 last:border-0 last:pb-0">
                      <span className="font-bold text-[var(--text-primary)] block">{p.medication?.name} {p.medication?.strength}</span>
                      <span>{p.dose} - {p.frequency}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-[8px] font-black text-[var(--text-muted)] uppercase block">No active prescriptions</span>
                )}
              </div>
            </div>

            {/* Allergy Registry */}
            <div className="p-4 rounded-2xl bg-[var(--input-bg)]/60 border border-[var(--card-border)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                  Allergies
                </span>
                {!noteFinalized && clinicalDetails?.allergiesByPatient?.length > 0 && (
                  <button
                    onClick={() => insertAllergies(clinicalDetails.allergiesByPatient)}
                    className="text-[8px] font-black text-[var(--primary)] uppercase tracking-wider hover:underline"
                  >
                    Insert All
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                {clinicalDetails?.allergiesByPatient?.length > 0 ? (
                  clinicalDetails.allergiesByPatient.map((a: any) => (
                    <div key={a.allergyId} className="flex justify-between items-center text-[9px] font-semibold">
                      <span className="font-bold text-[var(--text-primary)]">{a.allergen}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${a.severity === 'SEVERE' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                        {a.severity}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-[8px] font-black text-[var(--text-muted)] uppercase block">No documented allergies</span>
                )}
              </div>
            </div>

            {/* ICD-10 Diagnosis Search */}
            {!noteFinalized && (
              <div className="p-4 rounded-2xl bg-[var(--input-bg)]/60 border border-[var(--card-border)] space-y-3">
                <span className="text-[9px] font-black uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-indigo-400" />
                  ICD-10 Codification
                </span>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-muted)]" />
                  <input
                    value={icdSearch}
                    onChange={(e) => setIcdSearch(e.target.value)}
                    placeholder="Search ICD-10 codes..."
                    className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg py-1.5 pl-7 pr-2 text-[9px] font-bold placeholder:text-[var(--text-muted)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-hide">
                  {ICD10_CODES.filter(item => 
                    item.code.toLowerCase().includes(icdSearch.toLowerCase()) ||
                    item.desc.toLowerCase().includes(icdSearch.toLowerCase())
                  ).map(item => (
                    <div
                      key={item.code}
                      onClick={() => insertDiagnosis(item)}
                      className="p-2 bg-[var(--background)]/40 hover:bg-[var(--primary)]/10 rounded-lg cursor-pointer transition-all border border-transparent hover:border-[var(--primary)]/20 flex items-start gap-2 justify-between"
                    >
                      <div>
                        <span className="text-[9px] font-black text-[var(--primary)]">{item.code}</span>
                        <p className="text-[8px] font-semibold text-[var(--text-secondary)] leading-normal mt-0.5">{item.desc}</p>
                      </div>
                      <ArrowRight className="w-3 h-3 text-[var(--text-muted)] self-center" />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
