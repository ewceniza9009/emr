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
  Building2,
  Users,
  Loader2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
 
const InteractiveMap = dynamic(() => import("@/components/Map"), { 
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-[2.5rem]" />
});
 
const GET_NAVIGATION_DATA = gql`
  query GetNavigationData {
    practitioners {
      practitionerId
      firstName
      lastName
      position
      isCareNavigator
      isSupportingClinician
      addresses {
        address {
          street
          city
          latitude
          longitude
        }
      }
    }
    facilities {
      facilityId
      name
      type
      contactPerson
      contactPhone
      facilityAddress {
        street
        city
        latitude
        longitude
      }
      residents {
        patientId
      }
    }
    appointments {
      items {
        appointmentId
        status
        practitionerId
        scheduledStart
        scheduledEnd
      }
    }
  }
`;
 
export default function CareNavigationPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"navigators" | "facilities">("navigators");
  const { data, loading, error } = useQuery(GET_NAVIGATION_DATA);
 
  const [activeHud, setActiveHud] = useState("nav");
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
 
  if (loading) return (
    <div className="flex h-[calc(100vh-100px)] gap-4 overflow-hidden p-1 animate-in fade-in duration-700">
      <div className="flex-1 relative">
        <Skeleton className="h-full w-full rounded-[2.5rem]" />
        <div className="absolute top-10 left-10 w-80">
          <Skeleton className="h-40 w-full rounded-[2rem]" />
        </div>
      </div>
      <div className="w-96 space-y-4">
        <Skeleton className="h-20 w-full rounded-[2rem]" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
        </div>
      </div>
    </div>
  );

  const practitioners = data?.practitioners || [];
  const facilitiesRaw = data?.facilities || [];
  const appointments = data?.appointments?.items || [];

  // Map real Care Navigators to the UI state
  const providers = practitioners
    .filter((p: any) => p.isCareNavigator)
    .map((p: any) => {
      const activeAppt = appointments.find((a: any) => a.practitionerId === p.practitionerId && a.status === 'IN_PROGRESS');
      const upcomingAppt = appointments.find((a: any) => a.practitionerId === p.practitionerId && a.status === 'SCHEDULED');
      const primaryAddress = p.addresses?.[0]?.address;

      return {
        id: p.practitionerId,
        name: `${p.firstName} ${p.lastName}`,
        role: "Care Navigator",
        location: primaryAddress?.street || (activeAppt ? "Sector Active" : "Stationary"),
        status: activeAppt ? "On Site" : upcomingAppt ? "In Transit" : "Idle",
        eta: upcomingAppt ? "15m" : "--",
        battery: Math.floor(Math.random() * 40) + 60, // 60% to 100%
        lat: primaryAddress?.latitude,
        lng: primaryAddress?.longitude,
        street: primaryAddress?.street,
      };
    })
    .filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Map real facilities to the UI state
  const facilities = facilitiesRaw
    .map((f: any) => {
      const address = f.facilityAddress;
      return {
        id: f.facilityId,
        name: f.name,
        type: f.type?.replace(/([A-Z])/g, ' $1').trim() || "GENERAL",
        street: address?.street || "Address Unknown",
        city: address?.city || "Unknown City",
        lat: address?.latitude,
        lng: address?.longitude,
        contactPerson: f.contactPerson || "Lead Coordinator",
        contactPhone: f.contactPhone || "+63 9XX XXX XXXX",
        residentsCount: f.residents?.length || 0,
      };
    })
    .filter((f: any) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleProviderSelect = (id: string | null) => {
    setSelectedProviderId(id);
    setSelectedFacilityId(null);
  };

  const handleFacilitySelect = (id: string | null) => {
    setSelectedFacilityId(id);
    setSelectedProviderId(null);
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-4 overflow-hidden animate-in fade-in duration-700">
      {/* Interactive Logistics Map */}
      <div className="flex-1 relative group">
        <InteractiveMap 
          providers={providers} 
          facilities={facilities}
          selectedProviderId={selectedProviderId} 
          selectedFacilityId={selectedFacilityId}
          onProviderSelect={handleProviderSelect} 
          onFacilitySelect={handleFacilitySelect}
        />

        {/* Tactical HUD Overlay */}
        <div className="absolute inset-x-10 bottom-10 flex items-end justify-between z-[1000]">
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
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Navigators</p>
                <p className="text-2xl font-black">{providers.length}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Facilities</p>
                <p className="text-2xl font-black text-amber-500">{facilities.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Provider & Facility Sidebar */}
      <div className="w-96 flex flex-col gap-4 overflow-hidden">
        <div className="bg-[var(--card-bg)] rounded-[2rem] border border-[var(--card-border)] shadow-xl p-6 flex flex-col gap-6 overflow-hidden h-full">
          {/* Tab Selector */}
          <div className="flex border-b border-[var(--card-border)] pb-2 gap-4">
            <button
              onClick={() => {
                setActiveTab("navigators");
                setSearchQuery("");
              }}
              className={`text-xs font-black uppercase tracking-wider pb-2 border-b-2 transition-all ${
                activeTab === "navigators"
                  ? "border-[var(--primary)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              Navigators ({providers.length})
            </button>
            <button
              onClick={() => {
                setActiveTab("facilities");
                setSearchQuery("");
              }}
              className={`text-xs font-black uppercase tracking-wider pb-2 border-b-2 transition-all ${
                activeTab === "facilities"
                  ? "border-[var(--primary)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              Facilities ({facilities.length})
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === "navigators" ? "SEARCH NAVIGATORS..." : "SEARCH FACILITIES..."}
              className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-12 pr-4 text-xs font-black placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all uppercase"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
            {activeTab === "navigators" ? (
              providers.map((p: any) => (
                <div key={p.id} 
                  onClick={() => handleProviderSelect(p.id)}
                  className={`p-4 rounded-2xl border transition-all group cursor-pointer
                    ${selectedProviderId === p.id ? 'border-[var(--primary)] bg-[var(--primary)]/10 shadow-lg' : 'border-[var(--card-border)] bg-[var(--input-bg)]/50 hover:border-[var(--primary)]/30'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${selectedProviderId === p.id ? 'bg-[var(--primary)] text-white' : 'bg-[var(--primary)]/10 text-[var(--primary)]'}`}>
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-[var(--text-primary)]">{p.name}</h4>
                        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{p.role}</p>
                      </div>
                    </div>
                    <MoreVertical className="w-4 h-4 text-[var(--text-muted)]" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Car className={`w-3.5 h-3.5 ${p.status === 'Idle' ? 'text-[var(--text-muted)]' : 'text-[var(--primary)]'}`} />
                      <span className="text-[10px] font-black text-[var(--text-secondary)]">{p.status}</span>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-[10px] font-black text-emerald-500">{p.eta}</span>
                    </div>
                  </div>

                  <div className="mt-2 text-[10px] text-[var(--text-muted)] font-semibold truncate">
                    📍 {p.street || "Location Unknown"}
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
                          handleProviderSelect(p.id);
                        }}
                        className="text-[9px] font-black text-[var(--primary)] uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                      >
                        Track <ChevronRight className="w-3 h-3" />
                      </button>
                  </div>
                </div>
              ))
            ) : (
              facilities.map((f: any) => (
                <div key={f.id} 
                  onClick={() => handleFacilitySelect(f.id)}
                  className={`p-4 rounded-2xl border transition-all group cursor-pointer
                    ${selectedFacilityId === f.id ? 'border-amber-500 bg-amber-500/10 shadow-lg' : 'border-[var(--card-border)] bg-[var(--input-bg)]/50 hover:border-amber-500/30'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${selectedFacilityId === f.id ? 'bg-amber-500 text-white' : 'bg-amber-500/10 text-amber-500'}`}>
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-[var(--text-primary)]">{f.name}</h4>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-[var(--card-border)] text-[var(--text-muted)] uppercase tracking-wider">
                          {f.type}
                        </span>
                      </div>
                    </div>
                    <MoreVertical className="w-4 h-4 text-[var(--text-muted)]" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)] font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">{f.street}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 text-[10px] text-[var(--text-muted)] border-t border-[var(--card-border)]/50">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-400" />
                        <span className="font-bold text-[var(--text-secondary)]">{f.residentsCount} Residents</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold block text-[var(--text-secondary)] truncate">{f.contactPerson}</span>
                        <span className="text-[9px] block">{f.contactPhone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[var(--card-border)] flex justify-end">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFacilitySelect(f.id);
                        }}
                        className="text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                      >
                        Track <ChevronRight className="w-3 h-3" />
                      </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
