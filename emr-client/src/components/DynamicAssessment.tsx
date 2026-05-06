"use client";

import { useState } from "react";
import { ChevronRight, CheckCircle2, Circle, HelpCircle } from "lucide-react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.min.css";
import { useMemo } from "react";

interface Question {
  questionId: string;
  text: string;
  subtext?: string;
  type: "SCALE" | "YES_NO" | "MULTIPLE_CHOICE" | "TEXT";
  optionsJson?: string;
}

interface Questionnaire {
  questionnaireId: string;
  name: string;
  description?: string;
  schemaJson?: string;
  questions: Question[];
}

interface Props {
  questionnaire: Questionnaire;
  initialAnswers?: Record<string, any>;
  onComplete: (answers: Record<string, any>, totalScore?: number) => void;
  onBack: () => void;
  onPartialUpdate?: (answers: Record<string, any>) => void;
}

export default function DynamicAssessment({ questionnaire, initialAnswers = {}, onComplete, onBack, onPartialUpdate }: Props) {
  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers);

  // Flattened Questions from either Legacy or Modern Schema
  const activeQuestions = useMemo(() => {
    if (questionnaire.schemaJson) {
      try {
        const schema = JSON.parse(questionnaire.schemaJson);
        const elements: any[] = [];
        schema.pages?.forEach((p: any) => p.elements?.forEach((e: any) => elements.push({
          questionId: e.name,
          text: e.title || e.name,
          subtext: e.description,
          type: e.type === "radiogroup" ? "MULTIPLE_CHOICE" : 
                e.type === "boolean" ? "YES_NO" : 
                e.type === "rating" || e.type === "slider" ? "SCALE" : "TEXT",
          optionsJson: e.choices ? JSON.stringify(e.choices.map((c: any) => typeof c === 'string' ? c : (c.text || c.value))) : null
        })));
        return elements;
      } catch (e) {
        console.error("Schema Parse Fail", e);
      }
    }
    return questionnaire.questions;
  }, [questionnaire]);

  const handleAnswer = (questionId: string, value: any) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    if (onPartialUpdate) onPartialUpdate(newAnswers);
  };

  const isComplete = activeQuestions.every((q) => answers[q.questionId] !== undefined);

  const calculateScore = () => {
    let total = 0;
    let hasNumeric = false;
    
    activeQuestions.forEach(q => {
      const val = answers[q.questionId];
      if (q.type === "SCALE" && typeof val === "number") {
        total += val;
        hasNumeric = true;
      } else if (q.type === "MULTIPLE_CHOICE" && q.optionsJson) {
        const options = JSON.parse(q.optionsJson);
        const idx = options.indexOf(val);
        if (idx !== -1) {
          total += idx;
          hasNumeric = true;
        }
      }
    });

    return hasNumeric ? total : undefined;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Tactical Header */}
      <div className="flex items-start justify-between border-b border-[var(--divider-color)] pb-6">
        <div className="space-y-1.5">
          <h2 className="text-3xl font-black text-[var(--text-primary)] uppercase tracking-tighter leading-none">
            {questionnaire.name}
          </h2>
          <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.3em]">{questionnaire.description || "Dynamic Clinical Assessment Node"}</p>
        </div>
        {calculateScore() !== undefined && (
          <div className="flex flex-col items-end gap-1">
            <div className="px-6 py-2.5 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] font-black text-2xl shadow-2xl shadow-[var(--primary-glow)]">
              {calculateScore()}
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mt-1">Registry Score</span>
          </div>
        )}
      </div>

      {/* Dynamic Question Fieldset */}
      <div className="space-y-10">
        {activeQuestions.map((q) => (
          <div key={q.questionId} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-[var(--text-primary)] uppercase tracking-[0.2em] flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] shadow-[0_0_8px_var(--primary)]" />
                {q.text}
              </label>
              {q.subtext && <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest ml-4 font-bold">{q.subtext}</p>}
            </div>

            {/* Tactical Scale Renderer */}
            {q.type === "SCALE" && (
              <div className="ml-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">0 - Baseline</span>
                  <div className="px-6 py-2 rounded-xl bg-[var(--primary)]/5 text-[var(--primary)] border border-[var(--primary)]/20 font-black text-lg">
                    {answers[q.questionId] ?? "--"}
                  </div>
                  <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">10 - Peak</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={answers[q.questionId] ?? 0}
                  onChange={(e) => handleAnswer(q.questionId, parseInt(e.target.value))}
                  className="w-full h-1.5 bg-[var(--divider-color)] rounded-full appearance-none cursor-pointer accent-[var(--primary)]"
                />
              </div>
            )}

            {/* High-Impact Tactical Yes/No */}
            {q.type === "YES_NO" && (
              <div className="ml-4 flex gap-4">
                {["Yes", "No"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(q.questionId, opt)}
                    className={`flex-1 py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${
                      answers[q.questionId] === opt
                        ? "bg-[var(--primary)]/20 border-[var(--primary)] text-[var(--primary)] shadow-2xl shadow-[var(--primary-glow)]"
                        : "bg-[var(--background)] border border-[var(--divider-color)] text-[var(--text-muted)] hover:border-[var(--primary)]/30 hover:bg-[var(--primary)]/5"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* Grid-Based Multiple Choice */}
            {q.type === "MULTIPLE_CHOICE" && q.optionsJson && (
              <div className="ml-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {JSON.parse(q.optionsJson).map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(q.questionId, opt)}
                    className={`p-3.5 rounded-xl border text-left text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between group ${
                      answers[q.questionId] === opt
                        ? "bg-[var(--primary)]/20 border-[var(--primary)] text-[var(--primary)] shadow-xl shadow-[var(--primary-glow)]"
                        : "bg-[var(--background)] border border-[var(--divider-color)] text-[var(--text-muted)] hover:border-[var(--primary)]/30 hover:bg-[var(--primary)]/5"
                    }`}
                  >
                    <span className="max-w-[80%]">{opt}</span>
                    {answers[q.questionId] === opt ? (
                      <CheckCircle2 className="w-4 h-4 text-[var(--primary)]" />
                    ) : (
                      <Circle className="w-4 h-4 text-[var(--text-muted)]/20 group-hover:text-[var(--text-muted)]/40" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Clean Tactical Text Area */}
            {q.type === "TEXT" && (
              <textarea
                value={answers[q.questionId] ?? ""}
                onChange={(e) => handleAnswer(q.questionId, e.target.value)}
                placeholder="INPUT CLINICAL OBSERVATIONS..."
                className="ml-4 w-full bg-[var(--background)] border border-[var(--divider-color)] rounded-xl p-6 text-xs font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/30 focus:border-[var(--primary)]/50 outline-none transition-all min-h-[120px] uppercase tracking-tighter"
              />
            )}
          </div>
        ))}
      </div>

      {/* Navigation Cluster */}
      <div className="pt-8 flex gap-4 border-t border-[var(--divider-color)]">
        <button
          onClick={onBack}
          className="flex-1 py-3.5 rounded-xl bg-[var(--background)] border border-[var(--divider-color)] text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest hover:text-[var(--text-primary)] hover:bg-[var(--background)]/80 transition-all active:scale-95"
        >
          Back
        </button>
        <button
          onClick={() => onComplete(answers, calculateScore())}
          className={`flex-1 py-3.5 rounded-xl text-white font-black text-[10px] uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${
            isComplete 
              ? "bg-[var(--primary)] shadow-[var(--primary-glow)] hover:opacity-90 active:scale-[0.98]" 
              : "bg-slate-700/20 text-slate-500/50 cursor-not-allowed grayscale"
          }`}
          disabled={!isComplete}
        >
          {isComplete ? "Confirm Assessment" : "Awaiting Data"} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
