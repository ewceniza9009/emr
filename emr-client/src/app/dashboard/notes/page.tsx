"use client";

import { useNotesState } from "./hooks/useNotesState";
import { NoteSidebar } from "./components/NoteSidebar";
import { NoteEditor } from "./components/NoteEditor";
import { ClinicalContextPanel } from "./components/ClinicalContextPanel";
import BookingDrawer from "@/components/BookingDrawer";
import { useToast } from "@/components/ToastProvider";

export default function ClinicalNotesPage() {
  const state = useNotesState();
  const { showToast } = useToast();

  const {
    loading,
    selectedNote,
    isBookingOpen,
    setIsBookingOpen
  } = state;

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <div className="text-[var(--text-muted)] text-[10px] uppercase font-black tracking-widest animate-pulse">
          Loading documentation registry...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-100px)] gap-4 overflow-hidden animate-in fade-in duration-700">
      <BookingDrawer
        open={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onBooked={() => {
          setIsBookingOpen(false);
          showToast("New Appointment Synchronized", "success");
        }}
      />
      
      {/* Registry Sidebar Panel */}
      <NoteSidebar state={state} />

      {/* Editor & Context Panel */}
      {selectedNote ? (
        <div className="flex-1 flex gap-4 overflow-hidden h-full">
          {/* Main SOAP Note Editor */}
          <NoteEditor state={state} />

          {/* Clinical Context Helper Sidepanel */}
          <ClinicalContextPanel state={state} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[var(--card-bg)] rounded-[2.5rem] border border-[var(--card-border)]">
          <div className="text-center p-10 text-[var(--text-muted)] text-[10px] uppercase font-black tracking-widest italic opacity-50">
            No patient note selected from documentation registry.
          </div>
        </div>
      )}
    </div>
  );
}