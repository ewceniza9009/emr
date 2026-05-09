"use client";

import { useState } from "react";
import { 
  Zap,
  Accessibility,
  Activity,
  User,
  Coffee,
  Brain,
  ChevronDown
} from "lucide-react";

interface PpsLevel {
  percent: number;
  ambulation: string;
  activity: string;
  selfCare: string;
  intake: string;
  consciousness: string;
}

const PPS_LEVELS: PpsLevel[] = [
  { percent: 100, ambulation: "Full", activity: "Normal activity", selfCare: "Full", intake: "Normal", consciousness: "Full" },
  { percent: 90, ambulation: "Full", activity: "Normal activity with some effort", selfCare: "Full", intake: "Normal", consciousness: "Full" },
  { percent: 80, ambulation: "Full", activity: "Normal activity with effort, some signs of disease", selfCare: "Full", intake: "Normal", consciousness: "Full" },
  { percent: 70, ambulation: "Reduced", activity: "Unable normal Job/Work", selfCare: "Full", intake: "Normal", consciousness: "Full" },
  { percent: 60, ambulation: "Reduced", activity: "Unable hobby/house work", selfCare: "Occasional assistance", intake: "Normal or reduced", consciousness: "Full or Confusion" },
  { percent: 50, ambulation: "Mainly Sit/Lie", activity: "Unable to do any work", selfCare: "Considerable assistance", intake: "Normal or reduced", consciousness: "Full or Confusion" },
  { percent: 40, ambulation: "Mainly in Bed", activity: "As above", selfCare: "Mainly assistance", intake: "Normal or reduced", consciousness: "Full, Confusion or Drowsy" },
  { percent: 30, ambulation: "Totally Bed Bound", activity: "As above", selfCare: "Total Care", intake: "Normal or reduced", consciousness: "Full, Confusion or Drowsy" },
  { percent: 20, ambulation: "As above", activity: "As above", selfCare: "Total Care", intake: "Minimal sips", consciousness: "Full, Confusion or Drowsy" },
  { percent: 10, ambulation: "As above", activity: "As above", selfCare: "Total Care", intake: "Mouth care only", consciousness: "Drowsy or Coma" },
  { percent: 0, ambulation: "Death", activity: "-", selfCare: "-", intake: "-", consciousness: "-" },
];

interface PpsSelectorProps {
  onScoreChange: (score: number) => void;
}

export default function PpsSelector({ onScoreChange }: PpsSelectorProps) {
  const [selected, setSelected] = useState<number>(100);
  const [isOpen, setIsOpen] = useState(false);

  const current = PPS_LEVELS.find(l => l.percent === selected) || PPS_LEVELS[0];

  const handleSelect = (level: number) => {
    setSelected(level);
    onScoreChange(level);
    setIsOpen(false);
  };

  const getStatusColor = (percent: number) => {
    if (percent >= 70) return "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
    if (percent >= 40) return "text-amber-400 border-amber-500/20 bg-amber-500/5";
    return "text-red-400 border-red-500/20 bg-red-500/5";
  };

  return (
    <div className="glass-morphism rounded-3xl p-8 border border-[var(--card-border)] space-y-6 bg-[var(--card-bg)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-3 uppercase tracking-tight">
            <Accessibility className="w-6 h-6 text-purple-400" />
            PPSv2 Functional Scale
          </h2>
          <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest mt-1">Palliative Performance Scale</p>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-4 px-6 py-3 rounded-2xl border transition-all ${getStatusColor(selected)}`}
          >
            <div className="flex flex-col items-start">
               <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Performance</span>
               <span className="text-2xl font-black tabular-nums">{selected}%</span>
            </div>
            <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute top-full right-0 mt-2 w-[350px] max-h-[400px] overflow-y-auto bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-2xl z-50 p-2 space-y-1 backdrop-blur-xl">
              {PPS_LEVELS.map((l) => (
                <button
                  key={l.percent}
                  onClick={() => handleSelect(l.percent)}
                  className={`w-full p-4 rounded-xl text-left transition-all hover:bg-white/5 flex items-center justify-between group
                             ${selected === l.percent ? 'bg-white/10' : ''}`}
                >
                  <div>
                    <div className="text-sm font-black text-[var(--text-primary)]">{l.percent}%</div>
                    <div className="text-[9px] text-[var(--text-muted)] uppercase font-bold tracking-tighter mt-1">
                      {l.ambulation} • {l.selfCare}
                    </div>
                  </div>
                  {selected === l.percent && <div className="w-2 h-2 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Ambulation", val: current.ambulation, icon: <Accessibility className="w-4 h-4 text-purple-400" /> },
          { label: "Activity", val: current.activity, icon: <Activity className="w-4 h-4 text-blue-400" /> },
          { label: "Self-Care", val: current.selfCare, icon: <User className="w-4 h-4 text-emerald-400" /> },
          { label: "Intake", val: current.intake, icon: <Coffee className="w-4 h-4 text-orange-400" /> },
          { label: "Consciousness", val: current.consciousness, icon: <Brain className="w-4 h-4 text-pink-400" /> },
        ].map((item, i) => (
          <div key={i} className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-2">
            <div className="flex items-center gap-2 mb-2">
               {item.icon}
               <span className="tactical-label !m-0">{item.label}</span>
            </div>
            <div className="text-[11px] font-black text-[var(--text-primary)] leading-tight uppercase">
              {item.val}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

