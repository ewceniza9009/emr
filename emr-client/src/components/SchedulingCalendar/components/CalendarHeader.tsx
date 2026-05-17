import React from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  Search, 
  Home, 
  Building2, 
  Video, 
  Phone, 
  Users 
} from "lucide-react";
import { PermissionGate } from "../../PermissionGate";
import { POSITION_STYLE } from "../constants";
import { CalendarView, Practitioner } from "../types";

interface CalendarHeaderProps {
  view: CalendarView;
  setView: (view: CalendarView) => void;
  anchor: Date;
  setAnchor: (date: Date) => void;
  monthLabel: string;
  loading: boolean;
  refetch: () => void;
  setDrawerOpen: (open: boolean) => void;
  apiPositions: string[];
  selectedPositions: Set<string>;
  togglePosition: (pos: string) => void;
  practitioners: Practitioner[];
  selectedPractitioners: Set<string>;
  setSelectedPractitioners: (ids: Set<string>) => void;
  setSelectedPositions: (pos: Set<string>) => void;
}

export default function CalendarHeader({
  view,
  setView,
  anchor,
  setAnchor,
  monthLabel,
  loading,
  refetch,
  setDrawerOpen,
  apiPositions,
  selectedPositions,
  togglePosition,
  practitioners,
  selectedPractitioners,
  setSelectedPractitioners,
  setSelectedPositions,
}: CalendarHeaderProps) {
  return (
    <div className="shrink-0 flex flex-col gap-2 bg-[var(--card-bg)] px-4 py-3 rounded-2xl border border-[var(--card-border)] shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-6 bg-[var(--primary)] rounded-full shadow-sm shadow-[var(--primary-glow)]" />
          <h1 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tighter">
            Clinical Scheduling
          </h1>
          <div className="flex items-center gap-3 ml-4 border-l border-[var(--card-border)] pl-4">
            <div className="flex bg-[var(--input-bg)] rounded-lg p-0.5 border border-[var(--card-border)] mr-2">
              <button
                onClick={() => setView("month")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${view === "month" ? "bg-[var(--card-bg)] text-[var(--primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
              >
                Month
              </button>
              <button
                onClick={() => setView("week")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${view === "week" ? "bg-[var(--card-bg)] text-[var(--primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
              >
                Week
              </button>
              <button
                onClick={() => setView("team")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${view === "team" ? "bg-[var(--card-bg)] text-[var(--primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
              >
                Team Day
              </button>
            </div>
            <button
              onClick={() => {
                const next = new Date(anchor);
                if (view === "month") {
                  next.setMonth(next.getMonth() - 1);
                } else {
                  next.setDate(next.getDate() - (view === "week" ? 7 : 1));
                }
                setAnchor(next);
              }}
              className="p-1.5 hover:bg-[var(--primary)]/10 rounded-xl text-[var(--text-muted)] transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                setAnchor(today);
              }}
              className="px-3 py-1 bg-[var(--input-bg)] border border-[var(--card-border)] hover:bg-[var(--primary)]/10 hover:border-[var(--primary)]/30 rounded-lg text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all shadow-sm"
            >
              Today
            </button>
            <span className="text-sm font-black text-[var(--text-primary)] min-w-[140px] text-center tracking-tight">
              {view === "month" 
                ? monthLabel 
                : view === "week" 
                  ? monthLabel 
                  : anchor.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            </span>
            <button
              onClick={() => {
                const next = new Date(anchor);
                if (view === "month") {
                  next.setMonth(next.getMonth() + 1);
                } else {
                  next.setDate(next.getDate() + (view === "week" ? 7 : 1));
                }
                setAnchor(next);
              }}
              className="p-1.5 hover:bg-[var(--primary)]/10 rounded-xl text-[var(--text-muted)] transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 hover:bg-[var(--primary)]/10 rounded-lg text-[var(--text-secondary)]"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
          </button>
          <PermissionGate permission="scheduling:manage">
            <button
              onClick={() => {
                setDrawerOpen(true);
              }}
              className="px-4 h-9 bg-[var(--primary)] hover:opacity-90 rounded-lg text-xs font-bold text-white transition-all active:scale-95 shadow-sm shadow-[var(--primary-glow)]"
            >
              New Encounter
            </button>
          </PermissionGate>
        </div>
      </div>

      <div className="h-px bg-[var(--card-border)] mx-1" />

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {apiPositions.map((pos) => {
            const style = POSITION_STYLE[pos] ?? {
              label: pos,
              icon: <Users className="w-3 h-3" />,
            };
            const isActive = selectedPositions.has(pos);
            return (
              <button
                key={pos}
                onClick={() => togglePosition(pos)}
                className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-2
                       ${isActive ? `bg-[var(--primary)]/10 border-[var(--primary)]/30 text-[var(--primary)] ring-1 ring-[var(--primary)]/20` : "bg-transparent border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5"}`}
              >
                {style.icon}
                <span className="capitalize">{pos}</span>
              </button>
            );
          })}
        </div>
        <div className="flex-1 flex items-center gap-4">
          <div className="relative flex-1 max-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-muted)]" />
            <select
              onChange={(e) => {
                const id = e.target.value;
                if (!id) {
                  setSelectedPractitioners(new Set());
                } else {
                  const p = practitioners.find((x) => x.practitionerId === id);
                  setSelectedPractitioners(new Set([id]));
                  if (p) {
                    setSelectedPositions(new Set([p.position.toLowerCase()]));
                  }
                }
              }}
              className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg pl-8 pr-10 py-1.5 text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--primary)] outline-none appearance-none cursor-pointer hover:border-[var(--primary)]/30 transition-all"
              value={
                selectedPractitioners.size === 1
                  ? Array.from(selectedPractitioners)[0]
                  : ""
              }
            >
              <option
                value=""
                className="bg-[var(--card-bg)] text-[var(--text-primary)]"
              >
                All Practitioners...
              </option>
              {practitioners.map((p) => (
                <option
                  key={p.practitionerId}
                  value={p.practitionerId}
                  className="bg-[var(--card-bg)] text-[var(--text-primary)]"
                >
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-muted)] pointer-events-none rotate-90" />
          </div>

          <div className="h-4 w-px bg-[var(--card-border)]" />

          <div className="flex items-center gap-4">
            <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">
              Modality:
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 opacity-60">
                <Home className="w-3 h-3 text-[var(--primary)]" />
                <span className="text-[10px] font-bold">Home</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-60">
                <Building2 className="w-3 h-3 text-[var(--primary)]" />
                <span className="text-[10px] font-bold">Facility</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-60">
                <Video className="w-3 h-3 text-[var(--primary)]" />
                <span className="text-[10px] font-bold">Telehealth</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-60">
                <Phone className="w-3 h-3 text-[var(--primary)]" />
                <span className="text-[10px] font-bold">Telephone</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
