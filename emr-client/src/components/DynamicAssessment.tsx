"use client";

import { useState } from "react";
import { ChevronRight, CheckCircle2, Circle, HelpCircle } from "lucide-react";

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
  questions: Question[];
}

interface Props {
  questionnaire: Questionnaire;
  onComplete: (answers: Record<string, any>, totalScore?: number) => void;
  onBack: () => void;
}

export default function DynamicAssessment({ questionnaire, onComplete, onBack }: Props) {
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const isComplete = questionnaire.questions.every((q) => answers[q.questionId] !== undefined);

  const calculateScore = () => {
    let total = 0;
    let hasNumeric = false;
    
    questionnaire.questions.forEach(q => {
      const val = answers[q.questionId];
      if (q.type === "SCALE" && typeof val === "number") {
        total += val;
        hasNumeric = true;
      } else if (q.type === "MULTIPLE_CHOICE" && q.optionsJson) {
        // Simple heuristic for PHQ-9 style options
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
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-start justify-between border-b border-white/5 pb-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">
            {questionnaire.name}
          </h2>
          <p className="text-[var(--text-muted)] text-[11px] uppercase tracking-wider">{questionnaire.description}</p>
        </div>
        {calculateScore() !== undefined && (
          <div className="flex flex-col items-end gap-1">
            <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black text-lg shadow-lg shadow-blue-500/5 animate-in zoom-in duration-300">
              {calculateScore()}
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">Live Score</span>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {questionnaire.questions.map((q) => (
          <div key={q.questionId} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest flex items-center gap-2">
                {q.text}
              </label>
              {q.subtext && <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-[0.2em]">{q.subtext}</p>}
            </div>

            {q.type === "SCALE" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[var(--text-muted)]">0 - ABSENT</span>
                  <span className={`text-sm font-black px-4 py-1 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30`}>
                    {answers[q.questionId] ?? "-"}
                  </span>
                  <span className="text-[10px] font-bold text-[var(--text-muted)]">10 - WORST</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={answers[q.questionId] ?? 0}
                  onChange={(e) => handleAnswer(q.questionId, parseInt(e.target.value))}
                  className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-blue-500 border border-white/5"
                />
              </div>
            )}

            {q.type === "YES_NO" && (
              <div className="flex gap-4">
                {["Yes", "No"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(q.questionId, opt)}
                    className={`flex-1 py-4 rounded-2xl border font-bold transition-all ${
                      answers[q.questionId] === opt
                        ? "bg-blue-600/20 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/10"
                        : "bg-white/5 border-white/5 text-[var(--text-muted)] hover:bg-white/10"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {q.type === "MULTIPLE_CHOICE" && q.optionsJson && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {JSON.parse(q.optionsJson).map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(q.questionId, opt)}
                    className={`p-4 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between group ${
                      answers[q.questionId] === opt
                        ? "bg-blue-600/20 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/10"
                        : "bg-white/5 border-white/5 text-[var(--text-muted)] hover:bg-white/10"
                    }`}
                  >
                    <span className="max-w-[80%]">{opt}</span>
                    {answers[q.questionId] === opt ? (
                      <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-white/10 group-hover:text-white/20" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {q.type === "TEXT" && (
              <textarea
                value={answers[q.questionId] ?? ""}
                onChange={(e) => handleAnswer(q.questionId, e.target.value)}
                placeholder="Type findings here..."
                className="w-full premium-input rounded-2xl p-6 text-sm text-[var(--text-primary)] min-h-[120px]"
              />
            )}
          </div>
        ))}
      </div>

      <div className="pt-8 flex gap-4 border-t border-white/5">
        <button
          onClick={onBack}
          className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/5 text-[var(--text-muted)] font-black text-[10px] uppercase tracking-widest hover:text-[var(--text-primary)] hover:bg-white/10 transition-all"
        >
          Back
        </button>
        <button
          onClick={() => onComplete(answers, calculateScore())}
          className={`flex-1 premium-button premium-gradient py-3.5 rounded-xl text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 transition-all ${
            !isComplete ? "opacity-50 grayscale cursor-not-allowed" : ""
          }`}
          disabled={!isComplete}
        >
          {isComplete ? "Confirm Result" : "Pending Answers"} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
