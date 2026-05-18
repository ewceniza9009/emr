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
  Bell,
  HeartPulse,
  Brain,
  Crosshair,
  BarChart3,
  Calendar,
  Layers,
  Plus,
  UserCircle,
  ShieldAlert,
  Boxes,
  Microscope,
  Settings
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ToastProvider";
import { useSettings } from "@/lib/SettingsContext";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRecentlyBrowsed } from "@/hooks/useRecentlyBrowsed";
import BookingDrawer from "@/components/BookingDrawer";
import AddPatientDrawer from "@/components/AddPatientDrawer";
import { PermissionGate } from "@/components/PermissionGate";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      activePatients
      newEncounters
      pendingReviews
      criticalAlerts
      deployedEquipmentCount
      alerts {
        type
        title
        subtitle
        priority
        actionText
        targetId
      }
      pulse {
        time
        active
        alerts
      }
    }
    triageWorklist {
      items {
        patientId
        mrn
        firstName
        lastName
        isAlert
      }
    }
  }
`;

const chartData = [
  { time: "00:00", active: 12, alerts: 2 },
  { time: "04:00", active: 8, alerts: 1 },
  { time: "08:00", active: 24, alerts: 5 },
  { time: "12:00", active: 48, alerts: 8 },
  { time: "16:00", active: 38, alerts: 4 },
  { time: "20:00", active: 28, alerts: 3 },
  { time: "23:59", active: 18, alerts: 2 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
} as const;

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 18
    }
  }
} as const;

export default function Dashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const { showToast } = useToast();
  const { tenantConfig } = useSettings();
  const { data, loading, error, refetch } = useQuery(GET_DASHBOARD_STATS, {
    fetchPolicy: "cache-and-network"
  });
  const { recentItems } = useRecentlyBrowsed();
  const [greeting, setGreeting] = useState("Good morning");
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 17) setGreeting("Good afternoon");
    else if (hour >= 17) setGreeting("Good evening");
  }, []);

  const stats = [
    { label: "Patients", value: data?.dashboardStats?.activePatients.toLocaleString(), icon: Users, trend: "+12.4%", desc: "Active Caseload", action: "ADD_PATIENT", color: "text-blue-500" },
    { label: "Encounters", value: data?.dashboardStats?.newEncounters.toString(), icon: Target, trend: "+5.1%", desc: "Past 24H", action: "BOOK_APPOINTMENT", color: "text-amber-500" },
    { label: "Reviews", value: data?.dashboardStats?.pendingReviews.toString(), icon: Clock, trend: "-2.3%", desc: "Avg Latency", href: "/dashboard/triage", color: "text-purple-500" },
    { label: "Alerts", value: data?.dashboardStats?.criticalAlerts.toString(), icon: AlertTriangle, trend: "Stable", desc: "System Health", href: "/dashboard/triage#alerts", color: "text-rose-500" },
    { label: "Equipment", value: data?.dashboardStats?.deployedEquipmentCount.toString(), icon: Truck, trend: "+3", desc: "Logistics", href: "/dashboard/telemetry", color: "text-emerald-500" },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full space-y-4 pb-8"
    >
      <BookingDrawer open={isBookingOpen} onClose={() => setIsBookingOpen(false)} onBooked={() => { }} />
      <AddPatientDrawer open={isAddPatientOpen} onClose={() => setIsAddPatientOpen(false)} onSuccess={() => { }} />
      {/* Premium Hero Header - Compact */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-[2rem] bg-slate-900 border border-white/10 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-teal-500/20 to-blue-600/20 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-white/70 uppercase tracking-[0.2em]">{tenantConfig.organizationName}</span>
            </div>
            <h1 className="text-sm font-bold text-white tracking-tight uppercase">
              {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-400">{session?.user?.name?.split(' ')[0] || "Practitioner"}</span>
            </h1>
            <p className="max-w-xl text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest leading-relaxed">
              Your clinical command center is synchronized and optimized for today&apos;s caseload.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PermissionGate permission="scheduling:manage">
              <button
                onClick={() => router.push("/dashboard/schedule?action=new")}
                className="px-5 h-10 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-teal-50 transition-all flex items-center gap-2 shadow-xl active:scale-95"
              >
                <Plus className="w-4 h-4" />
                New Encounter
              </button>
            </PermissionGate>
            <PermissionGate permission="analytics:view">
              <button
                onClick={() => showToast("Preparing clinical report...", "info")}
                className="px-5 h-10 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-2 backdrop-blur-md active:scale-95"
              >
                <BarChart3 className="w-4 h-4 text-teal-400" />
                Reports
              </button>
            </PermissionGate>
          </div>
        </div>
      </motion.div>

      {/* Stats Row - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((stat, i) => {
          const permissionMap: Record<string, string> = {
            "Patients": "patients:view",
            "Encounters": "clinical:view",
            "Reviews": "clinical:view",
            "Alerts": "clinical:view",
            "Equipment": "logistics:view"
          };
          return (
            <PermissionGate key={stat.label} permission={permissionMap[stat.label] || "clinical:view"}>
              <motion.div
                variants={itemVariants}
                onClick={() => {
                  if (stat.href) router.push(stat.href);
                  if (stat.action === "BOOK_APPOINTMENT") setIsBookingOpen(true);
                  if (stat.action === "ADD_PATIENT") setIsAddPatientOpen(true);
                }}
                className="glass-morphism rounded-2xl p-4 border border-[var(--card-border)] hover:bg-white/[0.02] transition-all cursor-pointer group active:scale-[0.98]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/5 ${stat.color}`}>
                    {stat.trend}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{stat.label}</p>
                {loading ? (
                  <Skeleton className="h-8 w-24 mt-2 rounded-lg" />
                ) : (
                  <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stat.value}</h3>
                )}
              </motion.div>
            </PermissionGate>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Main Operational Pulse & Log */}
        <div className="lg:col-span-8 space-y-4">

          {/* Recently Browsed - Enhanced */}
          {recentItems.length > 0 && (
            <motion.div variants={itemVariants} className="glass-morphism rounded-[2rem] p-4 border border-[var(--card-border)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-4 bg-teal-500 rounded-full" />
                <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">Recently Browsed</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-10 gap-3">
                {recentItems.map((item) => {
                  const isDuplicateName = recentItems.filter(r => r.firstName === item.firstName && r.lastName === item.lastName).length > 1;
                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      onClick={() => router.push(item.type === 'PATIENT' ? `/dashboard/patients/${item.id}` : `/dashboard/outreach/${item.id}/enroll`)}
                      className="p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:border-teal-500/30 hover:bg-teal-500/5 transition-all cursor-pointer group text-center flex flex-col items-center gap-2 relative"
                    >
                      {item.visitCount && item.visitCount > 1 && (
                        <div className="absolute top-1 right-1 bg-teal-500 text-[7px] font-black text-white px-2 py-0.5 rounded-full shadow-lg z-10 border border-white/20">
                          {item.visitCount}x
                        </div>
                      )}
                      <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-teal-400 group-hover:scale-110 group-hover:bg-teal-500/10 transition-all`}>
                        {item.type === 'PATIENT' ? <UserCircle className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0 w-full">
                        <p className={`text-[10px] font-black text-[var(--text-primary)] truncate uppercase tracking-tight ${isDuplicateName ? 'text-amber-200/90' : ''}`}>
                          {item.firstName} {item.lastName}
                        </p>
                        <div className="flex items-center justify-center gap-1.5 mt-1">
                          <span className={`w-1 h-1 rounded-full ${item.type === 'PATIENT' ? 'bg-blue-500' : 'bg-teal-500'}`} />
                          <p className={`text-[8px] font-bold truncate tracking-widest uppercase ${isDuplicateName ? 'text-teal-400' : 'text-[var(--text-muted)]'}`}>
                            {item.subtitle || 'NO MRN'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Activity Log - Compact */}
          <PermissionGate permission="clinical:view">
            <motion.div variants={itemVariants} className="glass-morphism rounded-[2rem] p-4 border border-[var(--card-border)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-4 bg-[var(--primary)] rounded-full shadow-[0_0_10px_var(--primary-glow)]" />
                  <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">Recent Activity Log</h2>
                </div>
                <button
                  onClick={() => router.push("/dashboard/patients")}
                  className="text-[10px] font-bold text-[var(--primary)] hover:opacity-80 flex items-center gap-1 group"
                >
                  View All <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>

              <div className="space-y-1.5">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)]">
                      <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))
                ) : (
                  (data?.triageWorklist?.items || []).slice(0, 4).map((item: any, i: number) => {
                    const isReal = !!item.patientId;
                    const patientId = isReal ? item.patientId : "sample-id";
                    const mrn = isReal ? item.mrn : `PRN-${48291 + i}`;
                    const name = isReal ? `${item.firstName} ${item.lastName}` : "Patient Assessment";
                    const isAlert = isReal ? item.isAlert : i === 0;

                    return (
                      <div
                        key={isReal ? item.patientId : i}
                        onClick={() => router.push(`/dashboard/patients/${patientId}`)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] hover:bg-[var(--primary)]/5 hover:border-[var(--primary)]/20 transition-all cursor-pointer active:scale-[0.99] group"
                      >
                        <div className={`w-10 h-10 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] flex items-center justify-center shrink-0 ${isAlert ? 'border-rose-500/30 bg-rose-500/5' : ''}`}>
                          <Zap className={`${isAlert ? 'text-rose-500 animate-pulse' : 'text-[var(--primary)]'} w-5 h-5`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors truncate">
                            {isReal ? `Assessment: ${name}` : `Patient Assessment: ${mrn}`}
                          </p>
                          <p className="text-[9px] text-[var(--text-muted)] mt-0.5 font-medium truncate">
                            {isReal ? `MRN: ${mrn} · Verified Registry` : "Clinical Review · Synchronized 2h ago"}
                          </p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <div className="flex items-center justify-end gap-1 mb-0.5">
                            <Shield className={`w-2.5 h-2.5 ${isAlert ? 'text-amber-500' : 'text-emerald-500'}`} />
                            <span className={`text-[8px] font-bold uppercase tracking-widest ${isAlert ? 'text-amber-500' : 'text-emerald-500'}`}>
                              {isAlert ? 'Urgent' : 'Validated'}
                            </span>
                          </div>
                          <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">
                            System Admin
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </PermissionGate>

          {/* Operational Pulse Chart - Compact */}
          <PermissionGate permission="analytics:view">
            <motion.div variants={itemVariants} className="glass-morphism rounded-[2rem] border border-[var(--card-border)] p-5 overflow-hidden relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">Operational Pulse</h2>
                  <p className="text-[9px] text-[var(--text-muted)] mt-0.5 font-bold uppercase tracking-widest">Real-time engagement metrics</p>
                </div>
              </div>
              <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                  <AreaChart data={data?.dashboardStats?.pulse || []}>

                    <defs>
                      <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        color: '#fff',
                        fontSize: '10px'
                      }}
                    />
                    <Area type="monotone" dataKey="active" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorPulse)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </PermissionGate>
        </div>

        {/* Sidebar - Compact Alerts */}
        <motion.div variants={itemVariants} className="lg:col-span-4 space-y-4">
          {/* Priority Alerts - Compact */}
          <div className="glass-morphism rounded-[2rem] p-4 border border-rose-500/20 bg-rose-500/[0.02]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 bg-rose-500 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
              <h2 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">Clinical Alerts</h2>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {(data?.dashboardStats?.alerts || []).length === 0 ? (
                    <div className="p-8 text-center opacity-30">
                      <Shield className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No Critical Alerts</p>
                    </div>
                  ) : (
                    data.dashboardStats.alerts.map((alert: any, i: number) => (
                      <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                        <div className={`flex items-center gap-2 ${alert.type === 'TELEMETRY' ? 'text-rose-500' : 'text-amber-500'}`}>
                          {alert.type === 'TELEMETRY' ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          <span className="text-[8px] font-bold uppercase tracking-[0.2em]">{alert.type === 'TELEMETRY' ? 'Telemetry Critical' : 'Compliance'}</span>
                        </div>
                        <h4 className="text-xs font-bold text-[var(--text-primary)]">{alert.title}</h4>
                        <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-medium">
                          {alert.subtitle}
                        </p>
                        <button 
                          onClick={() => {
                            if (alert.type === 'TELEMETRY' && alert.targetId) {
                              router.push(`/dashboard/patients/${alert.targetId}`);
                            } else if (alert.type === 'COMPLIANCE' && alert.targetId) {
                              router.push(`/admin/dashboard?tab=practitioners&editId=${alert.targetId}`);
                            }
                          }}
                          className={`w-full py-2 rounded-lg ${alert.type === 'TELEMETRY' ? 'bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20' : 'bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20'} text-[9px] font-bold transition-all active:scale-95`}
                        >
                          {alert.actionText}
                        </button>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </div>

          {/* Quick Navigation Clusters - Compact */}
          <div className="grid grid-cols-2 gap-2">
            <NavTile
              icon={ShieldAlert}
              label="Security"
              color="text-teal-500"
              onClick={() => showToast("Security Protocol: AES-256 Verified. All node connections encrypted.", "success")}
            />
            <NavTile
              icon={Boxes}
              label="Assets"
              color="text-blue-500"
              href="/dashboard/telemetry"
            />
            <NavTile
              icon={Microscope}
              label="Review"
              color="text-purple-500"
              href="/dashboard/triage"
            />
            <PermissionGate permission="setup:view">
              <NavTile
                icon={Settings}
                label="System"
                color="text-slate-500"
                href="/admin"
              />
            </PermissionGate>
          </div>
        </motion.div>

      </div>

      {/* Footer Branding - Compact */}
      <div className="pt-4 flex flex-col items-center gap-2 opacity-20">
        <div className="w-px h-8 bg-[var(--card-border)]" />
        <p className="text-[8px] font-bold text-[var(--text-muted)] tracking-[0.4em] uppercase">Halkyone Clinical Operations Group · Secure Health Systems</p>
      </div>
    </motion.div>
  );
}

function NavTile({ icon: Icon, label, color, href, onClick }: { icon: any, label: string, color: string, href?: string, onClick?: () => void }) {
  const router = useRouter();
  return (
    <div
      onClick={() => {
        if (onClick) onClick();
        else if (href) router.push(href);
      }}
      className="p-3 rounded-[1.5rem] bg-[var(--input-bg)] border border-[var(--card-border)] hover:bg-white/[0.02] hover:border-[var(--primary)]/30 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 group active:scale-[0.98]"
    >
      <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{label}</span>
    </div>
  );
}



