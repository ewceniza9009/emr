import React from "react";
import { useQuery, gql } from "@apollo/client";
import { ClipboardList, ChevronRight, HelpCircle } from "lucide-react";
import DynamicAssessment from "@/components/DynamicAssessment";
import { useParams } from "next/navigation";

export const GET_QUESTIONNAIRE = gql`
  query GetQuestionnaire($type: AssessmentType!) {
    questionnaireByType(type: $type) {
      questionnaireId
      name
      description
      schemaJson
      questions {
        questionId
        text
        subtext
        type
        optionsJson
      }
    }
  }
`;

export function StepAssessment({ state }: { state: any }) {
  const params = useParams();
  const {
    currentStep,
    nextStep,
    prevStep,
    setStep,
    encounterId,
    session,
    assessmentResults,
    setAssessmentResults,
    setActiveAssessments,
    setSkippingAssessment,
    executingAssessment,
    setExecutingAssessment,
    smartPhrases,
    logAssessmentResponse
  } = state;

  const { data: questionnaireData, loading: loadingQuestionnaire } = useQuery(GET_QUESTIONNAIRE, {
    variables: { type: currentStep?.assessmentId },
    skip: (currentStep?.type !== "ASSESSMENT" && currentStep?.type !== "ASSESSMENT_WRAPPER") || !currentStep?.assessmentId
  });

  if (!executingAssessment) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-12">
        <div className="w-24 h-24 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-[0_0_50px_rgba(99,102,241,0.1)]">
          <ClipboardList className="w-12 h-12" />
        </div>
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-tight">{currentStep.label}</h2>
          <p className="text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed text-sm">
            {questionnaireData?.questionnaireByType?.description || "Select an action to proceed with this clinical assessment."}
          </p>
        </div>

        <div className="w-full max-w-[320px] space-y-3">
          <button
            onClick={() => setExecutingAssessment(true)}
            className="w-full py-3.5 rounded-xl bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            Start Assessment <ChevronRight className="w-4 h-4" />
          </button>

          <div className="flex gap-3 w-full">
            <button
              onClick={() => setStep(prevStep.id)}
              className="flex-1 py-3.5 rounded-xl bg-[var(--background)] border border-[var(--border-color,rgba(0,0,0,0.1))] text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest hover:text-[var(--foreground)] transition-all"
            >
              Back
            </button>
            <button
              onClick={() => setSkippingAssessment({ id: currentStep.assessmentId!, name: currentStep.label })}
              className="flex-1 py-3.5 rounded-xl border border-[var(--border-color,rgba(0,0,0,0.1))] text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest hover:text-[var(--foreground)] hover:border-[var(--primary)] transition-all"
            >
              Skip
            </button>
            <button
              onClick={() => {
                setActiveAssessments((prev: any[]) => prev.filter(a => a.assessmentType !== currentStep.assessmentId));
                setStep(prevStep.id);
              }}
              className="flex-1 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loadingQuestionnaire) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in duration-500">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
          <ClipboardList className="w-6 h-6 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-[0.4em]">Hydrating Assessment Schema</p>
          <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
          <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-50">Syncing Clinical Metadata</p>
        </div>
      </div>
    );
  }

  if (questionnaireData?.questionnaireByType) {
    return (
      <DynamicAssessment
        questionnaire={questionnaireData.questionnaireByType}
        initialAnswers={assessmentResults[currentStep.assessmentId!]?.answers || {}}
        onPartialUpdate={(answers) => {
          setAssessmentResults((prev: any) => ({
            ...prev,
            [currentStep.assessmentId!]: { ...prev[currentStep.assessmentId!], answers }
          }));
        }}
        onBack={() => setExecutingAssessment(false)}
        smartPhrases={smartPhrases}
        onComplete={async (answers, score) => {
          try {
            await logAssessmentResponse({
              variables: {
                input: {
                  questionnaireId: questionnaireData.questionnaireByType.questionnaireId,
                  patientId: params.id,
                  encounterId: encounterId,
                  assessorId: session?.user?.practitionerId || session?.user?.id || "00000000-0000-0000-0000-000000000000",
                  answersJson: JSON.stringify(answers),
                  totalScore: score
                }
              }
            });
            setAssessmentResults((prev: any) => ({
              ...prev,
              [currentStep.assessmentId!]: { answers, score, completed: true }
            }));
            setExecutingAssessment(false);
            setStep(nextStep.id);
          } catch (err) {
            console.error("Failed to save assessment response", err);
          }
        }}
      />
    );
  }

  return (
    <div className="p-16 bg-[var(--card-bg)] border border-[var(--border-color,rgba(0,0,0,0.1))] rounded-[2rem] text-center space-y-6">
      <HelpCircle className="w-10 h-10 text-blue-400 mx-auto" />
      <p className="text-[var(--text-muted)] italic text-xs">Protocol metadata missing in backend.</p>
      <button onClick={() => setExecutingAssessment(false)} className="px-6 py-3 rounded-xl bg-[var(--background)] text-[var(--text-muted)] font-bold text-xs">Cancel</button>
    </div>
  );
}
