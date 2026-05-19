"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, gql, useMutation } from "@apollo/client";
import { useSession } from "next-auth/react";
import {
  Heart,
  Activity,
  Maximize2,
  Search,
  Cpu,
  Wifi,
  Smartphone,
  Server,
  Network,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import LiveHeartbeat from "@/components/LiveHeartbeat";
import { Skeleton } from "@/components/ui/skeleton";

const CREATE_ENCOUNTER = gql`
  mutation CreateEncounter($input: CreateClinicalEncounterCommandInput!) {
    createClinicalEncounter(input: $input)
  }
`;

const GET_PATIENTS = gql`
  query GetPatientsForTelemetry {
    patients {
      items {
        patientId
        mrn
        firstName
        lastName
        encounters {
          status
        }
      }
    }
  }
`;

export default function VitalsIoTPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const { data, loading, error } = useQuery(GET_PATIENTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [enabledPatients, setEnabledPatients] = useState<
    Record<string, boolean>
  >({});
  const [initializingPatients, setInitializingPatients] = useState<
    Record<string, boolean>
  >({});

  const [createEncounter] = useMutation(CREATE_ENCOUNTER);

  const patientsData = useMemo(
    () => data?.patients?.items || [],
    [data?.patients?.items],
  );

  // Auto-enable patients who already have an active encounter
  useEffect(() => {
    if (patientsData.length > 0) {
      const activeStates: Record<string, boolean> = {};
      patientsData.forEach((p: any) => {
        const hasActiveEncounter = p.encounters?.some(
          (e: any) =>
            e.status === "InProgress" ||
            e.status === "Arrived" ||
            e.status === "Triaged",
        );
        if (hasActiveEncounter) {
          activeStates[p.patientId] = true;
        }
      });
      setEnabledPatients((prev) => ({ ...activeStates, ...prev }));
    }
  }, [patientsData]);

  const patients = patientsData.filter(
    (p: any) =>
      `${p.firstName} ${p.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      p.mrn.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const activeCount = useMemo(() => {
    return Object.values(enabledPatients).filter(Boolean).length;
  }, [enabledPatients]);

  const handleToggleTelemetry = async (patientId: string) => {
    const isCurrentlyEnabled = !!enabledPatients[patientId];
    const newEnabledState = !isCurrentlyEnabled;

    setEnabledPatients((prev) => ({ ...prev, [patientId]: newEnabledState }));

    if (newEnabledState) {
      setInitializingPatients((prev) => ({ ...prev, [patientId]: true }));
      try {
        await createEncounter({
          variables: {
            input: {
              patientId: patientId,
              practitionerId:
                session?.user?.practitionerId ||
                session?.user?.id ||
                "00000000-0000-0000-0000-000000000000",
              chiefComplaint: "Dashboard IoT Initialization",
              notes:
                "Initialized live telemetry link from the global IoT monitoring dashboard.",
              ppsScore: 100,
            },
          },
        });
        showToast("Telemetry Link Established", "success");
      } catch (err) {
        console.error("Failed to initialize telemetry:", err);
        showToast("Link Failure: Sensor Network Unreachable", "error");
        setEnabledPatients((prev) => ({ ...prev, [patientId]: false }));
      } finally {
        setInitializingPatients((prev) => ({ ...prev, [patientId]: false }));
      }
    }
  };

  if (loading)
    return (
      <div className="space-y-4 animate-in fade-in duration-700">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between bg-[var(--card-bg)] px-4 py-3 rounded-2xl border border-[var(--card-border)]">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-64 rounded-xl" />
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
        </div>

        {/* Stats Row Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>

        {/* Grid Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="glass-morphism rounded-2xl border border-[var(--card-border)] p-4 space-y-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-650 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
          <Activity className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          Registry Connection Failed
        </h2>
        <p className="text-[var(--text-muted)] text-sm max-w-xs">
          Could not establish a secure connection to the patient data registry.
        </p>
      </div>
    );

  return (
    <div className="space-y-4 animate-in fade-in duration-700">
      {/* Header Command Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--card-bg)] px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/[0.01] to-transparent pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 bg-rose-500/10 rounded-lg flex items-center justify-center border border-rose-500/20 shadow-lg shadow-rose-500/10">
            <Heart className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-[0.2em] leading-none">
              Clinical Telemetry
            </h1>
            <p className="text-[8px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-1.5 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              Online Vital Signs Grid
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search patients..."
              className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg py-1.5 pl-8 pr-3 text-[11px] text-[var(--text-primary)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20 transition-all outline-none w-full sm:w-56 font-bold"
            />
          </div>
        </div>
      </div>

      {/* Telemetry Dashboard Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {/* Metric 1 */}
        <div className="p-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-md flex items-center gap-3 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] to-transparent pointer-events-none" />
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-500 ${
              activeCount > 0
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-muted)]"
            }`}
          >
            <Network
              className={`w-4 h-4 ${activeCount > 0 ? "animate-pulse" : ""}`}
            />
          </div>
          <div>
            <p className="text-[7.5px] text-[var(--text-muted)] font-black uppercase tracking-widest leading-none">
              Active Streams
            </p>
            <p className="text-base font-black text-[var(--text-primary)] font-mono mt-1 leading-none">
              {activeCount}
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-md flex items-center gap-3 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-transparent pointer-events-none" />
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[7.5px] text-[var(--text-muted)] font-black uppercase tracking-widest leading-none">
              System Latency
            </p>
            <p className="text-base font-black text-[var(--text-primary)] font-mono mt-1 leading-none">
              12ms
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-md flex items-center gap-3 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] to-transparent pointer-events-none" />
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center">
            <Wifi className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[7.5px] text-[var(--text-muted)] font-black uppercase tracking-widest leading-none">
              Signal Integrity
            </p>
            <p className="text-base font-black text-[var(--text-primary)] font-mono mt-1 leading-none">
              99.8%
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-md flex items-center gap-3 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-500/[0.02] to-transparent pointer-events-none" />
          <div className="w-8 h-8 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] flex items-center justify-center">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[7.5px] text-[var(--text-muted)] font-black uppercase tracking-widest leading-none">
              Patient Nodes
            </p>
            <p className="text-base font-black text-[var(--text-primary)] font-mono mt-1 leading-none">
              {patients.length}
            </p>
          </div>
        </div>
      </div>

      {/* Main Registry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {patients.map((patient: any) => {
          const isStreaming = !!enabledPatients[patient.patientId];
          const isInitializing = initializingPatients[patient.patientId];

          return (
            <div
              key={patient.patientId}
              className={`glass-morphism rounded-2xl border transition-all duration-500 group relative flex flex-col justify-between overflow-hidden shadow-lg ${
                isStreaming
                  ? "border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.015)]"
                  : isInitializing
                    ? "border-amber-500/20 animate-pulse"
                    : "border-[var(--card-border)] hover:border-[var(--text-muted)]/20"
              }`}
            >
              {/* Active ambient glow behind streaming cards */}
              {isStreaming && (
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/[0.015] to-transparent pointer-events-none" />
              )}

              {/* Patient Info Header */}
              <div className="p-3 border-b border-[var(--card-border)] flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  {/* Glowing Initials Ring */}
                  <div
                    className={`relative w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black uppercase tracking-wider transition-all duration-500 border ${
                      isStreaming
                        ? "bg-rose-500/5 border-rose-500/30 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.1)]"
                        : "bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--text-muted)]"
                    }`}
                  >
                    {patient.firstName[0]}
                    {patient.lastName[0]}
                    {/* Tiny pulsing indicator dot */}
                    <span
                      className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-900 ${
                        isStreaming
                          ? "bg-rose-500 animate-pulse"
                          : isInitializing
                            ? "bg-amber-500"
                            : "bg-[var(--text-muted)]"
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[var(--text-primary)] tracking-tight uppercase leading-none group-hover:text-[var(--primary)] transition-colors">
                      {patient.firstName} {patient.lastName}
                    </h3>
                    <p className="text-[9.5px] text-[var(--text-muted)] font-black tracking-widest uppercase mt-2">
                      {patient.mrn}
                    </p>
                  </div>
                </div>
                <button className="p-2 rounded-lg bg-[var(--input-bg)] hover:bg-[var(--input-bg)]/80 text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--card-border)] hover:border-[var(--text-muted)]/45 transition-all active:scale-90">
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Live Telemetry Node Area */}
              <div className="p-3 relative z-10 flex-1">
                <LiveHeartbeat
                  patientId={patient.patientId}
                  enabled={isStreaming}
                  onToggle={() => handleToggleTelemetry(patient.patientId)}
                  status={
                    isInitializing
                      ? "initializing"
                      : isStreaming
                        ? "live"
                        : "off"
                  }
                />
              </div>

              {/* Connection Specs Footer */}
              <div className="px-3 py-2 bg-[var(--input-bg)]/40 border-t border-[var(--card-border)] flex items-center justify-between rounded-b-2xl relative z-10">
                <div className="flex items-center gap-2.5">
                  <Smartphone
                    className={`w-3.5 h-3.5 transition-colors duration-500 ${isStreaming ? "text-rose-500/60" : "text-[var(--text-muted)]"}`}
                  />
                  <div className="flex flex-col">
                    <span className="text-[7.5px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
                      Generic IoT Gateway
                    </span>
                    <span className="text-[7px] text-[var(--text-muted)] font-bold uppercase tracking-wider mt-0.5">
                      {isStreaming
                        ? "STREAMING LINK SECURED"
                        : "Awaiting secure handshake..."}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Wifi
                    className={`w-3 h-3 transition-colors duration-500 ${isStreaming ? "text-emerald-500" : "text-[var(--text-muted)]"}`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Control Integrity Guard HUD Footer */}
      <div className="glass-morphism rounded-2xl p-3 border border-[var(--card-border)] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/[0.015] to-transparent pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-8.5 h-8.5 rounded-lg bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-blue-500 group-hover:border-blue-500/20 transition-all duration-500">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest leading-none">
              Clinical Integrity Guard
            </h3>
            <p className="text-[8px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-1.5 leading-relaxed max-w-xl">
              Live telemetry signals are strictly driven by active biosensors.
              Manual records remain pending until synchronized with local
              gateway.
            </p>
          </div>
        </div>
        <button
          onClick={() =>
            showToast("Scanning for clinical bio-sensors...", "info")
          }
          className="px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-550 hover:text-blue-500 text-[8.5px] font-black uppercase tracking-[0.15em] shadow-md transition-all duration-300 active:scale-95 relative z-10 shrink-0 text-center"
        >
          Scan Clinical Grid
        </button>
      </div>
    </div>
  );
}
