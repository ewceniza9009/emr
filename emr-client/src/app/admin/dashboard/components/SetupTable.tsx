import React from "react";
import { Activity, Edit, Trash2 } from "lucide-react";
import { PermissionGate } from "@/components/PermissionGate";

interface Column {
  key: string;
  label: string;
  render?: (item: any) => React.ReactNode;
}

interface SetupTableProps {
  data: any[];
  columns: Column[];
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
}

export default function SetupTable({
  data,
  columns,
  onEdit,
  onDelete,
}: SetupTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[var(--background)]/50 border-b border-[var(--divider-color)]">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-5 py-3 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]"
              >
                {col.label}
              </th>
            ))}
            <th className="px-5 py-3 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em] text-right">
              Management
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--divider-color)]">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="px-8 py-24 text-center text-[var(--text-muted)] italic text-[11px] font-medium tracking-widest uppercase"
              >
                <Activity className="w-8 h-8 mx-auto mb-4 opacity-20 animate-pulse" />
                No active records detected in this registry segment.
              </td>
            </tr>
          ) : (
            data.map((item, idx) => (
              <tr
                key={idx}
                className="group hover:bg-[var(--primary)]/5 transition-all duration-300 relative"
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={col.key}
                    className={`px-5 py-2.5 text-[11px] transition-all ${
                      colIdx === 0 ? "border-l-2 border-transparent group-hover:border-[var(--primary)]" : ""
                    }`}
                  >
                    <div className="text-[var(--text-secondary)] font-bold tracking-tight uppercase group-hover:text-[var(--text-primary)] transition-colors">
                      {col.render ? col.render(item) : item[col.key]}
                    </div>
                  </td>
                ))}
                <td className="px-5 py-2.5 text-right">
                  <PermissionGate permission="setup:manage">
                    <div className="flex items-center justify-end gap-3 opacity-60 group-hover:opacity-100 transition-all duration-300">
                      <button
                        onClick={() => onEdit(item)}
                        className="h-9 w-9 flex items-center justify-center rounded-xl bg-[var(--input-bg)] hover:bg-[var(--primary)] text-[var(--text-muted)] hover:text-[var(--sidebar-bg)] border border-[var(--card-border)] hover:border-[var(--primary)] transition-all duration-200 shadow-sm hover:shadow-[0_0_12px_rgba(var(--primary-rgb),0.2)] hover:scale-105 active:scale-95"
                        title="Edit Record"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(item)}
                        className="h-9 w-9 flex items-center justify-center rounded-xl bg-[var(--input-bg)] hover:bg-rose-600 text-[var(--text-muted)] hover:text-white border border-[var(--card-border)] hover:border-rose-500 transition-all duration-200 shadow-sm hover:shadow-[0_0_12px_rgba(244,63,94,0.2)] hover:scale-105 active:scale-95"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </PermissionGate>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
