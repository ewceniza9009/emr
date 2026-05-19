"use client";
import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { Heart, Zap, Wind, Thermometer, Power } from "lucide-react";
import { PermissionGate } from "./PermissionGate";

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
        // Silent — will retry via reconnect
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

  // ECG Heartbeat wave path (P-Q-R-S-T sequence)
  const ecgPath = "M 0 10 L 20 10 Q 22 7 24 10 T 26 10 L 28 12 L 31 1 L 34 19 L 36 10 L 39 10 Q 43 6 47 10 T 51 10 L 100 10";

  return (
    <div className="space-y-2">
      {/* Stylesheet injection for ECG Sweep animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes ecg-sweep-${patientId} {
          0% {
            stroke-dashoffset: 200;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        .ecg-trace-${patientId} {
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation: ecg-sweep-${patientId} 2.5s linear infinite;
        }
      `}} />

      {/* Main Cardiac Monitor Pane */}
      <div className={`p-3 rounded-xl border transition-all duration-500 relative overflow-hidden ${
        isLive 
          ? "bg-rose-500/[0.02] border-rose-500/20 shadow-[0_0_20px_rgba(239,68,68,0.03)]" 
          : isInitializing
            ? "bg-amber-500/[0.02] border-amber-500/20 animate-pulse"
            : "bg-[var(--input-bg)]/20 border-[var(--card-border)]"
      }`}>
        {/* Glow backdrop grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(var(--primary-rgb),0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--primary-rgb),0.01)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />

        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-2.5">
            {/* Heart Icon Container with pulse animation */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 border ${
              isLive 
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]' 
                : 'bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-muted)]'
            }`}>
              <Heart className={`w-4 h-4 transition-transform duration-100 ${isLive && pulse ? 'scale-125 text-rose-450' : ''}`} />
            </div>
            
            <div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-xl font-black text-[var(--text-primary)] tracking-tighter font-mono leading-none">{vitals.hr}</span>
                <span className="text-[7.5px] text-[var(--text-secondary)] font-black uppercase tracking-widest">BPM</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <div className={`w-1 h-1 rounded-full ${isLive ? 'bg-rose-500 animate-ping' : isInitializing ? 'bg-amber-500 animate-pulse' : 'bg-[var(--text-muted)]'}`} />
                <span className="text-[7px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-0.5">
                  <Zap className={`w-2 h-2 ${isLive ? 'text-rose-500' : isInitializing ? 'text-amber-500' : 'text-[var(--text-muted)]'}`} />
                  {isLive ? 'Live' : isInitializing ? 'Connecting' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* THE TOGGLE */}
          <PermissionGate permission="clinical:order">
            <button
              type="button"
              onClick={onToggle}
              className={`w-9 h-9 rounded-xl border transition-all flex items-center justify-center p-0 cursor-pointer active:scale-90 ${
                enabled
                  ? isLive 
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]" 
                    : "bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20 animate-pulse"
                  : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:border-rose-500/30 hover:text-rose-500 hover:bg-rose-500/5"
              }`}
              title={enabled ? "Disconnect Telemetry" : "Initialize Telemetry Link"}
            >
              <Power className="w-4 h-4 shrink-0" />
            </button>
          </PermissionGate>
        </div>

        {/* Realistic ECG Waveform SVG */}
        <div className="h-6.5 w-full bg-[var(--input-bg)]/40 border border-[var(--card-border)] rounded-lg relative overflow-hidden flex items-center px-1.5 mt-1.5">
          {/* Waveform Trace */}
          <svg className="w-full h-full text-[var(--text-muted)]" viewBox="0 0 100 20" preserveAspectRatio="none">
            {/* Background static line */}
            <path
              d={ecgPath}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.75"
              opacity="0.1"
            />
            {/* Active animated ECG line */}
            <path
              d={ecgPath}
              fill="none"
              stroke={isLive ? "#f43f5e" : "currentColor"}
              strokeWidth={isLive ? "1.5" : "0.75"}
              className={isLive ? `ecg-trace-${patientId}` : "opacity-20"}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Auxiliary Vitals Panels (SpO2 & Temp) */}
      <div className="grid grid-cols-2 gap-2">
        {/* Oxygen Level */}
        <div className="p-2 rounded-xl bg-[var(--input-bg)]/20 border border-[var(--card-border)] hover:border-[var(--text-muted)]/20 transition-all space-y-0.5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-[7px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
            <span className="flex items-center gap-1"><Wind className="w-3 h-3 text-emerald-555" /> SpO2</span>
            {isLive && <span className="text-[6.5px] text-emerald-500 font-bold uppercase tracking-wider">Live</span>}
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-base font-black text-[var(--text-primary)] font-mono leading-none">{vitals.spo2}</span>
            {vitals.spo2 !== "--" && <span className="text-[8px] font-bold text-[var(--text-muted)]">%</span>}
          </div>
          {/* Micro chart indicator */}
          <div className="h-0.5 w-full bg-[var(--input-bg)] rounded-full overflow-hidden mt-1">
            <div 
              className={`h-full bg-emerald-500 transition-all duration-1000 ${isLive ? 'w-[98%]' : 'w-0'}`} 
            />
          </div>
        </div>

        {/* Body Temperature */}
        <div className="p-2 rounded-xl bg-[var(--input-bg)]/20 border border-[var(--card-border)] hover:border-[var(--text-muted)]/20 transition-all space-y-0.5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-[7px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
            <span className="flex items-center gap-1"><Thermometer className="w-3 h-3 text-amber-555" /> Temp</span>
            {isLive && <span className="text-[6.5px] text-amber-500 font-bold uppercase tracking-wider">Live</span>}
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="text-base font-black text-[var(--text-primary)] font-mono leading-none">{vitals.temp}</span>
            {vitals.temp !== "--" && <span className="text-[8px] font-bold text-[var(--text-muted)]">°F</span>}
          </div>
          {/* Micro chart indicator */}
          <div className="h-0.5 w-full bg-[var(--input-bg)] rounded-full overflow-hidden mt-1">
            <div 
              className={`h-full bg-amber-500 transition-all duration-1000 ${isLive ? 'w-[85%]' : 'w-0'}`} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
