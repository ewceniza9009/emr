"use client";

import { useState } from "react";
import { Heart, Info } from "lucide-react";

interface FicaData {
  faith: string;
  importance: string;
  community: string;
  addressInCare: string;
}

interface FicaAssessmentProps {
  initialData?: FicaData;
  onDataChange: (data: FicaData) => void;
}

export default function FicaAssessment({ initialData, onDataChange }: FicaAssessmentProps) {
  const [data, setData] = useState<FicaData>(initialData || {
    faith: "",
    importance: "",
    community: "",
    addressInCare: ""
  });

  const handleUpdate = (field: keyof FicaData, value: string) => {
    const newData = { ...data, [field]: value };
    setData(newData);
    onDataChange(newData);
  };

  return (
    <div className="glass-morphism rounded-3xl p-8 border border-[var(--card-border)] space-y-8 bg-[var(--card-bg)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-3 uppercase tracking-tight">
            <Heart className="w-6 h-6 text-rose-400" />
            FICA Spiritual Assessment
          </h2>
          <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
            <Info className="w-3 h-3" />
            Faith, Importance, Community, and Address in care
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-3 p-6 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] transition-all hover:border-rose-500/20">
          <label className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] flex items-center gap-2">
            [F] Faith & Belief
          </label>
          <p className="text-[10px] text-[var(--text-muted)] italic">Do you consider yourself spiritual or religious? What gives your life meaning?</p>
          <textarea 
            value={data.faith} 
            onChange={e => handleUpdate("faith", e.target.value)} 
            placeholder="Type beliefs here..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-[var(--text-primary)] min-h-[80px] focus:outline-none focus:border-rose-500/40" 
          />
        </div>

        <div className="space-y-3 p-6 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] transition-all hover:border-rose-500/20">
          <label className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] flex items-center gap-2">
            [I] Importance & Influence
          </label>
          <p className="text-[10px] text-[var(--text-muted)] italic">How important are these beliefs to you? Do they influence your healthcare decisions?</p>
          <textarea 
            value={data.importance} 
            onChange={e => handleUpdate("importance", e.target.value)} 
            placeholder="Type importance/influence here..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-[var(--text-primary)] min-h-[80px] focus:outline-none focus:border-rose-500/40" 
          />
        </div>

        <div className="space-y-3 p-6 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] transition-all hover:border-rose-500/20">
          <label className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] flex items-center gap-2">
            [C] Community
          </label>
          <p className="text-[10px] text-[var(--text-muted)] italic">Are you part of a spiritual or religious community? Does it support you?</p>
          <textarea 
            value={data.community} 
            onChange={e => handleUpdate("community", e.target.value)} 
            placeholder="Type community details here..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-[var(--text-primary)] min-h-[80px] focus:outline-none focus:border-rose-500/40" 
          />
        </div>

        <div className="space-y-3 p-6 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] transition-all hover:border-rose-500/20">
          <label className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] flex items-center gap-2">
            [A] Address in Care
          </label>
          <p className="text-[10px] text-[var(--text-muted)] italic">How would you like your healthcare provider to address these issues in your care?</p>
          <textarea 
            value={data.addressInCare} 
            onChange={e => handleUpdate("addressInCare", e.target.value)} 
            placeholder="Type address in care details here..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-[var(--text-primary)] min-h-[80px] focus:outline-none focus:border-rose-500/40" 
          />
        </div>
      </div>
    </div>
  );
}
