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
    <div className="glass-morphism rounded-3xl p-8 border border-white/5 space-y-6">
       <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Vital Sign History
          </h2>
          <button className="text-blue-400 text-[10px] font-bold uppercase tracking-widest hover:underline">Full Log</button>
       </div>

       <div className="space-y-4">
          {mockVitals.map((v, i) => (
            <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-4 group hover:border-blue-500/30 transition-all">
               <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                     <Calendar className="w-3 h-3" />
                     {v.date}
                  </div>
                  <span className="text-blue-400/60">Routine Visit</span>
               </div>
               
               <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-2 rounded-xl bg-white/5">
                     <Heart className="w-4 h-4 text-red-400 mx-auto mb-1" />
                     <div className="text-white font-bold text-sm">{v.hr}</div>
                     <div className="text-[8px] text-slate-500 uppercase font-bold">BPM</div>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-white/5">
                     <Activity className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                     <div className="text-white font-bold text-sm">{v.bp}</div>
                     <div className="text-[8px] text-slate-500 uppercase font-bold">mmHg</div>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-white/5">
                     <Wind className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                     <div className="text-white font-bold text-sm">{v.rr}</div>
                     <div className="text-[8px] text-slate-500 uppercase font-bold">RR</div>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-white/5">
                     <Droplets className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                     <div className="text-white font-bold text-sm">{v.spo2}%</div>
                     <div className="text-[8px] text-slate-500 uppercase font-bold">SpO2</div>
                  </div>
               </div>
            </div>
          ))}
       </div>
    </div>
  );
}
