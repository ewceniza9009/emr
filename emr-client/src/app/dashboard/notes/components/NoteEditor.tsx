"use client";

import React from "react";
import {
  FileText,
  Lock,
  Download,
  Loader2,
  Save,
  CheckCircle2,
  User,
  Edit3,
} from "lucide-react";
import { PermissionGate } from "@/components/PermissionGate";

interface NoteEditorProps {
  state: any; // ReturnType<typeof useNotesState>
}

export function NoteEditor({ state }: NoteEditorProps) {
  const {
    selectedNote,
    isSyncing,
    lastSaved,
    noteFormat,
    setNoteFormat,
    narrative,
    soapSubjective,
    soapObjective,
    soapAssessment,
    soapPlan,
    activeField,
    setActiveField,
    handleTextChange,
    handleKeyDown,
    handleSave,
    handleDownload,
    showSmartPhrases,
    setShowSmartPhrases,
    phraseFilter,
    selectedIndex,
    setSelectedIndex,
    popupPosition,
    selectPhrase,
    smartPhrases,
    refs,
  } = state;

  const isFinalized = selectedNote?.status === "FINISHED";

  const renderPopup = () => (
    <div
      style={{ top: `${popupPosition.top}px`, left: `${popupPosition.left}px` }}
      className="absolute w-80 bg-[var(--card-bg)] border border-[var(--primary)]/30 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200 backdrop-blur-xl"
    >
      <div className="p-4 border-b border-[var(--card-border)] bg-[var(--primary)]/5 flex items-center justify-between">
        <p className="text-[9px] font-black text-[var(--primary)] uppercase tracking-[0.2em]">
          Halkyone Smart Phrases
        </p>
        <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase">
          ESC to close
        </span>
      </div>
      <div className="relative max-h-60 overflow-y-auto custom-scrollbar">
        {smartPhrases
          .filter((p: any) => p.shortcut.toLowerCase().includes(phraseFilter))
          .map((p: any, idx: number) => (
            <div
              key={p.shortcut}
              onClick={() => selectPhrase(p.templateText)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`p-4 cursor-pointer border-b border-[var(--card-border)] last:border-0 group transition-all flex flex-col ${
                idx === selectedIndex
                  ? "bg-[var(--primary)]/20 border-l-4 border-l-[var(--primary)]"
                  : "hover:bg-[var(--primary)]/10"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[10px] font-black uppercase ${idx === selectedIndex ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}
                >
                  {p.shortcut}
                </span>
              </div>
              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                {p.label}
              </p>
            </div>
          ))}
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
      <div className="bg-[var(--card-bg)] rounded-[2.5rem] border border-[var(--card-border)] p-8 flex flex-col gap-6 h-full relative overflow-hidden">
        {/* Header Details */}
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-[var(--primary)]" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase flex items-center gap-3">
                {selectedNote.patient?.firstName}{" "}
                {selectedNote.patient?.lastName}
                {isFinalized && <Lock className="w-4.5 h-4.5 text-rose-500" />}
              </h1>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[9px] font-black text-[var(--text-muted)] tracking-widest uppercase">
                  MRN: {selectedNote.patient?.mrn}
                </span>
              </div>
            </div>
          </div>

          {/* Format Toggle & Action Bar */}
          <div className="flex items-center gap-3">
            {!isFinalized && (
              <div className="flex items-center bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl p-1 mr-2">
                <button
                  onClick={() => setNoteFormat("soap")}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${noteFormat === "soap" ? "bg-[var(--primary)] text-white shadow-md" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
                >
                  SOAP
                </button>
                <button
                  onClick={() => setNoteFormat("narrative")}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${noteFormat === "narrative" ? "bg-[var(--primary)] text-white shadow-md" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
                >
                  Narrative
                </button>
              </div>
            )}

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--card-border)] text-[9px] font-black uppercase tracking-widest hover:bg-[var(--primary)]/5 hover:border-[var(--primary)]/30 transition-all group"
            >
              <Download className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--primary)]" />
              <span className="text-[var(--text-muted)] group-hover:text-[var(--primary)]">
                PDF
              </span>
            </button>

            {!isFinalized && (
              <>
                <PermissionGate permission="docs:edit">
                  <button
                    disabled={isSyncing}
                    onClick={() => handleSave(false)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--card-border)] text-[9px] font-black uppercase tracking-widest hover:bg-[var(--primary-glow)] transition-all disabled:opacity-50"
                  >
                    {isSyncing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>{isSyncing ? "Syncing..." : "Draft"}</span>
                  </button>
                </PermissionGate>
                <PermissionGate permission="docs:sign">
                  <button
                    disabled={isSyncing}
                    onClick={() => handleSave(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-[9px] font-black uppercase tracking-widest shadow-xl shadow-[var(--primary-glow)] hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Sign & Lock</span>
                  </button>
                </PermissionGate>
              </>
            )}
          </div>
        </div>

        {/* Note Layout Form Fields */}
        <div className="flex-1 flex flex-col min-h-0 gap-6">
          {/* Meta details */}
          <div className="grid grid-cols-2 gap-6 pb-2 border-b border-[var(--card-border)]/40 shrink-0">
            <div>
              <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-wider">
                Attending Clinician
              </span>
              <p className="text-[11px] font-bold uppercase text-[var(--text-primary)] mt-1 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-[var(--primary)]" />
                {selectedNote.practitioner?.firstName}{" "}
                {selectedNote.practitioner?.lastName}
              </p>
            </div>
            <div>
              <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-wider">
                Status & Phase
              </span>
              <p className="text-[11px] font-bold uppercase text-[var(--text-primary)] mt-1 flex items-center gap-2">
                <Edit3 className="w-3.5 h-3.5 text-[var(--primary)]" />
                {isFinalized ? "Finalized & Closed" : "Open for Edit"}
              </p>
            </div>
          </div>

          {isFinalized && (
            <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20 flex flex-col gap-2 items-center text-center justify-center animate-in fade-in duration-500 shrink-0">
              <Lock className="w-8 h-8 text-rose-500" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-500">
                  Document Finalized & Signed
                </h4>
                <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase mt-1">
                  Signed digitally by {selectedNote.practitioner?.firstName}{" "}
                  {selectedNote.practitioner?.lastName} on{" "}
                  {new Date().toLocaleDateString()}
                </p>
                <p className="text-[8px] text-slate-500 font-mono mt-1">
                  TRANSACTION ID: 0x9f32e9124adff233b8a92019ff29339e
                </p>
              </div>
            </div>
          )}

          {/* Narrative Mode */}
          {noteFormat === "narrative" ? (
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between shrink-0">
                <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                  Clinical Narrative
                </label>
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Interactive Session
                </span>
              </div>
              <div className="relative flex-1 min-h-0">
                <textarea
                  ref={refs.narrativeRef}
                  disabled={isFinalized}
                  value={narrative}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setActiveField("narrative")}
                  placeholder={`Begin typing clinical narrative for ${selectedNote.patient?.firstName}... use / for smart phrases.`}
                  className="w-full h-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-[2rem] p-8 text-xs leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--primary)]/50 focus:shadow-[0_0_20px_var(--primary-glow)] transition-all resize-none overflow-y-auto custom-scrollbar"
                />
                {showSmartPhrases &&
                  activeField === "narrative" &&
                  renderPopup()}
              </div>
            </div>
          ) : (
            // SOAP Note Mode
            <div className="space-y-5 flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
              {/* Subjective */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-[var(--text-primary)] uppercase tracking-widest ml-1 flex justify-between">
                  <span>Subjective (S)</span>
                  <span className="text-[8px] text-[var(--text-muted)] font-normal uppercase">
                    Symptom profile & history
                  </span>
                </label>
                <div className="relative">
                  <textarea
                    ref={refs.subjectiveRef}
                    disabled={isFinalized}
                    value={soapSubjective}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setActiveField("subjective")}
                    placeholder="Describe patient complaints, pain timeline, history..."
                    className="w-full min-h-[110px] bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl p-4 text-xs leading-relaxed outline-none focus:border-[var(--primary)]/40 transition-all resize-none"
                  />
                  {showSmartPhrases &&
                    activeField === "subjective" &&
                    renderPopup()}
                </div>
              </div>

              {/* Objective */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-[var(--text-primary)] uppercase tracking-widest ml-1 flex justify-between">
                  <span>Objective (O)</span>
                  <span className="text-[8px] text-[var(--text-muted)] font-normal uppercase">
                    Biometrics & physical findings
                  </span>
                </label>
                <div className="relative">
                  <textarea
                    ref={refs.objectiveRef}
                    disabled={isFinalized}
                    value={soapObjective}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setActiveField("objective")}
                    placeholder="Enter vital signs, physical examination records, lab values..."
                    className="w-full min-h-[110px] bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl p-4 text-xs leading-relaxed outline-none focus:border-[var(--primary)]/40 transition-all resize-none"
                  />
                  {showSmartPhrases &&
                    activeField === "objective" &&
                    renderPopup()}
                </div>
              </div>

              {/* Assessment */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-[var(--text-primary)] uppercase tracking-widest ml-1 flex justify-between">
                  <span>Assessment (A)</span>
                  <span className="text-[8px] text-[var(--text-muted)] font-normal uppercase">
                    Clinical findings & diagnoses
                  </span>
                </label>
                <div className="relative">
                  <textarea
                    ref={refs.assessmentRef}
                    disabled={isFinalized}
                    value={soapAssessment}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setActiveField("assessment")}
                    placeholder="State primary and secondary diagnoses, progression evaluation..."
                    className="w-full min-h-[110px] bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl p-4 text-xs leading-relaxed outline-none focus:border-[var(--primary)]/40 transition-all resize-none"
                  />
                  {showSmartPhrases &&
                    activeField === "assessment" &&
                    renderPopup()}
                </div>
              </div>

              {/* Plan */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-[var(--text-primary)] uppercase tracking-widest ml-1 flex justify-between">
                  <span>Plan (P)</span>
                  <span className="text-[8px] text-[var(--text-muted)] font-normal uppercase">
                    Medications & care protocol
                  </span>
                </label>
                <div className="relative">
                  <textarea
                    ref={refs.planRef}
                    disabled={isFinalized}
                    value={soapPlan}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setActiveField("plan")}
                    placeholder="Formulate medical prescription, orders, referrals, next visits..."
                    className="w-full min-h-[110px] bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl p-4 text-xs leading-relaxed outline-none focus:border-[var(--primary)]/40 transition-all resize-none"
                  />
                  {showSmartPhrases && activeField === "plan" && renderPopup()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--card-border)]/40 shrink-0">
          <div className="flex items-center gap-2 px-4 py-2 bg-[var(--input-bg)]/80 backdrop-blur-md rounded-full border border-[var(--card-border)]">
            <Lock className="w-3 h-3 text-[var(--text-muted)]" />
            <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">
              HIPAA compliant E2E crypt session
            </span>
          </div>
          {lastSaved && (
            <span className="text-[8px] font-black text-emerald-500/60 tracking-wider uppercase">
              Autosaved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
