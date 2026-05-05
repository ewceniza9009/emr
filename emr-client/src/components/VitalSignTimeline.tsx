"use client";

import { useQuery, gql } from "@apollo/client";
import { 
  Activity, 
  Thermometer, 
  Wind, 
  Heart, 
  Droplets,
  Calendar,
  Scale
} from "lucide-react";

import { useState } from "react";
import VitalLogDrawer from "./VitalLogDrawer";

const GET_ENCOUNTERS = gql`
  query GetEncounters($patientId: UUID!) {
    encountersByPatient(patientId: $patientId) {
      encounterId
      type
      encounterDate
      vitalSigns {
        heartRate
        bloodPressureSystolic
        bloodPressureDiastolic
        respiratoryRate
        oxygenSaturation
        temperature
        weight
        recordedAt
      }
    }
  }
`;

export default function VitalSignTimeline({ patientId }: { patientId: string }) {
  const [isLogOpen, setIsLogOpen] = useState(false);
  const { data, loading } = useQuery(GET_ENCOUNTERS, {
    variables: { patientId }
  });

  const encounters = data?.encountersByPatient || [];

  if (loading) return <div className="p-8 text-slate-500 animate-pulse text-xs uppercase font-bold tracking-widest">Scanning Vitals...</div>;

  return (
    <div className="glass-morphism rounded-2xl p-4 border border-[var(--card-border)] space-y-3">
       <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-black text-[var(--text-primary)] flex items-center gap-2 uppercase tracking-tighter">
            <Activity className="w-4 h-4 text-blue-400" />
            Vital Sign History
          </h2>
          <button 
            onClick={() => setIsLogOpen(true)}
            className="text-blue-400 text-[9px] font-black uppercase tracking-widest hover:underline"
          >
            Full Log
          </button>
       </div>

       <div className="space-y-2">
          {encounters.length === 0 ? (
            <div className="p-10 text-center text-[var(--text-muted)] text-[10px] uppercase font-black tracking-widest italic opacity-50">
              No historical vitals found in registry.
            </div>
          ) : (
            encounters.map((e: any) => {
              const v = e.vitalSigns?.[0]; // Get the most recent vitals for this encounter
              if (!v) return null;

              return (
                <div key={e.encounterId} className="p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex flex-col gap-3 group hover:border-[var(--primary)]/30 transition-all">
                  <div className="flex items-center justify-between text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(e.encounterDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <span className="text-blue-400/60">{e.type}</span>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-3">
                      <div className="text-center p-1.5 rounded-lg bg-[var(--background)]/50">
                        <Heart className="w-3.5 h-3.5 text-red-400 mx-auto mb-1" />
                        <div className="text-[var(--text-primary)] font-black text-xs">{v.heartRate || '--'}</div>
                        <div className="text-[7px] text-[var(--text-muted)] uppercase font-black">BPM</div>
                      </div>
                      <div className="text-center p-1.5 rounded-lg bg-[var(--background)]/50">
                        <Activity className="w-3.5 h-3.5 text-blue-400 mx-auto mb-1" />
                        <div className="text-[var(--text-primary)] font-black text-xs">{v.bloodPressureSystolic}/{v.bloodPressureDiastolic}</div>
                        <div className="text-[7px] text-[var(--text-muted)] uppercase font-black">mmHg</div>
                      </div>
                      <div className="text-center p-1.5 rounded-lg bg-[var(--background)]/50">
                        <Wind className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-1" />
                        <div className="text-[var(--text-primary)] font-black text-xs">{v.respiratoryRate || '--'}</div>
                        <div className="text-[7px] text-[var(--text-muted)] uppercase font-black">RR</div>
                      </div>
                      <div className="text-center p-1.5 rounded-lg bg-[var(--background)]/50">
                        <Droplets className="w-3.5 h-3.5 text-cyan-400 mx-auto mb-1" />
                        <div className="text-[var(--text-primary)] font-black text-xs">{v.oxygenSaturation}%</div>
                        <div className="text-[7px] text-[var(--text-muted)] uppercase font-black">SpO2</div>
                      </div>
                      <div className="text-center p-1.5 rounded-lg bg-[var(--background)]/50">
                        <Scale className="w-3.5 h-3.5 text-indigo-400 mx-auto mb-1" />
                        <div className="text-[var(--text-primary)] font-black text-xs">{v.weight || '--'}</div>
                        <div className="text-[7px] text-[var(--text-muted)] uppercase font-black">kg</div>
                      </div>
                  </div>
                </div>
              );
            })
          )}
       </div>
        <VitalLogDrawer 
          isOpen={isLogOpen} 
          onClose={() => setIsLogOpen(false)} 
          encounters={encounters} 
        />
    </div>
  );
}
