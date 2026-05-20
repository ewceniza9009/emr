"use client";

import React, { useState, useEffect, useRef } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  value: string; // Format: YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function CustomDatePicker({
  value,
  onChange,
  placeholder = "mm/dd/yyyy",
  required,
  disabled,
  className = "",
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const initial = value ? new Date(value) : new Date();
    return isNaN(initial.getTime()) ? new Date().getMonth() : initial.getMonth();
  });
  const [currentYear, setCurrentYear] = useState(() => {
    const initial = value ? new Date(value) : new Date();
    return isNaN(initial.getTime()) ? new Date().getFullYear() : initial.getFullYear();
  });

  // Keep internal calendar month/year synchronized if the incoming value changes from outside
  useEffect(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        setCurrentMonth(parsed.getMonth());
        setCurrentYear(parsed.getFullYear());
      }
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

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
    onChange(formatDate(date));
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

  const getDisplayValue = () => {
    if (!value) return "";
    const parts = value.split("-");
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${m}/${d}/${y}`;
    }
    return value;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        className={`relative ${disabled ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--primary)] opacity-40 pointer-events-none" />
        <div className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl pl-11 pr-4 py-3 text-[11px] font-bold text-[var(--text-primary)] outline-none focus-within:border-[var(--primary)]/50 cursor-pointer flex items-center min-h-[40px] shadow-inner select-none transition-all">
          {getDisplayValue() ? (
            <span className="text-[var(--text-primary)]">{getDisplayValue()}</span>
          ) : (
            <span className="text-[var(--text-muted)] opacity-50">{placeholder}</span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 left-0 right-0 md:w-80 md:right-auto z-[999] bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.6)] select-none"
          >
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-lg hover:bg-[var(--text-primary)]/5 text-[var(--primary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-black uppercase text-[var(--text-primary)] tracking-wider">
                {months[currentMonth].toUpperCase()} {currentYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-lg hover:bg-[var(--text-primary)]/5 text-[var(--primary)] hover:text-[var(--text-primary)] transition-colors"
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

                const isSelected = value === formatDate(day);
                const isToday = formatDate(day) === formatDate(new Date());

                return (
                  <button
                    key={day.getTime()}
                    type="button"
                    onClick={(e) => handleDaySelect(day, e)}
                    className={`h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all mx-auto ${
                      isSelected
                        ? "border border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/10 font-black"
                        : isToday
                        ? "border border-[var(--primary)]/40 text-[var(--primary)] hover:bg-[var(--text-primary)]/5"
                        : "text-[var(--text-primary)] hover:bg-[var(--text-primary)]/5"
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
  );
}
