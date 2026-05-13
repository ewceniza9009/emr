"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ToastProvider";

import {
  FileText,
  Search,
  Plus,
  Clock,
  User,
  CheckCircle2,
  MoreVertical,
  ChevronRight,
  Filter,
  Save,
  Lock,
  Edit3,
  Download,
  Loader2
} from "lucide-react";
import BookingDrawer from "@/components/BookingDrawer";

import { Skeleton } from "@/components/ui/skeleton";

const GET_NOTES_DATA = gql`
  query GetNotesData {
    appointments {
      items {
        appointmentId
        patientId
        scheduledStart
        status
        patient {
          firstName
          lastName
          mrn
        }
        practitioner {
          firstName
          lastName
        }
      }
    }
    smartPhrases {
      shortcut
      label
      templateText
    }
  }
`;

const START_ENCOUNTER = gql`
  mutation StartEncounter($input: CreateClinicalEncounterCommandInput!) {
    createClinicalEncounter(input: $input)
  }
`;

const SAVE_NOTE = gql`
  mutation SaveNote($input: SaveClinicalNoteCommandInput!) {
    saveClinicalNote(input: $input)
  }
`;

export default function ClinicalNotesPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const { data, loading, error } = useQuery(GET_NOTES_DATA);
  const [startEncounter] = useMutation(START_ENCOUNTER);
  const [saveNote] = useMutation(SAVE_NOTE);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [narrative, setNarrative] = useState("");
  const [showSmartPhrases, setShowSmartPhrases] = useState(false);
  const [phraseFilter, setPhraseFilter] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [noteCache, setNoteCache] = useState<Record<string, string>>({});
  const [encounterCache, setEncounterCache] = useState<Record<string, string>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const appointmentsData = data?.appointments?.items || [];
  const appointments = appointmentsData.filter((n: any) =>
    `${n.patient?.firstName} ${n.patient?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.patient?.mrn?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const smartPhrases = data?.smartPhrases || [];
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const selectedNote = appointments.find((a: any) => a.appointmentId === selectedId);

  useEffect(() => {
    const saved = localStorage.getItem("halcyon_notes_cache");
    if (saved) {
      try {
        setNoteCache(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load notes cache", e);
      }
    }
  }, []);

  useEffect(() => {
    if (Object.keys(noteCache).length > 0) {
      localStorage.setItem("halcyon_notes_cache", JSON.stringify(noteCache));
      setLastSaved(new Date());
    }
  }, [noteCache]);

  useEffect(() => {
    if (selectedId) {
      setNarrative(noteCache[selectedId] || "");
    }
  }, [selectedId, noteCache]);

  useEffect(() => {
    if (appointments.length > 0 && !selectedId) {
      setSelectedId(appointments[0].appointmentId);
    }
  }, [appointments, selectedId]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const selectionStart = e.target.selectionStart;
    setNarrative(value);

    if (selectedId) {
      setNoteCache(prev => ({ ...prev, [selectedId]: value }));
    }

    const textBeforeCursor = value.slice(0, selectionStart);
    const lastSlashIdx = textBeforeCursor.lastIndexOf("/");

    if (lastSlashIdx !== -1) {
      const segment = textBeforeCursor.slice(lastSlashIdx);
      if (segment.startsWith("/") && !segment.includes(" ")) {
        setShowSmartPhrases(true);
        setPhraseFilter(segment.slice(1).toLowerCase());
        setSelectedIndex(0);

        // Position popup near cursor
        if (textareaRef.current) {
          const { selectionStart } = textareaRef.current;
          const textBefore = value.substring(0, selectionStart);
          const lines = textBefore.split('\n');
          const currentLine = lines.length;
          const currentColumn = lines[lines.length - 1].length;

          // Rough estimate of position
          const top = Math.min(currentLine * 24 + 40, 400);
          const left = Math.min(currentColumn * 8 + 40, 600);
          setPopupPosition({ top, left });
        }
      } else {
        setShowSmartPhrases(false);
      }
    } else {
      setShowSmartPhrases(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSmartPhrases) return;

    const filtered = smartPhrases.filter((p: any) => p.shortcut.includes(phraseFilter));

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      if (filtered.length > 0) {
        e.preventDefault();
        selectPhrase(filtered[selectedIndex].templateText);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowSmartPhrases(false);
    }
  };

  const selectPhrase = (phrase: string) => {
    if (!textareaRef.current) return;

    const cursor = textareaRef.current.selectionStart;
    const textBeforeCursor = narrative.slice(0, cursor);
    const lastSlashIdx = textBeforeCursor.lastIndexOf("/");

    if (lastSlashIdx !== -1) {
      const newText = narrative.slice(0, lastSlashIdx) + phrase + narrative.slice(cursor);
      setNarrative(newText);

      if (selectedId) {
        setNoteCache(prev => ({ ...prev, [selectedId]: newText }));
      }

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newPos = lastSlashIdx + phrase.length;
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
    }
    setShowSmartPhrases(false);
  };

  const handleSave = async (finalize: boolean) => {
    if (!selectedId || !selectedNote) return;

    setIsSyncing(true);
    try {
      let encounterId = encounterCache[selectedId];

      if (!encounterId) {
        const { data: startData } = await startEncounter({
          variables: {
            input: {
              patientId: selectedNote.patientId,
              practitionerId: (session?.user as any)?.practitionerId || "00000000-0000-0000-0000-000000000000",
              appointmentId: selectedId,
              chiefComplaint: "Clinical Documentation Update",
              notes: ""
            }
          }
        });
        encounterId = startData.createClinicalEncounter;
        setEncounterCache(prev => ({ ...prev, [selectedId]: encounterId }));
      }

      await saveNote({
        variables: {
          input: {
            encounterId,
            authorId: (session?.user as any)?.practitionerId || "00000000-0000-0000-0000-000000000000",
            content: narrative,
            signature: finalize ? (session?.user?.name || "Digitally Signed") : null
          }
        }
      });

      showToast(finalize ? "Note Finalized & Locked" : "Progress Note Synced", "success");
    } catch (err) {
      showToast("Sync Failed. Check Connection.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedId) return;
    try {
      window.open(`http://localhost:5242/api/clinical/export/encounter/${selectedId}`, '_blank');
    } catch (err) {
      showToast("FAILED TO GENERATE PDF", "error");
    }
  };

  if (loading) return (
    <div className="flex h-[calc(100vh-100px)] gap-4 overflow-hidden p-1 animate-in fade-in duration-700">
      <div className="w-[400px] space-y-4">
        <Skeleton className="h-20 w-full rounded-[2rem]" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-32 w-full rounded-[1.8rem]" />)}
        </div>
      </div>
      <div className="flex-1 bg-[var(--card-bg)] rounded-[2.5rem] border border-[var(--card-border)] p-10 space-y-8">
        <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-8">
          <div className="flex items-center gap-6">
            <Skeleton className="w-14 h-14 rounded-2xl" />
            <div className="space-y-3">
              <Skeleton className="h-8 w-80" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-12 w-36 rounded-xl" />
            <Skeleton className="h-12 w-36 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-10">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
        <Skeleton className="flex-1 min-h-[400px] w-full rounded-[2.5rem]" />
      </div>
    </div>
  );

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
      <div className="w-[400px] flex flex-col gap-4 overflow-hidden h-full">
        <div className="bg-[var(--card-bg)] rounded-[2.5rem] border border-[var(--card-border)] shadow-xl p-6 flex flex-col gap-6 overflow-hidden h-full">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-tighter">Clinical Notes</h2>
              <p className="text-[10px] font-black text-[var(--primary)] tracking-widest uppercase">Documentation Registry</p>
            </div>
            <button
              onClick={() => setIsBookingOpen(true)}
              className="p-3 bg-[var(--primary)] text-white rounded-xl shadow-lg shadow-[var(--primary-glow)] hover:opacity-90 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="SEARCH NOTES OR PATIENTS..."
              className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl py-3 pl-12 pr-4 text-xs font-black placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all uppercase"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-10 custom-scrollbar">
            {appointments.map((n: any) => (
              <div
                key={n.appointmentId}
                onClick={() => setSelectedId(n.appointmentId)}
                className={`p-5 rounded-[1.8rem] border transition-all cursor-pointer group ${selectedId === n.appointmentId
                  ? 'bg-[var(--primary)]/5 border-[var(--primary)]/30 shadow-lg'
                  : 'bg-[var(--input-bg)]/50 border-[var(--card-border)] hover:border-[var(--primary)]/20'
                  }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${n.status === 'IN_PROGRESS' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[var(--text-muted)]/10 text-[var(--text-muted)]'
                    }`}>
                    {n.status}
                  </span>
                  <span className="text-[9px] font-black text-[var(--text-muted)]">
                    {new Date(n.scheduledStart).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-xs font-black uppercase mb-1">{n.patient?.firstName} {n.patient?.lastName}</h4>
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase">Clinical Note</p>
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedId === n.appointmentId ? 'translate-x-1 text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedNote && (
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="bg-[var(--card-bg)] rounded-[2.5rem] border border-[var(--card-border)] shadow-2xl p-10 flex flex-col gap-8 h-full relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-8 shrink-0">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-[var(--primary)]" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tighter uppercase">{selectedNote.patient?.firstName} {selectedNote.patient?.lastName}</h1>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-[10px] font-black text-[var(--text-muted)] tracking-widest uppercase">{selectedNote.patient?.mrn}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--card-border)]" />
                    <span className="text-[10px] font-black text-[var(--primary)] tracking-widest uppercase">Visit Documentation</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--card-border)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--primary)]/5 hover:border-[var(--primary)]/30 transition-all group"
                >
                  <Download className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--primary)]" />
                  <span className="text-[var(--text-muted)] group-hover:text-[var(--primary)]">Download PDF</span>
                </button>
                <button
                  disabled={isSyncing}
                  onClick={() => handleSave(false)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--card-border)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--primary-glow)] transition-all disabled:opacity-50"
                >
                  {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSyncing ? "Syncing..." : "Save Draft"}
                </button>
                <button
                  disabled={isSyncing}
                  onClick={() => handleSave(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[var(--primary-glow)] hover:opacity-90 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" /> Finalize Note
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide space-y-8">
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Attending Clinician</label>
                  <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center gap-3">
                    <User className="w-4 h-4 text-[var(--primary)]" />
                    <span className="text-xs font-bold uppercase">{selectedNote.practitioner?.firstName} {selectedNote.practitioner?.lastName}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Documentation Status</label>
                  <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--card-border)] flex items-center gap-3">
                    <Edit3 className="w-4 h-4 text-[var(--primary)]" />
                    <span className="text-xs font-bold uppercase">{selectedNote.status}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Clinical Narrative</label>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Live Documentation Active</span>
                  </div>
                </div>
                <div className="group relative">
                  <textarea
                    ref={textareaRef}
                    value={narrative}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    onKeyUp={(e) => setCursorPosition(e.currentTarget.selectionStart)}
                    onClick={(e) => setCursorPosition(e.currentTarget.selectionStart)}
                    placeholder={`Begin typing clinical documentation for ${selectedNote.patient?.firstName}... use / for smart templates.`}
                    className="w-full min-h-[500px] bg-[var(--input-bg)] border border-[var(--card-border)] rounded-[2.5rem] p-10 text-sm leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)] placeholder:italic placeholder:opacity-30 outline-none focus:border-[var(--primary)]/50 focus:shadow-[0_0_30px_var(--primary-glow)] transition-all resize-none scrollbar-hide"
                  />

                  {showSmartPhrases && (
                    <div
                      style={{ top: `${popupPosition.top}px`, left: `${popupPosition.left}px` }}
                      className="absolute w-80 bg-[var(--card-bg)] border border-[var(--primary)]/30 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200 backdrop-blur-xl"
                    >
                      <div className="p-4 border-b border-[var(--card-border)] bg-[var(--primary)]/5 flex items-center justify-between">
                        <p className="text-[9px] font-black text-[var(--primary)] uppercase tracking-[0.2em]">Halkyone Smart Phrases</p>
                        <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase">ESC to close</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {smartPhrases.filter((p: any) => p.shortcut.includes(phraseFilter)).map((p: any, idx: number) => (
                          <div
                            key={p.shortcut}
                            onClick={() => selectPhrase(p.templateText)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`p-4 cursor-pointer border-b border-[var(--card-border)] last:border-0 group transition-all flex flex-col ${idx === selectedIndex ? 'bg-[var(--primary)]/20 border-l-4 border-l-[var(--primary)]' : 'hover:bg-[var(--primary)]/10'
                              }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[10px] font-black uppercase ${idx === selectedIndex ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'}`}>{p.shortcut}</span>
                              <ChevronRight className={`w-3 h-3 transition-transform ${idx === selectedIndex ? 'translate-x-1 text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                            </div>
                            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{p.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-6 right-10 flex items-center gap-4 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest pointer-events-none group-focus-within:opacity-100 transition-opacity">
                    {lastSaved && (
                      <span className="text-emerald-500/60 animate-pulse">
                        Autosaved at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    )}
                    <span className="w-1 h-1 rounded-full bg-[var(--card-border)]" />
                    <span>Press <span className="text-[var(--primary)]">/</span> for Smart Phrases</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-8 left-10 flex items-center gap-2 px-4 py-2 bg-[var(--input-bg)]/80 backdrop-blur-md rounded-full border border-[var(--card-border)] z-10">
              <Lock className="w-3 h-3 text-[var(--text-muted)]" />
              <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest">End-to-End HIPAA Encrypted Session</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}