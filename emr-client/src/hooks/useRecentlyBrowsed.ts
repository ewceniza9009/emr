"use client";

import { useState, useEffect } from "react";

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
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setRecentItems(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recently browsed items", e);
      }
    }
  }, []);

  const addItem = (item: Omit<RecentItem, "browsedAt">) => {
    setRecentItems((prev) => {
      // Filter out existing item with same ID AND type
      const filtered = prev.filter((p) => !(p.id === item.id && p.type === item.type));
      const updated = [
        { ...item, browsedAt: new Date().toISOString() },
        ...filtered,
      ].slice(0, MAX_RECENT);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return { recentItems, addItem };
}

