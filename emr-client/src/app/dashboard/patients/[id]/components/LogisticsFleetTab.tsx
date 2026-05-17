"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Activity, Wind } from "lucide-react";
import { AreaChart, Area, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { UsePatientDashboardStateReturn } from "../hooks/usePatientDashboardState";

const EquipmentRegistry = dynamic(
  () => import("@/components/EquipmentRegistry"),
  {
    loading: () => <Skeleton className="h-40 w-full" />,
  },
);

const DocumentVault = dynamic(() => import("@/components/DocumentVault"));

interface LogisticsFleetTabProps {
  state: UsePatientDashboardStateReturn;
}

export function LogisticsFleetTab({ state }: LogisticsFleetTabProps) {
  const {
    patientId,
    vitals,
    telemetryData,
    telemetryEnabled,
    handleToggleTelemetry,
  } = state;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <EquipmentRegistry patientId={patientId} />
      
      <div className="bg-[var(--card-bg)] rounded-[2.5rem] p-10 border border-[var(--card-border)] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-[var(--primary)]" />
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-3 uppercase tracking-tighter">
              <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
              IoT Telemetry Stream
            </h2>
            <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest mt-1">
              Live Sensor Network (Oxygen/Vitals)
            </p>
          </div>
          <button
            onClick={handleToggleTelemetry}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--card-border)] bg-[var(--input-bg)] active:scale-95 transition-all text-left"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                telemetryEnabled
                  ? telemetryData.length > 0
                    ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"
                    : "bg-amber-500 animate-pulse"
                  : "bg-[var(--text-muted)] opacity-50"
              }`}
            />
            <span
              className={`text-[10px] font-black uppercase tracking-widest ${
                telemetryEnabled
                  ? telemetryData.length > 0
                    ? "text-emerald-500"
                    : "text-amber-500"
                  : "text-[var(--text-muted)]"
              }`}
            >
              {telemetryEnabled
                ? telemetryData.length > 0
                  ? "Live IoT Stream ON"
                  : "Initializing Link..."
                : "Telemetry Link OFF"}
            </span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] group hover:border-emerald-500/30 transition-all">
              <div className="flex items-center gap-3">
                <Wind
                  className={`w-5 h-5 ${
                    telemetryEnabled && telemetryData.length > 0
                      ? "text-emerald-400 animate-pulse"
                      : "text-slate-500"
                  }`}
                />
                <span className="text-xs font-black uppercase tracking-tighter">
                  O2 Saturation Feed
                </span>
              </div>
              <span className="text-xl font-black text-emerald-500">
                {vitals.spo2}%
              </span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] group hover:border-rose-500/30 transition-all">
              <div className="flex items-center gap-3">
                <Activity
                  className={`w-5 h-5 ${
                    telemetryEnabled && telemetryData.length > 0
                      ? "text-rose-400 animate-bounce"
                      : "text-slate-500"
                  }`}
                />
                <span className="text-xs font-black uppercase tracking-tighter">
                  Cardiac Pulse Rate
                </span>
              </div>
              <span className="text-xl font-black text-rose-500">
                {vitals.hr} <span className="text-[10px]">BPM</span>
              </span>
            </div>
          </div>
          <div className="bg-black/20 rounded-3xl border border-[var(--card-border)] overflow-hidden h-[180px] relative">
            {telemetryEnabled && telemetryData.length > 0 ? (
              <div className="absolute inset-0 p-4">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={100}
                  minHeight={100}
                >
                  <AreaChart data={telemetryData}>
                    <defs>
                      <linearGradient
                        id="colorHr"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#f43f5e"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#f43f5e"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorSpo2"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ffffff05"
                      vertical={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#000",
                        border: "1px solid #ffffff10",
                        borderRadius: "12px",
                        fontSize: "10px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="hr"
                      stroke="#f43f5e"
                      fillOpacity={1}
                      fill="url(#colorHr)"
                      strokeWidth={3}
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="spo2"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorSpo2)"
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
                <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">
                  Waiting for active IoT Handshake...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <DocumentVault patientId={patientId} />
    </div>
  );
}
