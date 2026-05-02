"use client";

import { useQuery, gql } from "@apollo/client";
import { 
  Users, 
  Activity, 
  Clock, 
  AlertTriangle,
  ArrowUpRight,
  TrendingUp
} from "lucide-react";

const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      activePatients
      newEncounters
      pendingReviews
      criticalAlerts
    }
  }
`;

export default function MissionControl() {
  const { data, loading } = useQuery(GET_DASHBOARD_STATS);

  const stats = [
    { label: "Active Patients", value: loading ? "..." : data?.dashboardStats?.activePatients.toLocaleString(), icon: Users, color: "blue", trend: "+12%" },
    { label: "New Encounters", value: loading ? "..." : data?.dashboardStats?.newEncounters.toString(), icon: Activity, color: "green", trend: "+5%" },
    { label: "Pending Reviews", value: loading ? "..." : data?.dashboardStats?.pendingReviews.toString(), icon: Clock, color: "purple", trend: "-2%" },
    { label: "Critical Alerts", value: loading ? "..." : data?.dashboardStats?.criticalAlerts.toString(), icon: AlertTriangle, color: "red", trend: "0%" },
  ];
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Mission Control</h1>
          <p className="text-slate-400">Welcome back, Dr. House. Here is what's happening today.</p>
        </div>
        <div className="flex gap-4">
           <button className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all">
             Generate Report
           </button>
           <button className="px-6 py-2.5 rounded-xl premium-gradient text-white font-semibold shadow-lg shadow-blue-500/20">
             New Encounter
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-morphism rounded-3xl p-6 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center 
              ${stat.color === 'blue' ? 'bg-blue-500/10 text-blue-400' : ''}
              ${stat.color === 'green' ? 'bg-emerald-500/10 text-emerald-400' : ''}
              ${stat.color === 'purple' ? 'bg-purple-500/10 text-purple-400' : ''}
              ${stat.color === 'red' ? 'bg-red-500/10 text-red-400' : ''}
            `}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-3">
                <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full 
                  ${stat.trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}
                `}>
                  {stat.trend}
                </span>
              </div>
            </div>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <TrendingUp className="w-5 h-5 text-slate-500" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity List */}
        <div className="lg:col-span-2 glass-morphism rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white">Recent Activity</h2>
            <button className="text-blue-400 text-sm font-medium hover:underline flex items-center gap-1">
              View All Activity <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-6 p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group">
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                   <Activity className="text-blue-400 w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">New Assessment for John Doe</p>
                  <p className="text-slate-400 text-sm">Pain Management Assessment • 2 hours ago</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">By Dr. Gregory House</p>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-blue-400">Validated</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Alerts / Secondary area */}
        <div className="glass-morphism rounded-3xl p-8 bg-red-500/5 border-red-500/10">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <AlertTriangle className="text-red-500 w-6 h-6" />
            Priority Alerts
          </h2>
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20">
               <p className="text-white text-sm font-semibold mb-1">Telemetry Interrupted</p>
               <p className="text-red-400/80 text-xs">Patient MRN-4829 has lost IoT connectivity in Area 4.</p>
               <button className="mt-4 text-xs font-bold text-red-400 uppercase tracking-widest hover:underline">Troubleshoot Now</button>
            </div>
            <div className="p-5 rounded-2xl bg-orange-500/10 border border-orange-500/20">
               <p className="text-white text-sm font-semibold mb-1">Upcoming Compliance Deadline</p>
               <p className="text-orange-400/80 text-xs">Practitioner licensure for NJ expires in 14 days.</p>
               <button className="mt-4 text-xs font-bold text-orange-400 uppercase tracking-widest hover:underline">Renew License</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
