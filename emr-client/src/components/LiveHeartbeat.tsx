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
    <div className="space-y-4">
      <div className="glass-morphism rounded-3xl p-6 border border-[var(--card-border)] flex items-center justify-between group hover:border-red-500/30 transition-all">
         <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all 
              ${connected ? 'bg-red-500/10 text-red-400' : 'bg-[var(--input-bg)] text-[var(--text-muted)]'}`}>
               <Heart className={`w-6 h-6 ${pulse ? 'scale-125 animate-pulse' : ''}`} />
            </div>
            <div>
               <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-[var(--text-primary)] font-mono">{vitals.hr}</span>
                  <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest">BPM</span>
               </div>
               <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest flex items-center gap-1">
                  <Zap className={`w-3 h-3 ${connected ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`} />
                  {connected ? 'Live IoT Stream' : 'Disconnected'}
               </p>
            </div>
         </div>
         <div className="h-8 w-24 bg-red-500/5 rounded-lg relative overflow-hidden flex items-end px-1 gap-0.5">
            {[...Array(12)].map((_, i) => (
               <div 
                 key={i} 
                 className="flex-1 bg-red-400/20 rounded-t-sm animate-pulse" 
                 style={{ height: `${pulse ? Math.random() * 100 : 20}%`, animationDelay: `${i * 0.1}s` }} 
               />
            ))}
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1">
           <div className="flex items-center gap-2 text-[9px] font-bold text-[var(--text-secondary)] uppercase">
             <Wind className="w-3 h-3 text-emerald-400" /> SpO2
           </div>
           <div className="text-sm font-black text-[var(--text-primary)]">{vitals.spo2} <span className="text-[10px] font-normal text-[var(--text-muted)]">%</span></div>
        </div>
        <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] space-y-1">
           <div className="flex items-center gap-2 text-[9px] font-bold text-[var(--text-secondary)] uppercase">
             <Thermometer className="w-3 h-3 text-amber-400" /> Temp
           </div>
           <div className="text-sm font-black text-[var(--text-primary)]">{vitals.temp} <span className="text-[10px] font-normal text-[var(--text-muted)]">°F</span></div>
        </div>
      </div>
    </div>
  );
}
