"use client";

import { useQuery, gql } from "@apollo/client";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Search,
  Plus,
  ArrowRight,
  Activity,
  Users,
  ChevronRight,
  Edit2
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import EditFacilityDrawer from "@/components/EditFacilityDrawer";

const GET_FACILITIES = gql`
  query GetFacilities {
    facilities {
      facilityId
      name
      type
      contactPerson
      contactPhone
      contactEmail
      facilityAddress {
        city
        street
      }
      residents {
        patientId
      }
    }
  }
`;

export default function FacilitiesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<any | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_FACILITIES);

  const facilities = data?.facilities || [];
  const filteredFacilities = facilities.filter((f: any) => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.facilityAddress?.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Facility Management</h1>
          <p className="text-sm text-[var(--text-secondary)]">Oversee multi-site clinical operations and facility-specific patient volumes.</p>
        </div>
        <button className="premium-button premium-gradient px-5 h-10 rounded-xl text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20">
          <Plus className="w-4 h-4" />
          Add Facility
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center bg-[var(--card-bg)] p-3 rounded-2xl border border-[var(--card-border)] shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input 
            type="text" 
            placeholder="Search by name, city, or type..." 
            className="w-full premium-input rounded-xl py-2 pl-10 pr-4 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 glass-morphism rounded-2xl animate-pulse bg-white/[0.02] border border-white/5" />
          ))
        ) : filteredFacilities.map((f: any) => (
          <div key={f.facilityId} className="glass-morphism rounded-2xl p-6 border border-[var(--card-border)] hover:border-[var(--primary)]/30 transition-all group flex flex-col h-full shadow-lg hover:shadow-[var(--primary-glow)] hover:-translate-y-1 duration-300">
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] shadow-inner group-hover:bg-[var(--primary)] group-hover:text-white transition-all duration-500">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-[var(--input-bg)] text-[var(--text-muted)] text-[9px] font-black uppercase tracking-widest border border-[var(--card-border)] shadow-sm">
                  {f.type?.replace(/([A-Z])/g, ' $1').trim() || "GENERAL"}
                </span>
                <button 
                  onClick={() => {
                    setSelectedFacility(f);
                    setIsEditOpen(true);
                  }}
                  className="p-1.5 rounded-lg bg-white/5 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-all border border-white/5"
                  title="Edit Facility Configuration"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1 group-hover:text-[var(--primary)] transition-colors line-clamp-1">{f.name}</h3>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <MapPin className="w-3.5 h-3.5" />
                {f.facilityAddress?.city || "Metro Manila"}
              </div>
            </div>

            <div className="space-y-4 flex-1">
               <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--input-bg)]/50 border border-[var(--card-border)] shadow-inner group-hover:bg-[var(--primary)]/5 transition-colors">
                 <div className="flex items-center gap-2">
                   <Users className="w-4 h-4 text-blue-400" />
                   <span className="text-xs font-semibold text-[var(--text-secondary)]">Active Residents</span>
                 </div>
                 <span className="text-sm font-bold text-[var(--text-primary)]">{f.residents?.length || 0}</span>
               </div>
               
               <div className="space-y-2.5 px-1">
                 <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
                   <div className="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center">
                     <User className="w-3 h-3" />
                   </div>
                   {f.contactPerson || "Lead Coordinator"}
                 </div>
                 <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
                   <div className="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center">
                     <Phone className="w-3 h-3" />
                   </div>
                   {f.contactPhone || "+63 9XX XXX XXXX"}
                 </div>
               </div>
            </div>

            <button 
              onClick={() => router.push(`/dashboard/navigation?facilityId=${f.facilityId}`)}
              className="w-full mt-8 py-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-primary)] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] transition-all active:scale-[0.98] shadow-sm"
            >
              Tactical Sector Map
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      
      {!loading && filteredFacilities.length === 0 && (
        <div className="py-32 text-center glass-morphism rounded-[2.5rem] border border-[var(--card-border)] flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-[var(--text-muted)] mb-2">
            <Search className="w-8 h-8 opacity-20" />
          </div>
          <h3 className="text-xl font-bold text-[var(--text-primary)]">No Facilities Found</h3>
          <p className="text-[var(--text-muted)] text-sm max-w-xs mx-auto leading-relaxed">
            We couldn't find any medical facilities matching your current filter criteria.
          </p>
          <button 
            onClick={() => setSearchQuery("")}
            className="mt-4 px-6 py-2 rounded-xl bg-[var(--input-bg)] text-[var(--text-primary)] text-xs font-bold uppercase tracking-widest border border-[var(--card-border)] hover:bg-white/5 transition-all"
          >
            Clear All Filters
          </button>
        </div>
      )}

      <EditFacilityDrawer 
        open={isEditOpen} 
        onClose={() => {
          setIsEditOpen(false);
          setSelectedFacility(null);
        }} 
        onSuccess={() => refetch()} 
        facility={selectedFacility} 
      />
    </div>
  );
}
