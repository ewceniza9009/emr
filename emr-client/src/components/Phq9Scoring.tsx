"use client";

import { useState } from "react";
import { Brain, Info, CheckCircle2 } from "lucide-react";

interface Phq9ScoringProps {
  onScoreChange: (score: number, items: Record<string, number>) => void;
}

const QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead or of hurting yourself in some way"
];

const OPTIONS = [
  { label: "Not at all", value: 0 },
  { label: "Several days", value: 1 },
  { label: "More than half the days", value: 2 },
  { label: "Nearly every day", value: 3 },
];

export default function Phq9Scoring({ onScoreChange }: Phq9ScoringProps) {
  const [items, setItems] = useState<Record<number, number>>({});

  const handleUpdate = (idx: number, val: number) => {
    const newItems = { ...items, [idx]: val };
    setItems(newItems);
    
    const totalScore = Object.values(newItems).reduce((a, b) => a + b, 0);
    const resultItems: Record<string, number> = {};
    Object.entries(newItems).forEach(([k, v]) => {
      resultItems[`q${k}`] = v;
    });
    onScoreChange(totalScore, resultItems);
  };

  const totalScore = Object.values(items).reduce((a, b) => a + b, 0);

  const getSeverity = (score: number) => {
    if (score < 5) return { label: "Minimal Depression", color: "text-emerald-400" };
    if (score < 10) return { label: "Mild Depression", color: "text-blue-400" };
    if (score < 15) return { label: "Moderate Depression", color: "text-amber-400" };
    if (score < 20) return { label: "Moderately Severe", color: "text-orange-400" };
    return { label: "Severe Depression", color: "text-red-400" };
  };

  const severity = getSeverity(totalScore);

  return (
    <div className="glass-morphism rounded-3xl p-8 border border-[var(--card-border)] space-y-8 bg-[var(--card-bg)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-3 uppercase tracking-tight">
            <Brain className="w-6 h-6 text-pink-400" />
            PHQ-9 Depression Screening
          </h2>
          <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
            <Info className="w-3 h-3" />
            Patient Health Questionnaire-9
          </p>
        </div>
        <div className="px-6 py-3 rounded-2xl bg-pink-500/5 border border-pink-500/10 flex flex-col items-center">
           <div className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-1">Total Score</div>
           <div className="text-3xl font-black text-[var(--text-primary)] tabular-nums">{totalScore}</div>
           <div className={`text-[10px] font-bold uppercase tracking-tighter mt-1 ${severity.color}`}>{severity.label}</div>
        </div>
      </div>

      <div className="space-y-4">
        {QUESTIONS.map((q, idx) => (
          <div key={idx} className="p-6 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-4 transition-all hover:border-pink-500/20">
            <div className="flex items-start gap-4">
              <span className="text-xs font-black text-pink-400 opacity-40 mt-1">{idx + 1}.</span>
              <p className="text-sm font-semibold text-[var(--text-primary)] leading-relaxed">{q}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleUpdate(idx, opt.value)}
                  className={`py-3 px-4 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border
                    ${items[idx] === opt.value 
                      ? "bg-pink-500 text-white border-transparent shadow-lg shadow-pink-500/20" 
                      : "bg-white/5 border-white/5 text-[var(--text-muted)] hover:bg-white/10"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
