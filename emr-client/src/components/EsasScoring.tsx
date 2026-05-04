"use client";

import { useState, useEffect } from "react";
import { 
  Activity, 
  AlertTriangle, 
  Brain, 
  Frown, 
  Heart, 
  Wind, 
  Utensils, 
  Moon, 
  Zap,
  Info
} from "lucide-react";

interface Symptom {
  id: string;
  label: string;
  icon: any;
  value: number;
}

interface EsasScoringProps {
  onScoreChange: (scores: Record<string, number>) => void;
}

export default function EsasScoring({ onScoreChange }: EsasScoringProps) {
  const [scores, setScores] = useState<Record<string, number>>({
    pain: 0,
    tiredness: 0,
    drowsiness: 0,
    nausea: 0,
    appetite: 0,
    shortnessOfBreath: 0,
    depression: 0,
    anxiety: 0,
    wellbeing: 0,
  });

  const symptoms = [
    { id: "pain", label: "Pain", icon: <AlertTriangle className="w-4 h-4 text-red-400" /> },
    { id: "tiredness", label: "Tiredness", icon: <Zap className="w-4 h-4 text-amber-400" /> },
    { id: "drowsiness", label: "Drowsiness", icon: <Moon className="w-4 h-4 text-blue-400" /> },
    { id: "nausea", label: "Nausea", icon: <Activity className="w-4 h-4 text-emerald-400" /> },
    { id: "appetite", label: "Lack of Appetite", icon: <Utensils className="w-4 h-4 text-orange-400" /> },
    { id: "shortnessOfBreath", label: "Shortness of Breath", icon: <Wind className="w-4 h-4 text-cyan-400" /> },
    { id: "depression", label: "Depression", icon: <Frown className="w-4 h-4 text-purple-400" /> },
    { id: "anxiety", label: "Anxiety", icon: <Brain className="w-4 h-4 text-pink-400" /> },
    { id: "wellbeing", label: "Overall Wellbeing", icon: <Heart className="w-4 h-4 text-indigo-400" /> },
  ];

  const handleUpdate = (id: string, val: number) => {
    const newScores = { ...scores, [id]: val };
    setScores(newScores);
    onScoreChange(newScores);
  };

  const getSeverityColor = (val: number) => {
    if (val === 0) return "text-[var(--text-muted)]";
    if (val < 4) return "text-emerald-400";
    if (val < 7) return "text-amber-400";
    return "text-red-400";
  };

  const getBgColor = (val: number) => {
    if (val === 0) return "bg-slate-500/10";
    if (val < 4) return "bg-emerald-500/20";
    if (val < 7) return "bg-amber-500/20";
    return "bg-red-500/20";
  };

  return (
    <div className="glass-morphism rounded-3xl p-8 border border-[var(--card-border)] space-y-8 bg-[var(--card-bg)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-3 uppercase tracking-tighter">
            <Activity className="w-6 h-6 text-blue-400" />
            ESAS-r Symptom Assessment
          </h2>
          <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
            <Info className="w-3 h-3" />
            0 = No Symptom | 10 = Worst Possible
          </p>
        </div>
        <div className="px-4 py-2 rounded-2xl bg-blue-500/5 border border-blue-500/10">
           <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 text-center">Aggregate Burden</div>
           <div className="text-2xl font-black text-[var(--text-primary)] text-center tabular-nums">
              {Object.values(scores).reduce((a, b) => a + b, 0)}
              <span className="text-xs text-[var(--text-muted)] ml-1">/ 90</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {symptoms.map((s) => (
          <div key={s.id} className="space-y-4 p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] transition-all hover:border-blue-500/20 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {s.icon}
                <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-tight">{s.label}</span>
              </div>
              <span className={`text-xl font-black tabular-nums transition-colors ${getSeverityColor(scores[s.id])}`}>
                {scores[s.id]}
              </span>
            </div>

            <div className="relative h-2 bg-black/40 rounded-full overflow-hidden">
               <div 
                 className={`absolute inset-y-0 left-0 transition-all duration-300 ${getBgColor(scores[s.id]).replace('/20', '')}`}
                 style={{ width: `${scores[s.id] * 10}%` }}
               />
               <input 
                 type="range" 
                 min="0" 
                 max="10" 
                 step="1"
                 value={scores[s.id]}
                 onChange={(e) => handleUpdate(s.id, parseInt(e.target.value))}
                 className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
               />
            </div>

            <div className="flex justify-between px-1">
               {[0, 2, 4, 6, 8, 10].map(v => (
                 <span key={v} className="text-[8px] font-bold text-[var(--text-muted)]">{v}</span>
               ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
