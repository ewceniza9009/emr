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

  const [activeHud, setActiveHud] = useState("nav");
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

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
      {/* Sector Logistics Map */}
      <div className="flex-1 bg-[var(--card-bg)] rounded-[2.5rem] border border-[var(--card-border)] shadow-2xl relative overflow-hidden group">
        {/* Schematic Map Base */}
        <div className="absolute inset-0 bg-[var(--background)] opacity-50" />
        <div className="absolute inset-0" style={{ 
          backgroundImage: `radial-gradient(var(--card-border) 1px, transparent 1px)`,
          backgroundSize: '30px 30px' 
        }} />

        {/* District Sectors */}
        <div className="absolute inset-0 p-10 grid grid-cols-2 grid-rows-2 gap-4 opacity-20 pointer-events-none">
          <div className="border border-[var(--card-border)] rounded-3xl flex items-start p-6"><span className="text-[40px] font-black text-[var(--card-border)] uppercase">North Sector</span></div>
          <div className="border border-[var(--card-border)] rounded-3xl flex items-start justify-end p-6"><span className="text-[40px] font-black text-[var(--card-border)] uppercase">East Sector</span></div>
          <div className="border border-[var(--card-border)] rounded-3xl flex items-end p-6"><span className="text-[40px] font-black text-[var(--card-border)] uppercase">West Sector</span></div>
          <div className="border border-[var(--card-border)] rounded-3xl flex items-end justify-end p-6"><span className="text-[40px] font-black text-[var(--card-border)] uppercase">South Sector</span></div>
        </div>

        {/* Simulated Road Network */}
        <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 1000 1000">
          <path d="M0 200 L1000 200 M0 500 L1000 500 M0 800 L1000 800 M200 0 L200 1000 M500 0 L500 1000 M800 0 L800 1000" stroke="var(--primary)" strokeWidth="2" fill="none" />
          <path d="M100 100 L300 400 L700 200 L900 800" stroke="var(--primary)" strokeWidth="4" fill="none" strokeDasharray="10 10" />
        </svg>

        {/* Facility Markers */}
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
              <Activity className="w-4 h-4" />
           </div>
           <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded">Central Hospital</span>
        </div>

        <div className="absolute bottom-1/3 right-1/4 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-500">
              <Activity className="w-4 h-4" />
           </div>
           <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded">Westside Clinic</span>
        </div>
        
        {/* Provider Avatars on Map */}
        <div className="absolute inset-0 pointer-events-none">
           {providers.map((p: any, i: number) => {
             // Semi-deterministic positioning based on ID
             const seed = p.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
             const top = 15 + (seed % 70);
             const left = 15 + ((seed * 1.3) % 70);
             
             return (
              <div key={p.id} 
                className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-[2000ms] pointer-events-auto
                  ${selectedProviderId === p.id ? 'z-50' : 'z-10'}`}
                style={{ top: `${top}%`, left: `${left}%` }}
                onClick={() => setSelectedProviderId(p.id)}
              >
                {/* Connection Line for Transit */}
                {p.status === 'In Transit' && (
                  <div className="absolute top-1/2 left-1/2 w-32 h-[1px] bg-gradient-to-r from-[var(--primary)] to-transparent origin-left -rotate-45 opacity-40" />
                )}

                {/* Avatar / Marker */}
                <div className={`relative group/marker cursor-pointer`}>
                  <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all shadow-2xl
                    ${selectedProviderId === p.id ? 'bg-white border-[var(--primary)] scale-125' : 
                      p.status === 'On Site' ? 'bg-emerald-500/10 border-emerald-500' : 
                      p.status === 'In Transit' ? 'bg-[var(--primary)]/10 border-[var(--primary)]' : 
                      'bg-slate-800 border-slate-700 opacity-60'}`}
                  >
                    <User className={`w-5 h-5 ${selectedProviderId === p.id ? 'text-[var(--primary)]' : 'text-current'}`} />
                  </div>
                  
                  {/* Tooltip Label */}
                  <div className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-2xl whitespace-nowrap transition-all
                    ${selectedProviderId === p.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover/marker:opacity-100 group-hover/marker:translate-y-0'}`}>
                    <p className="text-[10px] font-black uppercase tracking-tight">{p.name}</p>
                    <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase">{p.status} • {p.role}</p>
                  </div>

                  {/* Status Indicator Dot */}
                  <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[var(--card-bg)] shadow-lg
                    ${p.status === 'On Site' ? 'bg-emerald-500' : p.status === 'In Transit' ? 'bg-[var(--primary)] animate-pulse' : 'bg-slate-500'}`} />
                </div>
              </div>
             );
           })}
        </div>

        {/* Tactical HUD Overlay */}
        <div className="absolute inset-x-10 bottom-10 flex items-end justify-between">
          <div className="flex items-center gap-2 bg-[var(--card-bg)]/80 backdrop-blur-xl border border-[var(--card-border)] rounded-2xl p-2 shadow-2xl">
            <button 
              onClick={() => setActiveHud("nav")}
              className={`p-3 rounded-xl transition-all ${activeHud === "nav" ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary-glow)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
              <Navigation2 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setActiveHud("layers")}
              className={`p-3 rounded-xl transition-all ${activeHud === "layers" ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary-glow)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
              <Layers className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setActiveHud("activity")}
              className={`p-3 rounded-xl transition-all ${activeHud === "activity" ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary-glow)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
              <Activity className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col items-end gap-1 text-right">
             <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Live System Feed</span>
             </div>
             <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Last Sync: {new Date().toLocaleTimeString()}</p>
             <p className="text-[9px] font-black text-[var(--primary)] uppercase tracking-widest mt-1">Region: Metro North-East</p>
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
                <h2 className="text-sm font-black uppercase tracking-tighter">Clinical Dispatch</h2>
                <p className="text-[10px] font-black text-[var(--primary)] tracking-widest uppercase">Live Sector Logistics</p>
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
              <div key={p.id} 
                onClick={() => setSelectedProviderId(p.id)}
                className={`p-4 rounded-2xl border transition-all group cursor-pointer
                  ${selectedProviderId === p.id ? 'border-[var(--primary)] bg-[var(--primary)]/10 shadow-lg' : 'border-[var(--card-border)] bg-[var(--input-bg)]/50 hover:border-[var(--primary)]/30'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${selectedProviderId === p.id ? 'bg-[var(--primary)] text-white' : 'bg-[var(--primary)]/10 text-[var(--primary)]'}`}>
                      <User className="w-5 h-5" />
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
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProviderId(p.id);
                      }}
                      className="text-[9px] font-black text-[var(--primary)] uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                    >
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
