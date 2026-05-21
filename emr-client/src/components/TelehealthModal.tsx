"use client";

import React, { useState, useEffect } from "react";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  ShieldCheck, 
  Activity, 
  Send, 
  User,
  Monitor,
  Heart,
  Wifi
} from "lucide-react";
import HalcyonPortal from "./Portal";

interface TelehealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
}

export default function TelehealthModal({ isOpen, onClose, patientName }: TelehealthModalProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [simulatedHeartRate, setSimulatedHeartRate] = useState(72);
  const [simulatedRespRate, setSimulatedRespRate] = useState(16);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: "System", text: "Secure End-to-End Tunnel Initialized.", time: "Now" }
  ]);
  const [newMsg, setNewMsg] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setIsConnected(false);
      return;
    }
    // Simulate connection lag
    const timer = setTimeout(() => {
      setIsConnected(true);
      setChatMessages(prev => [
        ...prev,
        { sender: patientName, text: "Hello doctor, thank you for jumping on so quickly. I'm feeling a bit short of breath.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    }, 1200);

    // Simulate fluctuating telemetry
    const telemetryInterval = setInterval(() => {
      setSimulatedHeartRate(prev => {
        const diff = Math.random() > 0.5 ? 1 : -1;
        const nextVal = prev + diff;
        return nextVal > 95 ? 95 : nextVal < 68 ? 68 : nextVal;
      });
      setSimulatedRespRate(prev => {
        const diff = Math.random() > 0.6 ? 1 : (Math.random() > 0.5 ? -1 : 0);
        const nextVal = prev + diff;
        return nextVal > 22 ? 22 : nextVal < 14 ? 14 : nextVal;
      });
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearInterval(telemetryInterval);
    };
  }, [isOpen, patientName]);

  if (!isOpen) return null;

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, { sender: "You (Clinician)", text: newMsg, time }]);
    setNewMsg("");

    // Simulate patient reply
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { sender: patientName, text: "I'll try sitting upright with the cool fan like you suggested.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    }, 1500);
  };

  return (
    <HalcyonPortal>
      {/* Standalone styles for custom premium UI animations */}
      <style>{`
        @keyframes ekg-draw {
          0% { stroke-dashoffset: 120; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-ekg-line {
          stroke-dasharray: 120;
          stroke-dashoffset: 120;
          animation: ekg-draw 2s linear infinite;
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        .animate-pulse-ring {
          animation: pulse-ring 3s ease-in-out infinite;
        }
      `}</style>

      <div className="fixed inset-0 !m-0 z-[99999999] flex items-center justify-center p-4 overflow-hidden">
        {/* Modal Backdrop with Adaptive Blurring */}
        <div 
          className="absolute inset-0 bg-slate-950/50 dark:bg-slate-950/70 light:bg-slate-900/30 backdrop-blur-md animate-in fade-in duration-300" 
          onClick={onClose} 
        />

        {/* Premium Telehealth Main Container */}
        <div className="relative w-full max-w-5xl h-[85vh] flex flex-col bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2rem] shadow-[0_50px_100px_rgba(0,0,0,0.3)] dark:shadow-[0_50px_100px_rgba(0,0,0,0.6)] overflow-hidden animate-in zoom-in-95 duration-300">
          
          {/* Header Dashboard */}
          <div className="bg-[var(--card-bg)] px-6 py-4 border-b border-[var(--card-border)] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </div>
              <span className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest">
                Live Telehealth Session
              </span>
              <span className="text-[var(--card-border)]">|</span>
              <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-tight">
                {patientName}
              </span>
              <span className="text-[var(--card-border)]">|</span>
              
              {/* Prominent MOCKED banner */}
              <span className="text-[9px] font-black text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md uppercase tracking-widest animate-pulse">
                Simulated Sandbox Feed (Mocked)
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black text-[var(--primary)] bg-[var(--primary-glow)] border border-[var(--primary)]/20 px-3 py-1 rounded-full uppercase tracking-wider">
                Latency: 14ms
              </span>
            </div>
          </div>

          {/* Workspace Area */}
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
            
            {/* Left Column: Video Feed & Telemetry HUD */}
            <div className="flex-1 bg-slate-950 relative flex items-center justify-center p-4">
              
              {!isConnected ? (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-full border-4 border-t-[var(--primary)] border-r-[var(--primary)] border-b-transparent border-l-transparent animate-spin" />
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                    Establishing Secure Peer Link...
                  </p>
                </div>
              ) : (
                <div className="w-full h-full relative rounded-2xl overflow-hidden border border-white/5 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                  
                  {/* Cyberpunk/Clinical HUD Corner brackets */}
                  <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-[var(--primary)]/30 pointer-events-none" />
                  <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-[var(--primary)]/30 pointer-events-none" />
                  <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-[var(--primary)]/30 pointer-events-none" />
                  <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-[var(--primary)]/30 pointer-events-none" />

                  {/* Scanline Grid Overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[size:100%_4px,6px_100%] pointer-events-none opacity-25" />

                  {/* Top-Right Signal strength & specs HUD */}
                  <div className="absolute top-6 right-6 flex items-center gap-2.5 bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl text-[9px] font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      1080P HD
                    </span>
                    <span className="text-white/20">|</span>
                    <span>60 FPS</span>
                    <span className="text-white/20">|</span>
                    <span className="flex items-end gap-0.5 h-2.5">
                      <span className="w-0.5 h-1.5 bg-emerald-500 rounded-sm" />
                      <span className="w-0.5 h-2 bg-emerald-500 rounded-sm" />
                      <span className="w-0.5 h-2.5 bg-emerald-500 rounded-sm" />
                      <span className="w-0.5 h-3 bg-emerald-500 rounded-sm" />
                    </span>
                  </div>

                  {/* Remote Patient Video Feed Mock */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isVideoOff ? (
                      <div className="w-24 h-24 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 shadow-2xl">
                        <VideoOff className="w-10 h-10" />
                      </div>
                    ) : (
                      <div className="relative w-full h-full flex flex-col items-center justify-center">
                        
                        {/* Floating glass telemetry card */}
                        <div className="absolute top-6 left-6 p-4 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 space-y-3.5 shadow-2xl z-10 min-w-[170px]">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-white/10 pb-1">
                            Patient Telemetry
                          </p>
                          
                          {/* Heart Rate and ECG line */}
                          <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5">
                              <span className="text-[8px] font-black text-red-400 uppercase tracking-wider flex items-center gap-1">
                                <Activity className="w-3 h-3 text-red-500 animate-pulse" /> Heart Rate
                              </span>
                              <div className="text-base font-black text-white leading-none">
                                {simulatedHeartRate} <span className="text-[8px] text-slate-400">BPM</span>
                              </div>
                            </div>
                            
                            {/* Simulated active ECG waveform path */}
                            <svg className="w-16 h-7 text-red-500 opacity-80" viewBox="0 0 60 20" fill="none">
                              <path
                                d="M0,10 L15,10 L18,2 L21,18 L24,10 L30,10 L32,6 L34,14 L36,10 L60,10"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="animate-ekg-line"
                              />
                            </svg>
                          </div>

                          {/* Oxygen level SpO2 */}
                          <div className="flex items-center justify-between gap-4 pt-1">
                            <div className="space-y-0.5">
                              <span className="text-[8px] font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                                <Heart className="w-3 h-3 text-cyan-400" /> SpO2 Level
                              </span>
                              <div className="text-base font-black text-white leading-none">
                                96% <span className="text-[8px] text-slate-400">Stable</span>
                              </div>
                            </div>
                            <div className="w-10 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-cyan-400 rounded-full w-[96%]" />
                            </div>
                          </div>

                          {/* Respiratory Rate */}
                          <div className="pt-1 border-t border-white/5">
                            <div className="space-y-0.5">
                              <span className="text-[8px] font-black text-indigo-400 uppercase tracking-wider">
                                Resp. Rate
                              </span>
                              <div className="text-xs font-black text-white leading-none">
                                {simulatedRespRate} <span className="text-[8px] text-slate-400">BrPM</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Centered Hologram Patient Graphic */}
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-32 h-32 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/30 flex items-center justify-center text-[var(--primary)] shadow-2xl relative animate-pulse-ring">
                            <div className="absolute -inset-2 rounded-full border border-[var(--primary)]/20 animate-ping opacity-30 duration-2000" />
                            <div className="absolute -inset-4 rounded-full border border-[var(--primary)]/5 opacity-10 animate-pulse" />
                            <User className="w-14 h-14" />
                          </div>
                          <div className="text-center space-y-1">
                            <p className="text-sm font-black text-white uppercase tracking-tight">
                              {patientName}
                            </p>
                            <p className="text-[9px] font-black text-[var(--primary)] uppercase tracking-widest animate-pulse">
                              Streaming Home Telehealth Feed...
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Clinician PIP (Picture-In-Picture) Float */}
                  <div className="absolute bottom-6 right-6 w-40 h-28 rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-md overflow-hidden shadow-2xl z-10 flex items-center justify-center transition-all duration-300 hover:scale-105 group/pip">
                    {isMuted ? (
                      <div className="text-rose-500 flex flex-col items-center gap-1.5">
                        <MicOff className="w-4 h-4 animate-bounce" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Muted</span>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-slate-900/40 flex flex-col items-center justify-center gap-2 text-[var(--primary)]">
                        <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20 shadow-md">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                          Clinician (You)
                        </span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[8px] font-bold text-white uppercase tracking-wider border border-white/5">
                      PIP VIEW
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Integrated Consultation Chat */}
            <div className="w-full lg:w-80 bg-[var(--card-bg)] border-l border-[var(--card-border)] flex flex-col">
              
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-[var(--card-border)] shrink-0 flex items-center justify-between">
                <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">
                  Consultation Feed
                </h3>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]"></span>
                </span>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {chatMessages.map((m, idx) => (
                  <div key={idx} className={`space-y-1.5 ${m.sender === "You (Clinician)" ? "text-right" : ""}`}>
                    <div className="flex items-center justify-between gap-2 px-1">
                      <span className="text-[9px] font-black text-[var(--primary)] uppercase tracking-widest">
                        {m.sender}
                      </span>
                      <span className="text-[8px] text-[var(--text-muted)] font-bold">
                        {m.time}
                      </span>
                    </div>
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed inline-block max-w-[90%] text-left font-medium shadow-sm transition-all duration-300 ${
                      m.sender === "You (Clinician)" 
                        ? "bg-gradient-to-tr from-[var(--primary)] to-cyan-500 dark:to-cyan-600 text-white rounded-tr-none" 
                        : m.sender === "System" 
                        ? "bg-[var(--background)] text-[var(--text-muted)] text-center w-full rounded-lg font-mono text-[9px] tracking-wider uppercase border border-[var(--card-border)]"
                        : "bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] rounded-tl-none"
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input Section */}
              <form onSubmit={handleSendChat} className="p-4 border-t border-[var(--card-border)] shrink-0 flex gap-2">
                <input 
                  type="text"
                  placeholder="Type a clinical instruction..."
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  className="flex-1 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)]/50 font-medium outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                />
                <button 
                  type="submit"
                  className="p-2.5 rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] hover:scale-105 active:scale-95 transition-all shadow-md shadow-[var(--primary)]/10 flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Bottom Control Bar */}
          <div className="bg-[var(--background)] px-6 py-5 border-t border-[var(--card-border)] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3.5 rounded-2xl transition-all active:scale-95 border flex items-center justify-center ${
                  isMuted 
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]" 
                    : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]"
                }`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button 
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`p-3.5 rounded-2xl transition-all active:scale-95 border flex items-center justify-center ${
                  isVideoOff 
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]" 
                    : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]"
                }`}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              <button 
                className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)] transition-all active:scale-95 flex items-center justify-center"
              >
                <Monitor className="w-5 h-5" />
              </button>
            </div>

            <div>
              <button 
                onClick={onClose}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-rose-600/20"
              >
                <PhoneOff className="w-4 h-4" /> End Consultation
              </button>
            </div>
          </div>

        </div>
      </div>
    </HalcyonPortal>
  );
}
