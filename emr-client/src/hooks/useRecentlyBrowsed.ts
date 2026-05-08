"use client";

import { useState, useEffect, useCallback } from "react";

export interface RecentItem {
  id: string;
  firstName: string;
  lastName: string;
  subtitle?: string; // MRN for patients, Referral Source for outreach
  type: 'PATIENT' | 'OUTREACH';
  browsedAt: string;
}

const STORAGE_KEY = "halcyon_recently_browsed_items";
const MAX_RECENT = 8;

export function useRecentlyBrowsed() {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentItems(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("[useRecentlyBrowsed] localStorage access denied:", e);
    }
  }, []);

  const addItem = useCallback((item: Omit<RecentItem, "browsedAt">) => {
    setRecentItems((prev) => {
      // Filter out existing item with same ID AND type
      const filtered = prev.filter((p) => !(p.id === item.id && p.type === item.type));
      const updated = [
        { ...item, browsedAt: new Date().toISOString() },
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

