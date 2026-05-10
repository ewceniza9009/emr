"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, gql } from "@apollo/client";
import {
  Heart,
  Activity,
  Thermometer,
  Wind,
  Smartphone,
  Wifi,
  Maximize2,
  Search,
  Filter
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import LiveHeartbeat from "@/components/LiveHeartbeat";
import { useMutation } from "@apollo/client";
import { useSession } from "next-auth/react";
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
  const [enabledPatients, setEnabledPatients] = useState<Record<string, boolean>>({});
  const [initializingPatients, setInitializingPatients] = useState<Record<string, boolean>>({});

  const [createEncounter] = useMutation(CREATE_ENCOUNTER);

  const patientsData = useMemo(() => data?.patients?.items || [], [data?.patients?.items]);

  // Auto-enable patients who already have an active encounter
  useEffect(() => {
    if (patientsData.length > 0) {
      const activeStates: Record<string, boolean> = {};
      patientsData.forEach((p: any) => {
        const hasActiveEncounter = p.encounters?.some((e: any) =>
          e.status === "InProgress" || e.status === "Arrived" || e.status === "Triaged"
        );
        if (hasActiveEncounter) {
          activeStates[p.patientId] = true;
        }
      });
      setEnabledPatients(prev => ({ ...activeStates, ...prev }));
    }
  }, [patientsData]);

  const patients = patientsData.filter((p: any) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.mrn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleTelemetry = async (patientId: string) => {
    const isCurrentlyEnabled = !!enabledPatients[patientId];
    const newEnabledState = !isCurrentlyEnabled;

    setEnabledPatients(prev => ({ ...prev, [patientId]: newEnabledState }));

    if (newEnabledState) {
      setInitializingPatients(prev => ({ ...prev, [patientId]: true }));
      try {
        await createEncounter({
          variables: {
            input: {
              patientId: patientId,
              practitionerId: session?.user?.practitionerId || (process.env.NODE_ENV === 'development' ? "c79b9090-6725-460d-8531-1554c46f6f96" : "00000000-0000-0000-0000-000000000000"),
              chiefComplaint: "Dashboard IoT Initialization",
              notes: "Initialized live telemetry link from the global IoT monitoring dashboard.",
              ppsScore: 100
            }
          }
        });
        showToast("Telemetry Link Established", "success");
      } catch (err) {
        console.error("Failed to initialize telemetry:", err);
        showToast("Link Failure: Sensor Network Unreachable", "error");
        setEnabledPatients(prev => ({ ...prev, [patientId]: false }));
      } finally {
        setInitializingPatients(prev => ({ ...prev, [patientId]: false }));
      }
    }
  };


  if (loading) return (
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

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="glass-morphism rounded-2xl border border-[var(--card-border)] p-4 space-y-4">
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

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-600 border border-red-500/20">
        <Activity className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-[var(--text-primary)]">Registry Connection Failed</h2>
      <p className="text-[var(--text-muted)] text-sm max-w-xs">Could not establish a secure connection to the patient data registry.</p>
    </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex items-center justify-between bg-[var(--card-bg)] px-4 py-3 rounded-2xl border border-[var(--card-border)]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center border border-rose-500/20 shadow-lg shadow-rose-500/10">
            <Heart className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">Clinical Telemetry</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/10">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">{patients.length} Nodes Online</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by patient..."
              className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-2 pl-9 pr-4 text-xs text-[var(--text-primary)] focus:border-blue-500/30 transition-all outline-none w-64"
            />
          </div>
          <button className="p-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {patients.map((patient: any) => (
          <div key={patient.patientId} className="glass-morphism rounded-2xl border border-[var(--card-border)] transition-all duration-300 group hover:border-blue-500/30 shadow-xl">
            {/* Patient Info Header */}
            <div className="p-3.5 border-b border-[var(--card-border)] flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)] border border-[var(--card-border)] group-hover:border-blue-500/30 transition-all">
                  {patient.firstName[0]}{patient.lastName[0]}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">{patient.firstName} {patient.lastName}</h3>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mt-0.5">{patient.mrn}</p>
                </div>
              </div>
              <button className="p-1.5 rounded-lg hover:bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Live Telemetry Component (Includes HR, SpO2, and Temp) */}
            <div className="p-3.5">
              <LiveHeartbeat
                patientId={patient.patientId}
                enabled={!!enabledPatients[patient.patientId]}
                onToggle={() => handleToggleTelemetry(patient.patientId)}
                status={initializingPatients[patient.patientId] ? "initializing" : enabledPatients[patient.patientId] ? "live" : "off"}
              />
            </div>

            {/* Device Status Footer */}
            <div className="px-3.5 py-2.5 bg-[var(--input-bg)] border-t border-[var(--card-border)] flex items-center justify-between rounded-b-2xl">
              <div className="flex items-center gap-3">
                <Smartphone className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-tight">Generic IoT Gateway</span>
                  <span className="text-[8px] text-[var(--text-muted)] italic">Awaiting secure handshake...</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Wifi className="w-3 h-3 text-[var(--text-muted)]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Footer */}
      <div className="glass-morphism rounded-3xl p-4 border border-[var(--card-border)] flex items-center justify-between group">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--input-bg)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-blue-400 transition-all duration-500">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">Clinical Integrity Guard</h3>
            <p className="text-[10px] text-[var(--text-secondary)]">Live data is strictly driven by IoT sensor connectivity. Manual records show as pending until synchronized.</p>
          </div>
        </div>
        <button
          onClick={() => showToast("Scanning for clinical bio-sensors...", "info")}
          className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all"
        >
          Scan Clinical Grid
        </button>
      </div>
    </div>
  );
}

