import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ChevronLeft,
  Stethoscope,
  Users,
  Zap,
  RefreshCcw,
  ClipboardList,
  MapPin
} from "lucide-react";

export function VisitHeader({ state }: { state: any }) {
  const router = useRouter();
  const { data: session } = useSession();

  const {
    patient,
    appointment,
    persistenceKey,
    confirm,
  } = state;

  return (
    <header className="h-20 border-b border-[var(--divider-color)] bg-[var(--background)]/80 backdrop-blur-3xl flex items-center justify-between px-8 z-[100] sticky top-0 transition-all duration-500 shrink-0">
      <div className="flex items-center gap-6">
        <button
          onClick={() => router.push(`/dashboard/patients/${patient?.patientId || ""}`)}
          className="w-10 h-10 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 transition-all flex items-center justify-center group active:scale-95"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black text-[var(--text-primary)] tracking-tight uppercase leading-none">
              {patient?.firstName} {patient?.lastName}
            </h1>
            <div className="flex items-center gap-2 px-2 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/20">
              <span className="w-1 h-1 rounded-full bg-teal-500 animate-pulse" />
              <span className="text-[9px] font-bold text-teal-500 uppercase tracking-widest">ACTIVE ENCOUNTER</span>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">MRN</span>
              <span className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-tighter bg-[var(--input-bg)] px-2 py-0.5 rounded-md border border-[var(--card-border)]">
                {patient?.mrn || 'PENDING'}
              </span>
            </div>
            <div className="w-px h-3 bg-[var(--divider-color)]" />
            <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] uppercase tracking-[0.1em] font-bold">
              <span className={patient?.biologicalSex === 'MALE' ? 'text-blue-400' : 'text-rose-400'}>{patient?.biologicalSex}</span>
              <span className="opacity-30">•</span>
              <span>{patient?.dob && new Date(patient.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
            {appointment?.visitType && (
              <>
                <div className="w-px h-3 bg-[var(--divider-color)]" />
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] text-[8px] font-black uppercase tracking-wider">
                  <ClipboardList className="w-2.5 h-2.5" />
                  {appointment.visitType.replace(/_/g, ' ')}
                </span>
              </>
            )}
            {appointment?.modality && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[8px] font-black uppercase tracking-wider">
                <MapPin className="w-2.5 h-2.5" />
                {appointment.modality.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center">
        {appointment?.supportingClinicians?.length > 0 && (
          <div className="hidden xl:flex items-center pr-10">
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5 mb-1 opacity-50">
                <Users className="w-2.5 h-2.5 text-blue-400" />
                <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none">Support Team</p>
              </div>
              <div className="flex -space-x-2 justify-end">
                {appointment.supportingClinicians.map((sc: any) => (
                  <div
                    key={sc.practitionerId}
                    className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[9px] font-black text-blue-500 shadow-sm cursor-help group/sc relative"
                    title={`${sc.firstName} ${sc.lastName} (${sc.position})`}
                  >
                    {sc.firstName[0]}{sc.lastName[0]}
                    <div className="absolute top-10 right-0 bg-[var(--card-bg)] border border-[var(--card-border)] p-2 rounded-lg shadow-2xl opacity-0 group-hover/sc:opacity-100 pointer-events-none transition-all z-[110] whitespace-nowrap text-left">
                      <p className="text-[10px] font-black text-[var(--text-primary)] uppercase">{sc.firstName} {sc.lastName}</p>
                      <p className="text-[8px] text-blue-400 font-bold uppercase tracking-widest mt-0.5">{sc.position}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="w-px h-8 bg-[var(--divider-color)] hidden xl:block" />

        <div className="flex items-center gap-6 pl-10">
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 mb-1 opacity-50">
              <Zap className="w-2.5 h-2.5 text-teal-400" />
              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none">Practitioner Context</p>
            </div>
            <p className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">{session?.user?.name || "System Admin"}</p>
          </div>

          <div className="relative group">
            <div className="w-10 h-10 rounded-xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center justify-center shadow-2xl group-hover:border-teal-500/30 transition-all cursor-pointer">
              <Stethoscope className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[var(--background)]" />
          </div>
        </div>

        <div className="flex items-center ml-6 border-l border-[var(--divider-color)] pl-6">
          <button
            onClick={async () => {
              const ok = await confirm({
                title: "Abort Mission",
                message: "This will clear all unsaved clinical data for this session and refresh the page. This action cannot be undone. Proceed?",
                type: "danger"
              });
              if (ok) {
                localStorage.removeItem(persistenceKey);
                window.location.reload();
              }
            }}
            className="w-10 h-10 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all group active:scale-95 flex items-center justify-center"
            title="Reset Session"
          >
            <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>
      </div>
    </header>
  );
}
