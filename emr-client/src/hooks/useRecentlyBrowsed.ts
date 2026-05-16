"use client";

import { useState, useEffect, useCallback } from "react";

export interface RecentItem {
  id: string;
  firstName: string;
  lastName: string;
  subtitle?: string; // MRN for patients, Referral Source for outreach
  type: 'PATIENT' | 'OUTREACH';
  browsedAt: string;
  visitCount?: number;
}

const STORAGE_KEY = "halcyon_recently_browsed_items";
const MAX_RECENT = 10;

// Hardened Seed Data: 2-3 counts of the same names to test UI distinctness
const SEED_ITEMS: RecentItem[] = [
  { id: "seed-p1", firstName: "Naomi", lastName: "Ankunding", subtitle: "PRN-88291", type: "PATIENT", browsedAt: new Date().toISOString(), visitCount: 1 },
  { id: "seed-p2", firstName: "Naomi", lastName: "Ankunding", subtitle: "PRN-44210", type: "PATIENT", browsedAt: new Date().toISOString(), visitCount: 2 },
  { id: "seed-o1", firstName: "Derrick", lastName: "Kassulke", subtitle: "Facility Referral", type: "OUTREACH", browsedAt: new Date().toISOString(), visitCount: 1 },
  { id: "seed-o2", firstName: "Derrick", lastName: "Kassulke", subtitle: "Walk-in Lead", type: "OUTREACH", browsedAt: new Date().toISOString(), visitCount: 3 },
  { id: "seed-o3", firstName: "Derrick", lastName: "Kassulke", subtitle: "Provider Portal", type: "OUTREACH", browsedAt: new Date().toISOString(), visitCount: 1 },
];

export function useRecentlyBrowsed() {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentItems(JSON.parse(stored));
      } else {
        // First load: Seed with hardened duplicate-name data
        setRecentItems(SEED_ITEMS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ITEMS));
      }
    } catch (e) {
      console.warn("[useRecentlyBrowsed] localStorage access denied:", e);
    }
  }, []);

  const addItem = useCallback((item: Omit<RecentItem, "browsedAt" | "visitCount">) => {
    setRecentItems((prev) => {
      const existing = prev.find((p) => p.id === item.id && p.type === item.type);
      const visitCount = (existing?.visitCount || 0) + 1;
      
      const filtered = prev.filter((p) => !(p.id === item.id && p.type === item.type));
      const updated = [
        { ...item, browsedAt: new Date().toISOString(), visitCount },
        ...filtered,
      ].slice(0, MAX_RECENT);
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn("[useRecentlyBrowsed] could not save to localStorage:", e);
      }
      return updated;
    });
  }, []);

  return { recentItems, addItem };
}

