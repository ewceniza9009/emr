"use client";

import { useQuery, gql } from "@apollo/client";
import { 
  Activity, 
  Thermometer, 
  Wind, 
  Heart, 
  Droplets,
  Calendar
} from "lucide-react";

const GET_ENCOUNTERS = gql`
  query GetEncounters($patientId: UUID!) {
    encountersByPatient(patientId: $patientId) {
      encounterId
      type
      arrivedAt
      # In a real app, vitals would be a structured object on the encounter
      # For now we'll simulate the extraction of vitals data
    }
  }
`;

export default function VitalSignTimeline({ patientId }: { patientId: string }) {
  const { data, loading } = useQuery(GET_ENCOUNTERS, {
    variables: { patientId }
  });

  // Mocking the vital extraction since the encounter model is currently notes-heavy
  const mockVitals = [
    { date: "May 1, 2026", hr: 78, bp: "120/80", rr: 16, spo2: 98, temp: 36.6 },
    { date: "Apr 28, 2026", hr: 82, bp: "118/78", rr: 18, spo2: 96, temp: 37.1 },
    { date: "Apr 25, 2026", hr: 85, bp: "122/82", rr: 20, spo2: 95, temp: 36.8 },
  ];

  if (loading) return <div className="p-8 text-slate-500 animate-pulse text-xs uppercase font-bold tracking-widest">Scanning Vitals...</div>;

  return (
    <div className="glass-morphism rounded-2xl p-4 border border-[var(--card-border)] space-y-3">
       <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-black text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-tighter">
            <Activity className="w-4 h-4 text-blue-400" />
            Vital Sign History
          </h2>
          <button className="text-blue-400 text-[9px] font-black uppercase tracking-widest hover:underline">Full Log</button>
       </div>

       <div className="space-y-2">
          {mockVitals.map((v, i) => (
            <div key={i} className="p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col gap-3 group hover:border-[var(--primary)]/30 transition-all">
               <div className="flex items-center justify-between text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                     <Calendar className="w-3 h-3" />
                     {v.date}
                  </div>
                  <span className="text-blue-400/60">Routine Visit</span>
               </div>
               
               <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-1.5 rounded-lg bg-[var(--background)]/50">
                     <Heart className="w-3.5 h-3.5 text-red-400 mx-auto mb-1" />
                     <div className="text-[var(--text-primary)] font-black text-xs">{v.hr}</div>
                     <div className="text-[7px] text-[var(--text-muted)] uppercase font-black">BPM</div>
                  </div>
                  <div className="text-center p-1.5 rounded-lg bg-[var(--background)]/50">
                     <Activity className="w-3.5 h-3.5 text-blue-400 mx-auto mb-1" />
                     <div className="text-[var(--text-primary)] font-black text-xs">{v.bp}</div>
                     <div className="text-[7px] text-[var(--text-muted)] uppercase font-black">mmHg</div>
                  </div>
                  <div className="text-center p-1.5 rounded-lg bg-[var(--background)]/50">
                     <Wind className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
                     <div className="text-[var(--text-primary)] font-black text-xs">{v.rr}</div>
                     <div className="text-[7px] text-[var(--text-muted)] uppercase font-black">RR</div>
                  </div>
                  <div className="text-center p-1.5 rounded-lg bg-[var(--background)]/50">
                     <Droplets className="w-3.5 h-3.5 text-cyan-400 mx-auto mb-1" />
                     <div className="text-[var(--text-primary)] font-black text-xs">{v.spo2}%</div>
                     <div className="text-[7px] text-[var(--text-muted)] uppercase font-black">SpO2</div>
                  </div>
               </div>
            </div>
          ))}
       </div>
    </div>
  );
}
