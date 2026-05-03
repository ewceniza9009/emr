"use client";

import { useState } from "react";
import { useQuery, gql } from "@apollo/client";
import { 
  Navigation2, 
  MapPin, 
  User, 
  Clock, 
  Car, 
  Search,
  Activity,
  Layers,
  ChevronRight,
  MoreVertical,
  Loader2
} from "lucide-react";

const GET_NAVIGATION_DATA = gql`
  query GetNavigationData {
    practitioners {
      practitionerId
      firstName
      lastName
      position
    }
    appointments {
      appointmentId
      status
      practitionerId
      scheduledStart
      scheduledEnd
    }
  }
`;

export default function CareNavigationPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data, loading, error } = useQuery(GET_NAVIGATION_DATA);

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin" />
    </div>
  );

  const practitioners = data?.practitioners || [];
  const appointments = data?.appointments || [];

  // Map real practitioners to the UI state
  const providers = practitioners.map((p: any) => {
    const activeAppt = appointments.find((a: any) => a.practitionerId === p.practitionerId && a.status === 'IN_PROGRESS');
    const upcomingAppt = appointments.find((a: any) => a.practitionerId === p.practitionerId && a.status === 'SCHEDULED');
    
    return {
      id: p.practitionerId,
      name: `${p.firstName} ${p.lastName}`,
      role: p.position === 'nurse' ? 'Care Navigator' : 'Supporting Clinician',
      location: activeAppt ? "Sector Active" : "Stationary",
      status: activeAppt ? "On Site" : upcomingAppt ? "In Transit" : "Idle",
      eta: upcomingAppt ? "15m" : "--",
      battery: Math.floor(Math.random() * 60) + 40, // Simulated battery for now as it's not in DB
    };
  }).filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex h-full gap-4 overflow-hidden animate-in fade-in duration-700">
      {/* Map Placeholder Area */}
      {/* Tactical Geospatial Radar Grid */}
      <div className="flex-1 bg-slate-950 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
        {/* Vector Grid Layer */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)]" />
        <div className="absolute inset-0" style={{ 
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), 
                            linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)`,
          backgroundSize: '40px 40px' 
        }} />
        <div className="absolute inset-0" style={{ 
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), 
                            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '200px 200px' 
        }} />

        {/* Sector Boundaries */}
        <div className="absolute inset-0 border-[0.5px] border-white/[0.03] pointer-events-none">
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/[0.05] shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/[0.05] shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-[400px] h-[400px] border border-white/[0.03] rounded-full" />
            <div className="w-[800px] h-[800px] border border-white/[0.02] rounded-full" />
          </div>
        </div>

        {/* Sonar Sweep Animation */}
        <div className="absolute top-1/2 left-1/2 w-[1000px] h-[1000px] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(16,185,129,0.1)_360deg)] animate-[spin_10s_linear_infinite]" />
        </div>
        
        {/* Tactical Provider Signals */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-full h-full">
             {providers.map((p: any, i: number) => {
               const angle = (i * (360 / providers.length)) * (Math.PI / 180);
               const radius = 20 + (i * 5); // Varying distances
               const top = 50 + Math.sin(angle) * radius;
               const left = 50 + Math.cos(angle) * radius;
               
               return (
                <div key={p.id} 
                  className="absolute -translate-x-1/2 -translate-y-1/2 group/sig"
                  style={{ top: `${top}%`, left: `${left}%` }}
                >
                  {/* Signal Pulse */}
                  <div className={`absolute -inset-4 rounded-full animate-ping opacity-20
                    ${p.status === 'On Site' ? 'bg-emerald-500' : p.status === 'In Transit' ? 'bg-[var(--primary)]' : 'bg-slate-500'}`} />
                  
                  {/* Signal Blip */}
                  <div className={`w-3 h-3 rounded-full relative shadow-lg transition-transform hover:scale-150 cursor-pointer pointer-events-auto
                    ${p.status === 'On Site' ? 'bg-emerald-500 shadow-emerald-500/50' : 
                      p.status === 'In Transit' ? 'bg-[var(--primary)] shadow-[var(--primary-glow)]' : 
                      'bg-slate-700 shadow-black'}`}
                  >
                    {/* Direction Vector for Motion */}
                    {p.status === 'In Transit' && (
                      <div className="absolute top-1/2 left-full w-8 h-[2px] bg-gradient-to-r from-[var(--primary)] to-transparent origin-left rotate-45" />
                    )}
                  </div>

                  {/* Signal Label (Visible on Hover) */}
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 backdrop-blur-md px-2 py-1 rounded border border-white/10 opacity-0 group-hover/sig:opacity-100 transition-opacity">
                    <p className="text-[7px] font-black text-white uppercase tracking-tighter">{p.name}</p>
                  </div>
                </div>
               );
             })}
          </div>
        </div>

        {/* Tactical HUD Overlay */}
        <div className="absolute inset-x-10 bottom-10 flex items-end justify-between">
          <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-xl border border-white/5 rounded-2xl p-2 shadow-2xl">
            <button className="p-3 bg-[var(--primary)] text-white rounded-xl shadow-lg shadow-[var(--primary-glow)]"><Navigation2 className="w-5 h-5" /></button>
            <button className="p-3 text-slate-500 hover:text-white transition-colors"><Layers className="w-5 h-5" /></button>
            <button className="p-3 text-slate-500 hover:text-white transition-colors"><Activity className="w-5 h-5" /></button>
          </div>

          <div className="flex flex-col items-end gap-2 text-right">
             <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Live Engine Feed</span>
             </div>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Coord: 40.7128° N, 74.0060° W</p>
          </div>
        </div>

        {/* Overlay Stats */}
        <div className="absolute top-10 left-10 space-y-4">
          <div className="bg-[var(--sidebar-bg)]/80 backdrop-blur-xl border border-[var(--card-border)] rounded-[2rem] p-6 shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-xl flex items-center justify-center">
                <Navigation2 className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-tighter">Geospatial Ops</h2>
                <p className="text-[10px] font-black text-[var(--primary)] tracking-widest uppercase">Live Sector Tracking</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Active Providers</p>
                <p className="text-2xl font-black">{providers.length}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">In Motion</p>
                <p className="text-2xl font-black text-emerald-500">{providers.filter((p: any) => p.status !== 'Idle').length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Sidebar */}
      <div className="w-96 flex flex-col gap-4 overflow-hidden">
        <div className="bg-[var(--card-bg)] rounded-[2rem] border border-[var(--card-border)] shadow-xl p-6 flex flex-col gap-6 overflow-hidden h-full">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH PROVIDERS..."
              className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-12 pr-4 text-xs font-black placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all uppercase"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
            {providers.map((p: any) => (
              <div key={p.id} className="p-4 rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)]/50 hover:border-[var(--primary)]/30 transition-all group cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase">{p.name}</h4>
                      <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{p.role}</p>
                    </div>
                  </div>
                  <MoreVertical className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Car className={`w-3.5 h-3.5 ${p.status === 'Idle' ? 'text-[var(--text-muted)]' : 'text-[var(--primary)]'}`} />
                    <span className="text-[10px] font-black">{p.status}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] font-black text-emerald-500">{p.eta}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[var(--card-border)] flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[var(--card-border)] rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${p.battery < 20 ? 'bg-rose-500' : 'bg-[var(--primary)]'}`}
                          style={{ width: `${p.battery}%` }}
                        />
                      </div>
                      <span className="text-[8px] font-black text-[var(--text-muted)]">{p.battery}%</span>
                   </div>
                   <button className="text-[9px] font-black text-[var(--primary)] uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                     Track <ChevronRight className="w-3 h-3" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
