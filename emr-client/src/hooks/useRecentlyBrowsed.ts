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



export function useRecentlyBrowsed() {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentItem[];
        // Forensic Cleanup: Remove any residual test data from seeding phase
        const filtered = parsed.filter(item => !item.id.startsWith('seed-'));
        setRecentItems(filtered);
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

