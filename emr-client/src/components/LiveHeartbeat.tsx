"use client";

import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { Heart, Zap, Wind, Thermometer, Power } from "lucide-react";

interface LiveHeartbeatProps {
  patientId: string;
  enabled: boolean;
  onToggle: () => void;
  status: "off" | "initializing" | "live";
}

export default function LiveHeartbeat({ patientId, enabled, onToggle, status }: LiveHeartbeatProps) {
  const [vitals, setVitals] = useState({ hr: 72, spo2: "--", temp: "--" });
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setVitals({ hr: 72, spo2: "--", temp: "--" });
      return;
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(process.env.NEXT_PUBLIC_SIGNALR_ENDPOINT || "http://localhost:34732/hubs/telemetry")
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.None)
      .build();

    let mounted = true;

    const startConnection = async () => {
      try {
        await connection.start();
        if (!mounted) return;
        await connection.invoke("JoinPatientStream", patientId);

        connection.on("ReceiveVitals", (data: any) => {
          if (!mounted) return;
          setVitals({
            hr: data.heartRate,
            spo2: data.spO2.toString(),
            temp: data.temperature.toString()
          });
          setPulse(true);
          setTimeout(() => setPulse(false), 200);
        });

      } catch (err) {
        // Silent — will retry via withAutomaticReconnect
      }
    };

    startConnection();

    return () => {
      mounted = false;
      connection.stop();
    };
  }, [patientId, enabled]);

  const isLive = status === "live";
  const isInitializing = status === "initializing";

  return (
    <div className="space-y-2">
      {/* Heart Rate + Toggle Row */}
      <div className="glass-morphism rounded-2xl p-3 border border-[var(--card-border)] transition-all">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all 
                ${isLive ? 'bg-red-500/10 text-red-400' : 'bg-[var(--input-bg)] text-[var(--text-muted)]'}`}>
              <Heart className={`w-4 h-4 ${pulse ? 'scale-125 animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-lg font-black text-[var(--text-primary)] font-mono">{vitals.hr}</span>
                <span className="text-[9px] text-[var(--text-secondary)] font-black uppercase tracking-widest">BPM</span>
              </div>
              <p className="text-[8px] text-[var(--text-muted)] font-black uppercase tracking-widest flex items-center gap-1">
                <Zap className={`w-2.5 h-2.5 ${isLive ? 'text-emerald-400' : isInitializing ? 'text-amber-400' : 'text-[var(--text-muted)]'}`} />
                {isLive ? 'LIVE IOT STREAM' : isInitializing ? 'CONNECTING...' : 'TELEMETRY OFF'}
              </p>
            </div>
          </div>

          {/* THE TOGGLE */}
          <button
            type="button"
            onClick={onToggle}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              enabled
                ? isLive 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]" 
                  : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 animate-pulse"
                : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:border-emerald-500/30 hover:text-emerald-400"
            }`}
            title={enabled ? "Disconnect Telemetry" : "Initialize Telemetry Link"}
          >
            <Power className="w-4 h-4" />
          </button>
        </div>

        {/* Mini Waveform */}
        <div className="h-5 w-full bg-red-500/5 rounded-lg relative overflow-hidden flex items-end px-1 gap-0.5 mt-1">
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              className={`flex-1 rounded-t-sm transition-all duration-300 ${isLive ? 'bg-red-400/30' : 'bg-[var(--text-muted)]/10'}`}
              style={{ height: `${isLive && pulse ? Math.random() * 100 : 15}%`, animationDelay: `${i * 0.05}s` }}
            />
          ))}
        </div>
      </div>

      {/* SpO2 + Temp */}
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
          <div className="text-xs font-black text-[var(--text-primary)]">{vitals.temp} <span className="text-[9px] font-bold text-[var(--text-muted)]">°F</span></div>
        </div>
      </div>
    </div>
  );
}
