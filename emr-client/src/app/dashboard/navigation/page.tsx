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
      <div className="flex-1 bg-[var(--card-bg)] rounded-[2.5rem] border border-[var(--card-border)] shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-[#0f172a] opacity-50 pattern-grid" />
        
        {/* Simulated Map UI */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-full h-full">
             {/* Radial Pulses for Real Providers */}
             {providers.slice(0, 5).map((p: any, i: number) => (
               <div key={p.id} 
                 className={`absolute w-4 h-4 rounded-full animate-pulse`}
                 style={{ 
                   top: `${20 + (i * 15)}%`, 
                   left: `${30 + (i * 10)}%`,
                   backgroundColor: p.status === 'On Site' ? '#10b981' : p.status === 'In Transit' ? 'var(--primary)' : '#94a3b8',
                   boxShadow: `0 0 20px ${p.status === 'On Site' ? 'rgba(16,185,129,0.5)' : 'var(--primary-glow)'}`
                 }} 
               />
             ))}
          </div>
        </div>

        {/* Map Controls */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[var(--sidebar-bg)]/80 backdrop-blur-xl border border-[var(--card-border)] rounded-2xl p-2 shadow-2xl">
          <button className="p-3 bg-[var(--primary)] text-white rounded-xl shadow-lg shadow-[var(--primary-glow)]"><Navigation2 className="w-5 h-5" /></button>
          <button className="p-3 text-[var(--text-muted)] hover:text-[var(--text-primary)]"><Layers className="w-5 h-5" /></button>
          <button className="p-3 text-[var(--text-muted)] hover:text-[var(--text-primary)]"><Activity className="w-5 h-5" /></button>
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
