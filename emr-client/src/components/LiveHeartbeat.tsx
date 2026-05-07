"use client";

import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { Activity, Heart, Zap, Wind, Thermometer } from "lucide-react";

export default function LiveHeartbeat({ patientId }: { patientId: string }) {
  const [vitals, setVitals] = useState({ hr: 72, spo2: "--", temp: "--" });
  const [connected, setConnected] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:34732/hubs/telemetry")
      .withAutomaticReconnect()
      .build();

    const startConnection = async () => {
      try {
        await connection.start();
        setConnected(true);
        await connection.invoke("JoinPatientStream", patientId);
        
        connection.on("ReceiveVitals", (data: any) => {
          setVitals({
            hr: data.heartRate,
            spo2: data.spO2.toString(),
            temp: data.temperature.toString()
          });
          setPulse(true);
          setTimeout(() => setPulse(false), 200);
        });

      } catch (err) {
        console.error("SignalR Connection Error: ", err);
      }
    };

    startConnection();

    return () => {
      connection.stop();
    };
  }, [patientId]);

  return (
    <div className="space-y-2">
      <div className="glass-morphism rounded-2xl p-3 border border-[var(--card-border)] flex items-center justify-between group hover:border-red-500/30 transition-all">
         <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all 
              ${connected ? 'bg-red-500/10 text-red-400' : 'bg-[var(--input-bg)] text-[var(--text-muted)]'}`}>
               <Heart className={`w-4 h-4 ${pulse ? 'scale-125 animate-pulse' : ''}`} />
            </div>
            <div>
               <div className="flex items-center gap-1">
                  <span className="text-lg font-black text-[var(--text-primary)] font-mono">{vitals.hr}</span>
                  <span className="text-[9px] text-[var(--text-secondary)] font-black uppercase tracking-widest">BPM</span>
               </div>
               <p className="text-[8px] text-[var(--text-muted)] font-black uppercase tracking-widest flex items-center gap-1">
                  <Zap className={`w-2.5 h-2.5 ${connected ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`} />
                  {connected ? 'LIVE IOT STREAM' : 'DISCONNECTED'}
               </p>
            </div>
         </div>
         <div className="h-6 w-20 bg-red-500/5 rounded-lg relative overflow-hidden flex items-end px-1 gap-0.5">
            {[...Array(10)].map((_, i) => (
               <div 
                 key={i} 
                 className="flex-1 bg-red-400/20 rounded-t-sm animate-pulse" 
                 style={{ height: `${pulse ? Math.random() * 100 : 20}%`, animationDelay: `${i * 0.1}s` }} 
               />
            ))}
         </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-0.5">
           <div className="flex items-center gap-1.5 text-[8px] font-black text-[var(--text-secondary)] uppercase">
             <Wind className="w-3 h-3 text-emerald-400" /> SpO2
           </div>
           <div className="text-xs font-black text-[var(--text-primary)]">{vitals.spo2} <span className="text-[9px] font-bold text-[var(--text-muted)]">%</span></div>
        </div>
        <div className="p-2 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-0.5">
           <div className="flex items-center gap-1.5 text-[8px] font-black text-[var(--text-secondary)] uppercase">
             <Thermometer className="w-3 h-3 text-amber-400" /> Temp
           </div>
           <div className="text-xs font-black text-[var(--text-primary)]">{vitals.temp} <span className="text-[9px] font-bold text-[var(--text-muted)]">Â°F</span></div>
        </div>
      </div>
    </div>
  );
}

