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
  Heart
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
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: "System", text: "Secure End-to-End WebRTC Tunnel Initialized.", time: "Now" }
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

    // Simulate fluctuating heart rate
    const hrInterval = setInterval(() => {
      setSimulatedHeartRate(prev => {
        const diff = Math.random() > 0.5 ? 1 : -1;
        const nextVal = prev + diff;
        return nextVal > 95 ? 95 : nextVal < 68 ? 68 : nextVal;
      });
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearInterval(hrInterval);
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
      <div className="fixed inset-0 !m-0 z-[99999999] flex items-center justify-center p-4 overflow-hidden">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />

        <div className="relative w-full max-w-5xl h-[85vh] flex flex-col bg-slate-900 border border-slate-800 rounded-[2rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-300">
          
          {/* Header */}
          <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Telehealth Session</span>
              <span className="text-slate-600">|</span>
              <span className="text-xs font-bold text-white uppercase tracking-tight">{patientName}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> WebRTC Secure (AES-256)
              </span>
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-800/40 px-3 py-1 rounded-full uppercase tracking-wider">
                Latency: 14ms
              </span>
            </div>
          </div>

          {/* Main Workspace */}
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
            
            {/* Left: Video Canvas Area */}
            <div className="flex-1 bg-slate-950 relative flex items-center justify-center p-4">
              
              {!isConnected ? (
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-full border-4 border-t-emerald-500 border-r-emerald-500 border-b-transparent border-l-transparent animate-spin" />
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">Establishing Peer-to-Peer Link...</p>
                </div>
              ) : (
                <div className="w-full h-full relative rounded-2xl overflow-hidden border border-slate-800 bg-gradient-to-tr from-slate-950 to-slate-900 flex items-center justify-center">
                  
                  {/* Remote Patient Stream Visual Mock */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isVideoOff ? (
                      <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                        <VideoOff className="w-10 h-10" />
                      </div>
                    ) : (
                      <div className="relative w-full h-full flex flex-col items-center justify-center">
                        {/* Beautiful premium grid overlay representing patient view */}
                        <div className="absolute top-6 left-6 p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/5 space-y-2">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Patient Telemetry</p>
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-red-500 animate-pulse" />
                            <span className="text-sm font-black text-white">{simulatedHeartRate} <span className="text-[9px] text-slate-400">BPM</span></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-cyan-400" />
                            <span className="text-sm font-black text-white">96% <span className="text-[9px] text-slate-400">SpO2</span></span>
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-4">
                          <div className="w-28 h-28 rounded-full bg-indigo-500/10 border-4 border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-2xl relative">
                            <div className="absolute -inset-2 rounded-full border border-indigo-500/10 animate-ping opacity-60" />
                            <User className="w-12 h-12" />
                          </div>
                          <div className="text-center space-y-1">
                            <p className="text-sm font-black text-white uppercase tracking-tight">{patientName}</p>
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Streaming Home Telehealth Feed...</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Local Inset Camera View */}
                  <div className="absolute bottom-6 right-6 w-40 h-28 rounded-xl border border-slate-700 bg-slate-900 overflow-hidden shadow-2xl z-10 flex items-center justify-center">
                    {isMuted ? (
                      <div className="text-slate-500 flex flex-col items-center gap-1">
                        <MicOff className="w-4 h-4" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Muted</span>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center gap-2 text-indigo-400">
                        <User className="w-8 h-8" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Clinician (You)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Integrated Medical Consultation Chat & Control */}
            <div className="w-full lg:w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
              
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-slate-800 shrink-0">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Consultation Feed</h3>
              </div>

              {/* Chat Stream */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {chatMessages.map((m, idx) => (
                  <div key={idx} className={`space-y-1 ${m.sender === "You (Clinician)" ? "text-right" : ""}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{m.sender}</span>
                      <span className="text-[8px] text-slate-500 font-bold">{m.time}</span>
                    </div>
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed inline-block max-w-[90%] text-left font-medium ${
                      m.sender === "You (Clinician)" 
                        ? "bg-indigo-600 text-white rounded-tr-none" 
                        : m.sender === "System" 
                        ? "bg-slate-950 text-slate-400 text-center w-full rounded-lg font-mono text-[9px] tracking-wider uppercase border border-slate-800"
                        : "bg-slate-850 text-slate-200 rounded-tl-none border border-slate-800"
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="p-4 border-t border-slate-800 shrink-0 flex gap-2">
                <input 
                  type="text"
                  placeholder="Type a clinical instruction..."
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-600 font-medium outline-none focus:border-indigo-500 transition-all"
                />
                <button 
                  type="submit"
                  className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Controls Footer */}
          <div className="bg-slate-950 px-6 py-5 border-t border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3.5 rounded-2xl transition-all active:scale-95 border ${
                  isMuted 
                    ? "bg-red-500/10 border-red-500/20 text-red-500" 
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                }`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button 
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`p-3.5 rounded-2xl transition-all active:scale-95 border ${
                  isVideoOff 
                    ? "bg-red-500/10 border-red-500/20 text-red-500" 
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                }`}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              <button 
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all active:scale-95"
              >
                <Monitor className="w-5 h-5" />
              </button>
            </div>

            <div>
              <button 
                onClick={onClose}
                className="px-8 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-rose-600/20"
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
