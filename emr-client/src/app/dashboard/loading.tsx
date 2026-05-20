"use client";

import React from "react";

export default function DashboardLoading() {
  return (
    <div className="w-full h-full space-y-6 animate-pulse p-4">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-800 rounded-lg" />
          <div className="h-4 w-32 bg-slate-800/60 rounded-md" />
        </div>
        <div className="h-10 w-36 bg-slate-800 rounded-xl" />
      </div>

      {/* Grid Layout Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="h-64 bg-slate-800/40 border border-slate-800/50 rounded-2rem p-6 space-y-4">
            <div className="h-4 w-1/4 bg-slate-800 rounded-md" />
            <div className="h-full w-full bg-slate-800/30 rounded-xl" />
          </div>
          <div className="h-48 bg-slate-800/40 border border-slate-800/50 rounded-2rem p-6 space-y-4">
            <div className="h-4 w-1/3 bg-slate-800 rounded-md" />
            <div className="h-full w-full bg-slate-800/30 rounded-xl" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="h-96 bg-slate-800/40 border border-slate-800/50 rounded-2rem p-6 space-y-4">
            <div className="h-4 w-1/2 bg-slate-800 rounded-md" />
            <div className="h-full w-full bg-slate-800/30 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
