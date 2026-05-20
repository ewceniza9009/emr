"use client";

import React, { useRef, useState, useEffect } from "react";
import { X, ClipboardCheck, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { PermissionGate } from "../../PermissionGate";
import { EnrollmentState } from "../hooks/useEnrollmentState";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  state: EnrollmentState;
}

export default function DispositionModal({ state }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const initial = state.followUpDate ? new Date(state.followUpDate) : new Date();
    return isNaN(initial.getTime()) ? new Date().getMonth() : initial.getMonth();
  });
  const [currentYear, setCurrentYear] = useState(() => {
    const initial = state.followUpDate ? new Date(state.followUpDate) : new Date();
    return isNaN(initial.getTime()) ? new Date().getFullYear() : initial.getFullYear();
  });

  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!state.showDispositionModal) return null;

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const formatDate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleDaySelect = (date: Date, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    state.setFollowUpDate(formatDate(date));
    setIsOpen(false);
  };

  const getDaysInMonthGrid = () => {
    const date = new Date(currentYear, currentMonth, 1);
    const days = [];
    const startDayOfWeek = date.getDay();

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let day = 1; day <= totalDays; day++) {
      days.push(new Date(currentYear, currentMonth, day));
    }

    return days;
  };

  return (
    <div className="fixed inset-0 z-[99999999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={() => state.setShowDispositionModal(false)}
      />
      <div className="relative w-full max-w-md bg-[var(--sidebar-bg)] border border-[var(--card-border)] rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/20">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">
                Capture Disposition
              </h3>
              <p className="text-[9px] font-bold text-[var(--primary)] uppercase tracking-widest opacity-60">
                Status: {state.pendingOutcome}
              </p>
            </div>
          </div>
          <button
            onClick={() => state.setShowDispositionModal(false)}
            className="text-[var(--text-muted)] hover:text-rose-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">
              Interaction Notes / Reason
            </label>
            <textarea
              value={state.logNotes}
              onChange={(e) => state.setLogNotes(e.target.value)}
              placeholder="Provide clinical context or specific outcome reason..."
              rows={4}
              className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl px-4 py-3 text-[11px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 resize-none shadow-inner"
            />
          </div>

          <div className="space-y-2 relative" ref={calendarRef}>
            <label className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">
              Next Follow-Up Plan
            </label>
            <div
              className="relative cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen((prev) => !prev);
              }}
            >
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--primary)] opacity-40 pointer-events-none" />
              <div className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl pl-11 pr-4 py-3 text-[11px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--primary)]/50 [color-scheme:dark] cursor-pointer flex items-center min-h-[40px]">
                {state.followUpDate ? (
                  (() => {
                    const [y, m, d] = state.followUpDate.split("-");
                    return y && m && d ? `${m}/${d}/${y}` : state.followUpDate;
                  })()
                ) : (
                  <span className="text-[var(--text-muted)] opacity-50">mm/dd/yyyy</span>
                )}
              </div>
            </div>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full mb-2 left-0 right-0 z-50 bg-[#0e1620]/95 backdrop-blur-md border border-[#202e3f] rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] select-none"
                >
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={handlePrevMonth}
                      className="p-1 rounded-lg hover:bg-white/5 text-[var(--primary)] hover:text-white transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-black uppercase text-[var(--text-primary)] tracking-wider">
                      {months[currentMonth]} {currentYear}
                    </span>
                    <button
                      onClick={handleNextMonth}
                      className="p-1 rounded-lg hover:bg-white/5 text-[var(--primary)] hover:text-white transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center mb-1">
                    {daysOfWeek.map((day) => (
                      <span key={day} className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50">
                        {day}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center">
                    {getDaysInMonthGrid().map((day, idx) => {
                      if (!day) return <div key={`empty-${idx}`} className="h-7 w-7" />;

                      const isSelected = state.followUpDate === formatDate(day);
                      const isToday = formatDate(day) === formatDate(new Date());

                      return (
                        <button
                          key={day.getTime()}
                          onClick={(e) => handleDaySelect(day, e)}
                          className={`h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all mx-auto ${
                            isSelected
                              ? "bg-[var(--primary)] text-black font-black"
                              : isToday
                              ? "border border-[var(--primary)]/40 text-[var(--primary)] hover:bg-white/5"
                              : "text-[var(--text-primary)] hover:bg-white/5"
                          }`}
                        >
                          {day.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => state.setShowDispositionModal(false)}
              className="flex-1 h-12 rounded-xl bg-white/5 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              Abort
            </button>
            <PermissionGate permission="outreach:manage">
              <button
                onClick={state.confirmLogActivity}
                className="flex-[2] h-12 rounded-xl bg-[var(--primary)] text-black text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_25px_rgba(var(--primary-rgb),0.4)] transition-all active:scale-95"
              >
                Commit Disposition
              </button>
            </PermissionGate>
          </div>
        </div>
      </div>
    </div>
  );
}
