"use client";

import React from "react";
import { useGuidedVisitState } from "./hooks/useGuidedVisitState";
import { VisitHeader } from "./components/VisitHeader";
import { VisitNavigator } from "./components/VisitNavigator";
import { StepInit } from "./components/StepInit";
import { StepDirectives } from "./components/StepDirectives";
import { StepVitals } from "./components/StepVitals";
import { StepClinical } from "./components/StepClinical";
import { StepNote } from "./components/StepNote";
import { StepFinish } from "./components/StepFinish";
import { StepAssessment } from "./components/StepAssessment";
import { AssessmentSelectionModal } from "./components/AssessmentSelectionModal";
import { SkipAssessmentModal } from "./components/SkipAssessmentModal";
import { HeartPulse } from "lucide-react";

export default function GuidedVisitPage() {
  const state = useGuidedVisitState();

  const {
    isHydrated,
    currentStep,
    isAssessmentModalOpen,
    setIsAssessmentModalOpen,
    activeAssessments,
    setActiveAssessments,
    allQuestionnaires,
    allQuestionnairesData
  } = state;

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] space-y-4">
        <HeartPulse className="w-10 h-10 text-teal-500 animate-pulse" />
        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">Initializing Guided Visit Console</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--background)] text-[var(--foreground)] overflow-hidden font-sans transition-colors duration-300">
      {/* Clinician Context Header */}
      <VisitHeader state={state} />

      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--background)]">
        {/* Top Rail Navigator */}
        <VisitNavigator state={state} />

        {/* Dynamic Step Viewport */}
        <main className="flex-1 overflow-y-auto relative custom-scrollbar">
          <div className="max-w-[1600px] mx-auto p-4 sm:p-8 h-full">
            <div className="min-h-[600px] h-full rounded-[2.5rem] p-8 sm:p-12 border border-[var(--divider-color)] bg-[var(--card-bg)] shadow-2xl overflow-y-auto flex flex-col">
              
              {currentStep?.type === "INIT" && (
                <StepInit state={state} />
              )}

              {currentStep?.type === "DIRECTIVES" && (
                <StepDirectives state={state} />
              )}

              {currentStep?.type === "VITALS" && (
                <StepVitals state={state} />
              )}

              {currentStep?.type === "ASSESSMENT_WRAPPER" && (
                <StepAssessment state={state} />
              )}

              {currentStep?.type === "CLINICAL" && (
                <StepClinical state={state} />
              )}

              {currentStep?.type === "NOTE" && (
                <StepNote state={state} />
              )}

              {currentStep?.type === "FINISH" && (
                <StepFinish state={state} />
              )}

            </div>
          </div>
        </main>
      </div>

      {/* Assessment Selection Modal */}
      {isAssessmentModalOpen && (
        <AssessmentSelectionModal
          isOpen={isAssessmentModalOpen}
          onClose={() => setIsAssessmentModalOpen(false)}
          onSelect={(q: any) => {
            if (!activeAssessments.some(a => (a.questionnaireId === q.questionnaireId || a.assessmentType === q.assessmentType))) {
              setActiveAssessments([...activeAssessments, q]);
            }
            setIsAssessmentModalOpen(false);
          }}
          selectedIds={activeAssessments.map(a => a.questionnaireId || a.assessmentType)}
          questionnaires={allQuestionnaires}
          loading={!allQuestionnairesData}
        />
      )}

      {/* Skip Reason Modal Overlay */}
      <SkipAssessmentModal state={state} />
    </div>
  );
}
