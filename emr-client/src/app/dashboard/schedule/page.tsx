"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const SchedulingCalendar = dynamic(() => import("@/components/SchedulingCalendar"), {
  loading: () => (
    <div className="flex flex-col gap-4 p-4">
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="flex-1 min-h-[700px]">
        <Skeleton className="h-full w-full rounded-2xl" />
      </div>
    </div>
  )
});

export default function SchedulePage() {
  return <SchedulingCalendar />;
}
