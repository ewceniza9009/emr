import React from "react";
import { Skeleton } from "../../ui/skeleton";

export default function CalendarSkeleton() {
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 p-1 animate-in fade-in duration-700 overflow-hidden">
      {/* Clinical Header Skeleton */}
      <div className="shrink-0 flex flex-col gap-2 bg-[var(--card-bg)] px-4 py-3 rounded-2xl border border-[var(--card-border)] shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-6 bg-[var(--primary)] rounded-full shadow-sm shadow-[var(--primary-glow)]" />
            <Skeleton className="h-5 w-40 rounded-md" />
            <div className="flex items-center gap-3 ml-4 border-l border-[var(--card-border)] pl-4">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-6 w-32 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-36 rounded-xl" />
          </div>
        </div>
        <div className="h-px bg-[var(--card-border)] mx-1" />
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-lg" />
            ))}
          </div>
          <div className="flex-1 flex items-center gap-4 border-l border-[var(--card-border)] pl-4">
            <Skeleton className="h-9 w-44 rounded-lg" />
            <div className="flex items-center gap-3 ml-auto opacity-40">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-4 w-12 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Physical Calendar Grid Skeleton */}
      <div className="flex-1 min-h-0 bg-[var(--background)] rounded-2xl border border-[var(--card-border)] flex flex-col overflow-hidden relative">
        {/* Header Row */}
        <div className="grid grid-cols-[80px_1fr] bg-[var(--card-bg)] border-b border-[var(--card-border)] shrink-0">
          <div className="flex items-center justify-center border-r border-[var(--card-border)]">
            <Skeleton className="w-4 h-4 rounded" />
          </div>
          <div className="grid grid-cols-7 divide-x divide-[var(--card-border)]">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex flex-col items-center py-2.5 gap-1.5">
                <Skeleton className="h-3 w-8 rounded" />
                <Skeleton className="h-5 w-6 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Body Skeleton */}
        <div className="flex-1 flex overflow-hidden">
          {/* Time Ribbon */}
          <div className="w-[80px] border-r border-[var(--card-border)] bg-[var(--input-bg)] flex flex-col shrink-0">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-[80px] border-b border-[var(--card-border)] p-2 flex justify-center"
              >
                <Skeleton className="h-3 w-10 rounded mt-1" />
              </div>
            ))}
          </div>

          {/* Grid Area */}
          <div className="flex-1 grid grid-cols-7 divide-x divide-[var(--card-border)] relative">
            {[1, 2, 3, 4, 5, 6, 7].map((col) => (
              <div key={col} className="relative flex flex-col">
                {Array.from({ length: 12 }).map((_, row) => (
                  <div
                    key={row}
                    className="h-[80px] border-b border-[var(--card-border)] p-1.5 relative"
                  >
                    <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-white/5" />
                    {(col + row) % 7 === 0 && (
                      <div className="absolute inset-1.5 bg-white/[0.02] rounded-xl border border-white/5 overflow-hidden">
                        <Skeleton className="h-full w-full" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
