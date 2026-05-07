"use client";

import { useState, useEffect } from "react";

export interface RecentPatient {
  patientId: string;
  firstName: string;
  lastName: string;
  mrn: string;
  browsedAt: string;
}

const STORAGE_KEY = "halcyon_recently_browsed_patients";
const MAX_RECENT = 6;

export function useRecentlyBrowsed() {
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setRecentPatients(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recently browsed patients", e);
      }
    }
  }, []);

  const addPatient = (patient: Omit<RecentPatient, "browsedAt">) => {
    setRecentPatients((prev) => {
      const filtered = prev.filter((p) => p.patientId !== patient.patientId);
      const updated = [
        { ...patient, browsedAt: new Date().toISOString() },
        ...filtered,
      ].slice(0, MAX_RECENT);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return { recentPatients, addPatient };
}

