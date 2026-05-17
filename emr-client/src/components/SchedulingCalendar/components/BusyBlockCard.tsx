import React from "react";
import { Shield, Trash2 } from "lucide-react";
import { PermissionGate } from "../../PermissionGate";
import { ScheduleBlock } from "../types";

interface BusyBlockCardProps {
  block: ScheduleBlock;
  layoutMode: "absolute" | "list";
  topPx?: number;
  heightPx?: number;
  durMin: number;
  blockHour: number;
  blockMinute: number;
  draggingDurationRef: React.MutableRefObject<number>;
  draggingAppointmentIdRef: React.MutableRefObject<string | null>;
  onDeleteBlock: (id: string) => void;
  setConfirmModal: React.Dispatch<React.SetStateAction<any>>;
}

export default function BusyBlockCard({
  block,
  layoutMode,
  topPx,
  heightPx,
  durMin,
  blockHour,
  blockMinute,
  draggingDurationRef,
  draggingAppointmentIdRef,
  onDeleteBlock,
  setConfirmModal,
}: BusyBlockCardProps) {
  const start = new Date(block.startTime);

  if (layoutMode === "list") {
    return (
      <div
        draggable
        onDragStart={(e) => {
          draggingDurationRef.current = durMin;
          draggingAppointmentIdRef.current = null;
          e.dataTransfer.setData("blockId", block.blockId);
          e.dataTransfer.setData("duration", durMin.toString());
        }}
        className="text-[10px] px-1.5 py-1 rounded truncate border bg-[var(--input-bg)]/80 border-[var(--card-border)] text-[var(--text-muted)] flex items-center gap-1 cursor-grab active:cursor-grabbing hover:bg-[var(--input-bg)]"
      >
        <Shield className="w-2.5 h-2.5 opacity-50" />
        <span className="font-bold">
          {start.getHours() % 12 || 12}:{start.getMinutes().toString().padStart(2, "0")}
        </span>
        <span className="truncate">Unavailable</span>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={(e) => {
        draggingDurationRef.current = durMin;
        draggingAppointmentIdRef.current = null;
        e.dataTransfer.setData("blockId", block.blockId);
        e.dataTransfer.setData("duration", durMin.toString());
      }}
      className="absolute left-1.5 right-1.5 z-10 rounded-xl bg-[var(--input-bg)]/80 border border-[var(--card-border)] p-3 pr-2 flex flex-col gap-2 cursor-grab active:cursor-grabbing hover:bg-[var(--input-bg)] transition-all shadow-sm group/block"
      style={{ top: `${topPx}px`, height: `${heightPx}px` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-[var(--text-muted)]">
          <Shield className="w-4 h-4 opacity-50 group-hover/block:text-[var(--text-primary)] transition-colors" />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Unavailable
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-bold text-[var(--text-primary)] bg-[var(--card-bg)] border border-[var(--card-border)] px-2 py-1 rounded">
            {blockHour % 12 || 12}:
            {blockMinute.toString().padStart(2, "0")}
          </span>
          <PermissionGate permission="scheduling:manage">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmModal({
                  isOpen: true,
                  title: "Remove Unavailable Block",
                  message:
                    "Are you sure you want to delete this busy block? This time will become available for scheduling.",
                  onConfirm: () => onDeleteBlock(block.blockId),
                });
              }}
              className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all ml-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </PermissionGate>
        </div>
      </div>
    </div>
  );
}
