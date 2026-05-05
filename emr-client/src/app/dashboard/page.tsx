"use client";

import { useQuery, gql } from "@apollo/client";
import { 
  Users, 
  Activity, 
  Clock, 
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Truck,
  Zap,
  Target,
  Shield,
  Search,
  Bell
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      activePatients
      newEncounters
      pendingReviews
      criticalAlerts
      deployedEquipmentCount
    }
    triageWorklist {
      patientId
      mrn
      firstName
      lastName
      isAlert
    }
  }
`;

export default function Dashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  const { data, loading } = useQuery(GET_DASHBOARD_STATS);

  const stats = [
    { label: "Active Patients", value: loading ? "..." : data?.dashboardStats?.activePatients.toLocaleString(), icon: Users, trend: "+12.4%", desc: "Current Caseload", href: "/dashboard/patients" },
    { label: "New Encounters", value: loading ? "..." : data?.dashboardStats?.newEncounters.toString(), icon: Target, trend: "+5.1%", desc: "Past 24 Hours", href: "/dashboard/schedule" },
    { label: "Pending Reviews", value: loading ? "..." : data?.dashboardStats?.pendingReviews.toString(), icon: Clock, trend: "-2.3%", desc: "Average Latency", href: "/dashboard/triage" },
    { label: "Critical Alerts", value: loading ? "..." : data?.dashboardStats?.criticalAlerts.toString(), icon: AlertTriangle, color: "#f43f5e", trend: "Stable", desc: "System Health", href: "/dashboard/triage" },
    { label: "Equipment", value: loading ? "..." : data?.dashboardStats?.deployedEquipmentCount.toString(), icon: Truck, trend: "+3", desc: "Active Logistics", href: "/dashboard/telemetry" },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Refined Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
        <div className="flex items-center gap-4">
          <div className="w-1 h-10 bg-[var(--primary)] rounded-full shadow-[0_0_15px_var(--primary-glow)]" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Clinical Dashboard</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--primary)]" />
              Operational Overview // v4.2
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => showToast("Preparing clinical report...", "info")}
             className="px-5 h-10 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all active:scale-[0.98]"
           >
             Generate Report
           </button>
           <button 
             onClick={() => router.push("/dashboard/schedule?action=new")}
             className="px-6 h-10 rounded-xl bg-[var(--primary)] text-white text-sm font-medium shadow-lg shadow-[var(--primary-glow)] hover:opacity-90 transition-all active:scale-[0.98]"
           >
             New Encounter
           </button>
        </div>
      </div>

      {stats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {stats.map((stat) => (
            <div 
              key={stat.label} 
              onClick={() => stat.href && router.push(stat.href)}
              className="glass-morphism rounded-2xl p-4 border border-[var(--card-border)] hover:bg-white/[0.02] transition-all cursor-pointer group active:scale-[0.98]"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] group-hover:bg-[var(--primary)]/20 transition-all">
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg
                  ${stat.trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 
                    stat.trend === 'Stable' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}
                `}>
                  {stat.trend}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-muted)] mb-1">{stat.label}</p>
                <h3 className="text-4xl font-bold text-[var(--text-primary)] tracking-tight">
                  {stat.value}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-2 font-medium">{stat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <div className="lg:col-span-2 glass-morphism rounded-3xl p-5 border border-[var(--card-border)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 bg-[var(--primary)] rounded-full" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Activity Log</h2>
            </div>
            <button 
              onClick={() => router.push("/dashboard/patients")}
              className="text-xs font-semibold text-[var(--primary)] hover:opacity-80 flex items-center gap-2 group"
            >
              View History <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
          
          <div className="space-y-2">
            {(data?.triageWorklist || [1, 2, 3, 4]).slice(0, 4).map((item: any, i: number) => {
              const isReal = !!item.patientId;
              const patientId = isReal ? item.patientId : "sample-id";
              const mrn = isReal ? item.mrn : `PRN-${48291 + i}`;
              const name = isReal ? `${item.firstName} ${item.lastName}` : "Patient Assessment";
              const isAlert = isReal ? item.isAlert : i === 0;

              return (
                <div 
                  key={isReal ? item.patientId : i} 
                  onClick={() => router.push(`/dashboard/patients/${patientId}`)}
                  className="flex items-center gap-4 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:bg-[var(--primary)]/5 hover:border-[var(--primary)]/20 transition-all cursor-pointer active:scale-[0.99] group"
                >
                  <div className={`w-10 h-10 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-center shrink-0 ${isAlert ? 'border-red-500/30' : ''}`}>
                     <Zap className={`${isAlert ? 'text-red-500 animate-pulse' : 'text-[var(--primary)]'} w-5 h-5`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                      {isReal ? `Assessment: ${name}` : `Patient Assessment: ${mrn}`}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                      {isReal ? `MRN: ${mrn} // Verified` : "Clinical Review // Synchronized 2h ago"}
                    </p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center justify-end gap-1.5 mb-1">
                      <Shield className={`w-3 h-3 ${isAlert ? 'text-amber-500' : 'text-emerald-500'}`} />
                      <span className={`text-[10px] font-semibold ${isAlert ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {isAlert ? 'Urgent' : 'Validated'}
                      </span>
                    </div>
                    <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Dr. Gregory House</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Alerts */}
        <div className="glass-morphism rounded-3xl p-5 border border-red-500/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-5 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.3)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Priority Alerts</h2>
          </div>
          
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-red-500/[0.02] border border-red-500/10 space-y-3">
               <div className="flex items-center gap-2 text-red-500">
                 <AlertTriangle className="w-4 h-4" />
                 <span className="text-[10px] font-semibold uppercase tracking-wider">Clinical Alert</span>
               </div>
               <h4 className="text-sm font-semibold text-[var(--text-primary)]">Telemetry Interrupted</h4>
               <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                 Patient MRN-4829 has lost device connectivity. Follow-up required immediately.
               </p>
               <button 
                 onClick={() => router.push("/dashboard/telemetry")}
                 className="w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/10 text-red-500 text-[11px] font-semibold hover:bg-red-500/20 transition-all active:scale-[0.98]"
               >
                 Review Status
               </button>
            </div>

            <div className="p-6 rounded-2xl bg-orange-500/[0.02] border border-orange-500/10 space-y-3">
               <div className="flex items-center gap-2 text-orange-500">
                 <Clock className="w-4 h-4" />
                 <span className="text-[10px] font-semibold uppercase tracking-wider">Task Warning</span>
               </div>
               <h4 className="text-sm font-semibold text-[var(--text-primary)]">Licensure Renewal</h4>
               <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                 Professional credentials for practitioner group NJ expire in 14 days.
               </p>
               <button 
                 onClick={() => showToast("Redirecting to credentials management...", "info")}
                 className="w-full py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/10 text-orange-500 text-[11px] font-semibold hover:bg-orange-500/20 transition-all active:scale-[0.98]"
               >
                 Renew Now
               </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="pt-6 flex flex-col items-center gap-3 opacity-30">
        <div className="w-px h-10 bg-slate-500" />
        <p className="text-[10px] font-medium text-slate-500 tracking-[0.4em] uppercase">Aura Clinical Operations Group</p>
      </div>
    </div>
  );
}
