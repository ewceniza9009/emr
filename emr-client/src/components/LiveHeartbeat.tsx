"use client";

import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { Activity, Heart, Zap } from "lucide-react";

export default function LiveHeartbeat({ patientId }: { patientId: string }) {
  const [bpm, setBpm] = useState(72);
  const [connected, setConnected] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:3431/hubs/telemetry")
      .withAutomaticReconnect()
      .build();

    const startConnection = async () => {
      try {
        await connection.start();
        setConnected(true);
        await connection.invoke("JoinPatientStream", patientId);
        
        // Simulation: Listen for heart rate updates
        connection.on("ReceiveHeartRate", (newBpm: number) => {
          setBpm(newBpm);
          setPulse(true);
          setTimeout(() => setPulse(false), 200);
        });

      } catch (err) {
        console.error("SignalR Connection Error: ", err);
      }
    };

    startConnection();

    // Demo Simulation: If no backend is pushing, we simulate locally
    const demoInterval = setInterval(() => {
        const variance = Math.floor(Math.random() * 5) - 2;
        setBpm(prev => prev + variance);
        setPulse(true);
        setTimeout(() => setPulse(false), 200);
    }, 1000);

    return () => {
      clearInterval(demoInterval);
      connection.stop();
    };
  }, [patientId]);

  return (
    <div className="glass-morphism rounded-3xl p-6 border border-white/5 flex items-center justify-between group hover:border-red-500/30 transition-all">
       <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all 
            ${connected ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-slate-600'}`}>
             <Heart className={`w-6 h-6 ${pulse ? 'scale-125 animate-pulse' : ''}`} />
          </div>
          <div>
             <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white font-mono">{bpm}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">BPM</span>
             </div>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                <Zap className={`w-3 h-3 ${connected ? 'text-emerald-400' : 'text-slate-600'}`} />
                {connected ? 'Live IoT Stream' : 'Disconnected'}
             </p>
          </div>
       </div>
       <div className="h-8 w-24 bg-red-500/5 rounded-lg relative overflow-hidden flex items-end px-1 gap-0.5">
          {[...Array(12)].map((_, i) => (
             <div 
               key={i} 
               className="flex-1 bg-red-400/20 rounded-t-sm animate-pulse" 
               style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }} 
             />
          ))}
       </div>
    </div>
  );
}
