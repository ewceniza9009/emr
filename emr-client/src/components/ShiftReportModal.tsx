'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, ClipboardList, Stethoscope, Pill, CheckCircle2, AlertTriangle, TrendingUp, Download, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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

export function ShiftReportModal({ open, onClose, practitionerId, isAdminView }: ShiftReportModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (open) {
      setLoading(true);
      
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/Report/shift-summary`;
      
      const queryParams = new URLSearchParams();
      if (selectedDate) {
        queryParams.append('date', selectedDate);
      }
      if (!isAdminView && practitionerId) {
        queryParams.append('practitionerId', practitionerId);
      } else if (!isAdminView && session?.user?.id) {
        queryParams.append('practitionerId', session.user.id);
      }
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      fetch(url, {
        headers: {
          'Authorization': `Bearer ${(session?.user as any)?.token || ''}`
        }
      })
        .then(res => res.json())
        .then((resData) => {
          setData(resData);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [open, practitionerId, isAdminView, session, selectedDate]);

  if (!open) return null;

  const chartData = data ? [
    { name: 'Encounters', value: data.totalEncounters, color: '#0ea5e9' },
    { name: 'Unsigned', value: data.unsignedNotes, color: '#f43f5e' },
    { name: 'Diagnoses', value: data.diagnosesAdded, color: '#8b5cf6' },
    { name: 'Rx', value: data.prescriptionsAuthorized, color: '#10b981' },
    { name: 'Vitals', value: data.vitalsLogged, color: '#f59e0b' }
  ] : [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-full flex flex-col glass-morphism rounded-2xl shadow-2xl overflow-hidden border border-white/10"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
                <FileText className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {isAdminView ? 'System-Wide Clinical Report' : 'Your Clinical Shift Report'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-white/50 uppercase tracking-widest font-bold">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-white/10 border border-white/20 text-white text-xs rounded px-2 py-1 outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                title="Print / PDF"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
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
                <p className="text-sm font-bold text-white/50 uppercase tracking-widest">Aggregating Clinical Data...</p>
              </div>
            ) : data ? (
              <div className="space-y-6">
                
                {/* Highlights */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Stethoscope className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Encounters</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{data.totalEncounters}</div>
                  </div>
                  
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span className="text-xs font-bold text-rose-200/60 uppercase tracking-wider">Unsigned Notes</span>
                    </div>
                    <div className="text-3xl font-bold text-rose-400">{data.unsignedNotes}</div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Pill className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Prescriptions</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{data.prescriptionsAuthorized}</div>
                  </div>

                  <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-teal-400" />
                      <span className="text-xs font-bold text-teal-200/60 uppercase tracking-wider">Simulated RVUs</span>
                    </div>
                    <div className="text-3xl font-bold text-teal-400">{data.simulatedRvus.toFixed(2)}</div>
                  </div>
                </div>

                {/* Chart and Secondary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-4 h-64">
                    <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-4">Activity Overview</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          cursor={{ fill: '#ffffff10' }}
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Ancillary Actions</h3>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                      <span className="text-sm text-white/80">Vitals Logged</span>
                      <span className="text-sm font-bold text-white">{data.vitalsLogged}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                      <span className="text-sm text-white/80">Diagnoses Added</span>
                      <span className="text-sm font-bold text-white">{data.diagnosesAdded}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                      <span className="text-sm text-white/80">SDOH Assessments</span>
                      <span className="text-sm font-bold text-white">{data.sdohAssessmentsCompleted}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                      <span className="text-sm text-white/80">Barriers Mitigated</span>
                      <span className="text-sm font-bold text-white">{data.barriersMitigated}</span>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center text-white/50 py-10">Failed to load report data.</div>
            )}
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex justify-end">
             <button
               onClick={onClose}
               className="px-6 py-2 rounded-xl bg-white text-slate-900 text-sm font-bold hover:bg-teal-50 transition-colors shadow-lg"
             >
               Close Report
             </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
