"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  ClipboardList,
  Stethoscope,
  Pill,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Download,
  Loader2,
  Calendar,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import HalcyonPortal from "./Portal";
import CustomDatePicker from "./CustomDatePicker";

interface ShiftReportModalProps {
  open: boolean;
  onClose: () => void;
  practitionerId?: string;
  isAdminView?: boolean;
}

interface ReportData {
  totalEncounters: number;
  unsignedNotes: number;
  diagnosesAdded: number;
  prescriptionsAuthorized: number;
  vitalsLogged: number;
  medicationsAdministered: number;
  triageActionsResolved: number;
  casesTouched: number;
  sdohAssessmentsCompleted: number;
  barriersMitigated: number;
  simulatedRvus: number;
}

export function ShiftReportModal({
  open,
  onClose,
  practitionerId,
  isAdminView,
}: ShiftReportModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  useEffect(() => {
    if (open) {
      setLoading(true);

      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/Report/shift-summary`;

      const queryParams = new URLSearchParams();
      if (selectedDate) {
        queryParams.append("date", selectedDate);
      }
      if (!isAdminView && practitionerId) {
        queryParams.append("practitionerId", practitionerId);
      } else if (!isAdminView && session?.user?.id) {
        queryParams.append("practitionerId", session.user.id);
      }

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      if (typeof window !== "undefined") {
        fetch(url, {
          headers: {
            Authorization: `Bearer ${(session?.user as any)?.token || ""}`,
          },
        })
          .then((res) => res.json())
          .then((resData) => {
            setData(resData);
            setLoading(false);
          })
          .catch((err) => {
            console.error(err);
            setLoading(false);
          });
      }
    }
  }, [open, practitionerId, isAdminView, session, selectedDate]);

  const chartData = data
    ? [
        { name: "Encounters", value: data.totalEncounters, color: "#0ea5e9" },
        { name: "Unsigned", value: data.unsignedNotes, color: "#f43f5e" },
        { name: "Diagnoses", value: data.diagnosesAdded, color: "#8b5cf6" },
        { name: "Rx", value: data.prescriptionsAuthorized, color: "#10b981" },
        { name: "Vitals", value: data.vitalsLogged, color: "#f59e0b" },
      ]
    : [];

  return (
    <HalcyonPortal>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-full flex flex-col glass-morphism rounded-2xl shadow-2xl overflow-hidden border border-[var(--card-border)]"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-[var(--card-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--input-bg)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 flex items-center justify-center border border-teal-500/20 dark:border-teal-500/30 flex-shrink-0">
                    <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
                      {isAdminView ? 'Clinical Report' : 'Your Clinical Shift Report'}
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-black mt-0.5">
                      {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="w-36">
                    <CustomDatePicker 
                      value={selectedDate}
                      onChange={(val) => setSelectedDate(val)}
                      align="right"
                    />
                  </div>
                  <div className="h-6 w-[1px] bg-[var(--card-border)] hidden sm:block" />
                  <button
                    onClick={() => window.print()}
                    className="p-2 rounded-lg hover:bg-[var(--text-primary)]/5 transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    title="Print / PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-[var(--text-primary)]/5 transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto custom-scrollbar">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-teal-500 animate-spin mb-4" />
                    <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">
                      Aggregating Clinical Data...
                    </p>
                  </div>
                ) : data ? (
                  <div className="space-y-6">
                    {/* Highlights */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Stethoscope className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                            Encounters
                          </span>
                        </div>
                        <div className="text-3xl font-bold text-[var(--text-primary)]">
                          {data.totalEncounters}
                        </div>
                      </div>

                      <div className="bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          <span className="text-xs font-bold text-rose-700 dark:text-rose-200/60 uppercase tracking-wider">
                            Unsigned Notes
                          </span>
                        </div>
                        <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">
                          {data.unsignedNotes}
                        </div>
                      </div>

                      <div className="bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Pill className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                            Prescriptions
                          </span>
                        </div>
                        <div className="text-3xl font-bold text-[var(--text-primary)]">
                          {data.prescriptionsAuthorized}
                        </div>
                      </div>

                      <div className="bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          <span className="text-xs font-bold text-teal-700 dark:text-teal-200/60 uppercase tracking-wider">
                            Simulated RVUs
                          </span>
                        </div>
                        <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                          {data.simulatedRvus.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Chart and Secondary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl p-4 h-64">
                        <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4">
                          Activity Overview
                        </h3>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={chartData}
                            margin={{
                              top: 10,
                              right: 5,
                              left: -20,
                              bottom: 20,
                            }}
                          >
                            <XAxis
                              dataKey="name"
                              stroke="#64748b"
                              fontSize={10}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              stroke="#64748b"
                              fontSize={10}
                              tickLine={false}
                              axisLine={false}
                            />
                            <Tooltip
                              cursor={{ fill: "currentColor", opacity: 0.05 }}
                              contentStyle={{
                                backgroundColor: "var(--card-bg)",
                                borderColor: "var(--card-border)",
                                borderRadius: "12px",
                              }}
                              labelStyle={{
                                color: "var(--text-primary)",
                                fontSize: "11px",
                                fontWeight: "bold",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                marginBottom: "4px",
                              }}
                              itemStyle={{
                                color: "var(--text-secondary)",
                                fontSize: "12px",
                                fontWeight: "bold",
                              }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              {chartData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                          Ancillary Actions
                        </h3>
                        <div className="flex items-center justify-between p-3 bg-[var(--input-bg)] rounded-xl border border-[var(--card-border)] hover:border-[var(--primary)]/30 transition-all">
                          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                            Vitals Logged
                          </span>
                          <span className="text-sm font-black text-[var(--text-primary)]">
                            {data.vitalsLogged}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-[var(--input-bg)] rounded-xl border border-[var(--card-border)] hover:border-[var(--primary)]/30 transition-all">
                          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                            Diagnoses Added
                          </span>
                          <span className="text-sm font-black text-[var(--text-primary)]">
                            {data.diagnosesAdded}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-[var(--input-bg)] rounded-xl border border-[var(--card-border)] hover:border-[var(--primary)]/30 transition-all">
                          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                            SDOH Assessments
                          </span>
                          <span className="text-sm font-black text-[var(--text-primary)]">
                            {data.sdohAssessmentsCompleted}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-[var(--input-bg)] rounded-xl border border-[var(--card-border)] hover:border-[var(--primary)]/30 transition-all">
                          <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                            Barriers Mitigated
                          </span>
                          <span className="text-sm font-black text-[var(--text-primary)]">
                            {data.barriersMitigated}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-[var(--text-muted)] py-10">
                    Failed to load report data.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-[var(--input-bg)] border-t border-[var(--card-border)] flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-[var(--primary)]/20"
                >
                  Close Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </HalcyonPortal>
  );
}
